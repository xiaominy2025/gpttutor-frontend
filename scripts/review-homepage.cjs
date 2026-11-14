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
      const isPage = ['/', '/explore', '/labs'].includes(pathname) || /^\/explore\/(simulation|optimization|process)\/cases$/.test(pathname);
      const file = path.join('dist', isPage ? 'index.html' : pathname);
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
    assert.equal(await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Explore Coaches'}).count(),1);
    if (mode === 'desktop') assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content'); await page.evaluate(() => document.activeElement.blur());
    assert.equal(await page.locator('#decision-tools article').count(),6);
    assert.equal(await page.getByRole('link',{name:'Launch Decision Tree Coach'}).count(),0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:path.join(output,'engent-home-'+mode+'.png'),fullPage:true});
    const stage = page.locator('.coach-stage');
    assert.equal(await stage.locator('img').count(),1);
    await stage.scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'Pause'}).waitFor();
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
        const guidanceFits = await stage.locator('.coach-guidance').evaluate(panel => {
          const bounds = panel.getBoundingClientRect();
          return [...panel.children].every(child => {
            const text = child.getBoundingClientRect();
            return text.bottom <= bounds.bottom + 1 && text.right <= bounds.right + 1;
          });
        });
        assert(guidanceFits, `${mode}: ${title} guidance exceeds its panel`);
      }
      await position.fill(String(Math.round((index * 9.6 + 8) * 10) / 10));
      if (index === 1 || index === 4 || index === 5) {
        const safeArea = await stage.evaluate(frame => {
          const bounds = frame.getBoundingClientRect();
          const labels = ['Historical observations', 'Projected forecast', 'Below target', 'Simulated profit', 'Maximize Annual Operating Profit'];
          return [...frame.querySelectorAll('svg text')]
            .filter(label => labels.includes(label.textContent))
            .every(label => label.getBoundingClientRect().bottom <= bounds.bottom - bounds.height * .10);
        });
        assert(safeArea, `${mode}: ${title} labels enter the bottom 10% of the frame`);
      }
      await stage.screenshot({ path: path.join(output, `engent-scene-${index + 1}-${mode}.png`) });
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
    await page.getByRole('heading',{name:'Explore Decision Coaches',exact:true}).waitFor();
    assert.equal(await page.getByRole('navigation',{name:'Main navigation'}).count(),0);
    const tree = page.locator('#tree');
    await tree.getByRole('button',{name:'Play demo'}).focus();
    await page.keyboard.press('Enter');
    await tree.getByRole('button',{name:'Pause'}).click();
    await tree.getByRole('button',{name:'Resume'}).waitFor();
    assert.equal(await page.getByLabel('Media', {exact:true}).count(), 0);
    assert.equal(await page.getByText('Demo description', {exact:true}).count(), 0);
    await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({path:path.join(output,'engent-explore-'+mode+'.png'),fullPage:true});
    await page.getByRole('link',{name:'Explore Cases: Simulation Coach'}).click();
    assert.equal((await page.reload()).status(),200);
    const gallery = page.locator('#simulation-applications');
    const episodeList = gallery.getByRole('group',{name:'All Episodes'});
    const episodes = episodeList.getByRole('button');
    const preview = gallery.locator('#case-preview');
    assert.equal(await episodes.count(), 6);
    assert.equal(await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Simulation Coach'}).count(),1);
    assert.equal(await gallery.getByText('Based on public sources. Not reviewed or endorsed by the organizations mentioned.',{exact:true}).count(),1);
    assert.equal(await preview.getByText('Illustrative scenario',{exact:true}).count(),1);
    const checkContrast = () => episodes.evaluateAll(rows => {
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0,3).map(Number);
        return rgb.reduce((sum,value,i) => {
          const channel = value / 255;
          return sum + [0.2126,0.7152,0.0722][i] *
            (channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
        },0);
      };
      return rows.every(row => [...row.querySelectorAll('span')].every(label => {
        const text = luminance(getComputedStyle(label).color);
        const background = luminance(getComputedStyle(row).backgroundColor);
        return label.getBoundingClientRect().height > 0 &&
          (Math.max(text,background) + .05) / (Math.min(text,background) + .05) >= 4.5;
      }));
    });
    assert(await checkContrast(), `${mode}: resting episode contrast`);
    const previewBounds = await preview.boundingBox();
    const listBounds = await episodeList.boundingBox();
    assert(previewBounds.y + previewBounds.height < listBounds.y, `${mode}: preview must be above the episode list`);
    assert(Math.abs(previewBounds.width - listBounds.width) < 1, `${mode}: preview and list must share a column`);
    await page.screenshot({path:path.join(output,'engent-cases-'+mode+'.png'),fullPage:true});
    for (const episode of await episodes.all()) {
      await episode.hover();
      assert(await checkContrast(), `${mode}: hovered episode contrast`);
      await episode.focus();
      assert(await checkContrast(), `${mode}: focused episode contrast`);
      await page.keyboard.press('Enter');
      assert.equal(await episode.getAttribute('aria-pressed'),'true');
      assert(await checkContrast(), `${mode}: selected episode contrast`);
    }
    await episodes.nth(1).focus();
    await page.keyboard.press('Enter');
    await preview.getByRole('heading',{name:'Aerospace schedule risk'}).waitFor();
    const player = preview.locator('audio');
    assert.equal(await player.getAttribute('preload'), 'none');
    await player.evaluate(audio => audio.play());
    await page.waitForFunction(() => document.querySelector('audio').currentTime > 0);
    await preview.getByLabel('Playback speed').selectOption('1.5');
    assert.equal(await player.evaluate(audio => audio.playbackRate), 1.5);
    await player.evaluate(audio => { audio.currentTime = 15; });
    await page.waitForFunction(() => document.querySelector('audio').currentTime >= 15);
    const original = await player.elementHandle();
    await episodes.first().click();
    assert.equal(await original.evaluate(audio => audio.paused), true);
    assert.equal(await player.evaluate(audio => audio.currentTime), 0);
    await preview.screenshot({path:path.join(output,'engent-case-detail-'+mode+'.png')});
    for (const [coach, title] of [['optimization','The Seat Worth Saving'], ['process','The AI Efficiency Trap']]) {
      assert.equal((await page.goto(base + '/explore/' + coach + '/cases')).status(), 200);
      await preview.getByRole('heading',{name:title,exact:true}).waitFor();
      await player.evaluate(audio => audio.play());
      await page.waitForFunction(() => document.querySelector('audio').currentTime > 0);
      await player.evaluate(audio => audio.pause());
      await preview.getByText('Transcript',{exact:true}).click();
      await page.waitForFunction(() => document.querySelector('.engent-transcript')?.textContent.length > 100);
      await preview.getByText('Transcript',{exact:true}).click();
      await page.screenshot({path:path.join(output,'engent-'+coach+'-player-'+mode+'.png'),fullPage:true});
      if (coach === 'process') {
        await episodes.last().click();
        await preview.getByText('Audio coming soon').waitFor();
        assert.equal(await player.count(),0);
      }
    }
    await page.getByRole('link',{name:'Decision Process Coach'}).click();
    await page.getByRole('link',{name:'Open Legacy Practice Lab'}).click();
    assert.equal(page.url(),base+'/labs');
    assert.equal((await page.reload()).status(),200);
    await page.getByText('Select a practice lab').waitFor();
    await page.getByRole('heading',{name:'Decision-Making Lab'}).click();
    await page.getByPlaceholder('Ask a question').waitFor();
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base);
    await stage.locator('img').waitFor();
    await stage.scrollIntoViewIfNeeded();
    assert.equal(await stage.locator('img').count(),1);
    await page.getByRole('button',{name:'Next still'}).click();
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
