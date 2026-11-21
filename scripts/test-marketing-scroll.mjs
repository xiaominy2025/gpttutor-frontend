// Browser regression against built local assets. No live authentication or API traffic.
import {chromium} from '@playwright/test';
import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';

const web=resolve(process.argv[2]??'.artifacts/release-b-alpha-enabled/web');
const out=resolve('.artifacts/ui-refinement-20261121');
const origin='https://d6owpirihdsus.cloudfront.net';
const results=[];
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false,args:['--disable-features=OverlayScrollbar']});
let blockedWrites=0;
async function protect(context){
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(!['GET','HEAD'].includes(request.method())){blockedWrites++;return route.abort();}
    if(url.origin!==origin)return route.abort();
    if(url.pathname.startsWith('/api/'))return url.pathname==='/api/platform/session'
      ?route.fulfill({json:{signedIn:false}}):route.abort();
    if(url.pathname==='/process/')return route.fulfill({contentType:'text/html',body:'<h1>Independent Process navigation fixture</h1>'});
    const relative=decodeURIComponent(url.pathname.startsWith('/engent-alpha/')?url.pathname.slice(14):url.pathname.slice(1));
    if(relative.includes('..'))return route.abort();
    const file=existsSync(web+'/'+relative)&&extname(relative)?web+'/'+relative:web+'/index.html';
    const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.mp3':'audio/mpeg','.txt':'text/plain'}[extname(file)];
    return route.fulfill({body:readFileSync(file),contentType:type??'application/octet-stream'});
  });
}
async function inspect(page,label){
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const result=await page.evaluate(()=>{
    const roots=[document.body,document.getElementById('root')];
    return {
      width:innerWidth,
      height:innerHeight,
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
      rootScrollports:roots.filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1).map(e=>e.id||e.tagName),
      documentScrollable:document.scrollingElement.scrollHeight>innerHeight,
      contentWidth:document.querySelector('.engent-wrap').getBoundingClientRect().width,
    };
  });
  if(result.horizontalOverflow||result.rootScrollports.length||!result.documentScrollable)throw Error(label+': incorrect page scroll ownership '+JSON.stringify(result));
  const target=await page.evaluate(()=>Math.min(300,document.scrollingElement.scrollHeight-innerHeight));
  await page.evaluate(y=>window.scrollTo(0,y),target);
  await page.waitForFunction(y=>Math.abs(window.scrollY-y)<=1,target);
  await page.evaluate(()=>window.scrollTo(0,0));
  results.push({label,...result});
}
try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await protect(context);
  const page=await context.newPage();
  await page.goto(origin+'/explore');
  const launch=page.getByRole('link',{name:'Launch Decision Process Coach',exact:true});
  await launch.waitFor();
  await page.locator('[data-engent-header] img').evaluate(image=>image.decode());
  for(const width of [1440,1024,768,390]){
    await page.setViewportSize({width,height:900});
    await inspect(page,'Explore '+width);
    if(await launch.getAttribute('href')!=='/process/')throw Error('Process launch changed');
    if(await page.getByRole('link',{name:'Launch Decision Tree Coach',exact:true}).getAttribute('href')!==origin+'/')throw Error('Tree destination changed');
    await page.screenshot({path:out+'/after-explore-'+width+'.png'});
    await page.getByRole('link',{name:'Optimization Coach',exact:true}).first().click();
    await page.waitForFunction(()=>location.hash==='#optimization'&&window.scrollY>0);
    await page.locator('#optimization').getByRole('heading',{name:'Optimization Coach',exact:true}).waitFor();
    await page.goto(origin+'/explore?entry=email');
    const email=page.getByRole('textbox',{name:'Email',exact:true});await email.waitFor();
    const box=await email.boundingBox();if(!box||box.x<0||box.x+box.width>width)throw Error('Email form clipped');
    await email.fill('fixture@example.invalid');
    await page.keyboard.press('Escape');
    if(await email.isVisible())throw Error('Account menu Escape regressed');
    await page.goto(origin+'/explore/process/cases');
    await inspect(page,'Podcasts '+width);
    await page.getByRole('button',{name:'Play episode',exact:true}).click();
    await page.waitForFunction(()=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime>0.1;},{},{timeout:15000});
    await page.getByRole('button',{name:'Pause episode',exact:true}).click();
    await page.goto(origin+'/explore');
  }
  await launch.click();await page.waitForURL(origin+'/process/');
  await page.getByRole('heading',{name:'Independent Process navigation fixture'}).waitFor();
  await page.goto(origin+'/engent-alpha/');await inspect(page,'Homepage');
  await page.goto(origin+'/labs');
  if(await page.locator('.engent-site').count())throw Error('Legacy route unexpectedly uses marketing layout');
  const legacy=await page.evaluate(()=>({bodyHeight:getComputedStyle(document.body).height,rootHeight:getComputedStyle(document.getElementById('root')).height}));
  if(legacy.bodyHeight!=='900px'||legacy.rootHeight!=='900px')throw Error('Legacy shell styles changed');
  await context.close();

  // Genuine headed desktop-window resizing, without a fixed/emulated viewport.
  const desktop=await browser.newContext({viewport:null,serviceWorkers:'block'});await protect(desktop);
  const resized=await desktop.newPage();await resized.goto(origin+'/explore?entry=email');
  const email=resized.getByRole('textbox',{name:'Email',exact:true});await email.waitFor();await email.fill('resize@example.invalid');
  const cdp=await desktop.newCDPSession(resized),{windowId}=await cdp.send('Browser.getWindowForTarget');
  for(const width of [1440,1024,768,1440]){
    const chrome=await resized.evaluate(()=>({w:outerWidth-innerWidth,h:outerHeight-innerHeight}));
    await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal',width:width+chrome.w,height:900+chrome.h}});
    await resized.waitForFunction(w=>innerWidth===w,width);
    if(await email.inputValue()!=='resize@example.invalid')throw Error('Window resizing lost form state');
    await inspect(resized,'Native desktop resize '+width);
  }
  await desktop.close();
  if(blockedWrites)throw Error('Unexpected write attempted during presentation tests');
  writeFileSync(out+'/after-scroll-results.json',JSON.stringify({passed:true,results,podcastPlayback:true,accountForm:true,hashNavigation:true,legacyStylesPreserved:true,nativeDesktopResizing:true,independentProcessNavigationFixture:true,realApiCalls:0,paidCalls:0},null,2));
  console.log(JSON.stringify({passed:true,measurements:results.length,realApiCalls:0,paidCalls:0}));
}finally{await browser.close();}
