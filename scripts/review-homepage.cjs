const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const output = path.resolve(process.env.ENGENT_REVIEW_OUTPUT || 'review-output');
fs.mkdirSync(output, { recursive: true });
const base = 'http://engent-preview.test';

async function fixture(page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base) {
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.split('/').includes('..') || pathname.includes('\\')) return route.abort();
      const file = path.join('dist', ['/', '/explore', '/labs'].includes(pathname) ? 'index.html' : pathname);
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.fulfill({ status:404 });
    }
    if (url.hostname === 'practice-fixture.example.invalid') {
      return route.fulfill({ json:{status:'success',data:{title:'Decision-Making Lab',placeholder:'Ask a question',strategicThinkingLens:'Fixture answer',followUpPrompts:['What would change the outcome?'],conceptsToolsPractice:[]}}, headers:{'access-control-allow-origin':'*'} });
    }
    return route.abort();
  });
}

async function checks(browser) {
  for (const [mode, device] of Object.entries({desktop:{viewport:{width:1440,height:1000}}, mobile:devices['iPhone 13']})) {
    const page = await browser.newPage({ ...device, reducedMotion: 'no-preference' });
    await fixture(page);
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.goto(base);
    await page.getByRole('heading',{level:1}).waitFor(); if (mode === 'desktop') await page.keyboard.press('Tab');
    if (mode === 'desktop') assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content'); await page.evaluate(() => document.activeElement.blur());
    assert.equal(await page.locator('#decision-tools article').count(),6);
    assert.equal(await page.getByRole('link',{name:'Launch Decision Tree Coach'}).count(),0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:path.join(output,'engent-home-'+mode+'.png'),fullPage:true});
    const stage = page.locator('.coach-stage');
    assert.equal(await stage.locator('img').count(),1);
    await page.getByRole('button',{name:'Play introduction'}).click();
    const changingPath = stage.locator('path[stroke-dasharray]').first();
    const before = await changingPath.getAttribute('stroke-dashoffset');
    await page.waitForFunction(initial => {
      const line = document.querySelector('.coach-stage path[stroke-dasharray]');
      return line && line.getAttribute('stroke-dashoffset') !== initial;
    }, before);
    await page.getByRole('button',{name:'Pause'}).click();
    const position = page.getByRole('slider',{name:'Introduction position'});
    const titles = ['Decision Process Coach','Forecasting Coach','Scenario Analysis Coach','Decision Tree Coach','Simulation Coach','Optimization Coach'];
    for (const [index, title] of titles.entries()) {
      for (const offset of [.1, 1, 4, 8, 9.5]) {
        await position.fill(String(Math.round((index * 9.6 + offset) * 10) / 10));
        assert.equal(await stage.locator('strong').innerText(), title);
        assert.equal(await stage.locator('.coach-workspace').count(), 1);
        const unexpectedFills = await stage.locator('path[stroke]:not([fill])').evaluateAll(
          lines => lines.filter(line => getComputedStyle(line).fill !== 'none').length
        );
        assert.equal(unexpectedFills, 0);
      }
    }
    await position.fill('8');
    assert.deepEqual(await stage.locator('svg text').allTextContents(), ['1', 'Objectives', '2', 'Analysis', '3', 'Human Judgment']);
    await position.press('End');
    await page.getByRole('button',{name:'Replay'}).waitFor();
    await position.fill('34');
    await stage.screenshot({path:path.join(output,'engent-animation-'+mode+'.png')});
    await page.getByRole('link',{name:'Explore Decision Tree Coach'}).click();
    assert.equal(page.url(),base+'/explore#tree');
    await page.reload();
    await page.getByRole('heading',{name:'Explore Engent Labs.'}).waitFor();
    await page.locator('#tree').getByRole('button',{name:'Open illustration'}).click();
    await page.getByRole('button',{name:'Play demo'}).waitFor();
    await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({path:path.join(output,'engent-explore-'+mode+'.png'),fullPage:true});
    await page.getByRole('link',{name:'Open Practice Lab'}).click();
    assert.equal(page.url(),base+'/labs');
    assert.equal((await page.reload()).status(),200);
    await page.getByText('Select a practice lab').waitFor();
    await page.getByRole('heading',{name:'Decision-Making Lab'}).click();
    await page.getByPlaceholder('Ask a question').waitFor();
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base);
    for (const title of titles) {
      assert.equal(await stage.locator('strong').innerText(), title);
      assert.equal(await stage.locator('.coach-workspace').evaluate(el => getComputedStyle(el).opacity), '1');
      await page.getByRole('button',{name:'Next still'}).click();
    }
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(mode+' layout, keyboard, animation, transitions, replay, reduced motion, Explore, and Practice Lab passed');
  }
}

async function exportVideo(browser) {
  const page = await browser.newPage({viewport:{width:1050,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
  await fixture(page);
  await page.goto(base);
  const stage = page.locator('.coach-stage');
  const slider = page.getByRole('slider',{name:'Introduction position'});
  const target = path.join(output,'engent-six-coach-introduction.mp4');
  const encoder = spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','12','-f','image2pipe','-vcodec','mjpeg','-i','-','-vf','scale=960:540','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',target],{stdio:['pipe','ignore','inherit']});
  const done = new Promise((resolve,reject) => {
    encoder.once('error',reject);
    encoder.once('exit',code => code===0 ? resolve() : reject(new Error('ffmpeg exit '+code)));
  });
  for (let frame=0; frame<692; frame++) {
    await slider.fill(String(Math.round(Math.max(.1,Math.min(57.6,frame/12))*10)/10));
    const image = await stage.screenshot({type:'jpeg',quality:88});
    if (!encoder.stdin.write(image)) await new Promise(resolve => encoder.stdin.once('drain',resolve));
  }
  encoder.stdin.end();
  await done;
  await page.close();
  console.log('Exported 57.67 second H.264 preview');
}

(async () => {
  const browser = await chromium.launch(process.env.ENGENT_BROWSER_CHANNEL ? { channel: process.env.ENGENT_BROWSER_CHANNEL } : {});
  try { if (process.argv.includes('--export')) await exportVideo(browser); else await checks(browser); }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
