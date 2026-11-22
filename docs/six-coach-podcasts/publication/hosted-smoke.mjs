// Hosted Alpha smoke. Same-origin reads only; all writes and paid AI are blocked.
import { chromium } from '@playwright/test';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const origin='https://d6owpirihdsus.cloudfront.net',web=resolve('.artifacts/navigator-alpha-integration/web'),out='.artifacts/podcasts39-publication-501f2b5/hosted';mkdirSync(out,{recursive:true});
const baseline=JSON.parse(readFileSync('docs/six-coach-podcasts/baseline-collections.json')),added=JSON.parse(readFileSync('src/components/coachPodcasts.json')),collections={...baseline,...added};
const browser=await chromium.launch({channel:'chrome',headless:false}),results=[];let blocked=0;const blockedPaths=[];const audioAssets=new Set(),pageErrors=[];
async function protect(c){await c.route('**/*',r=>{
 const q=r.request(),u=new URL(q.url());if(u.origin!==origin||!['GET','HEAD'].includes(q.method())){blocked++;blockedPaths.push({method:q.method(),origin:u.origin,path:u.pathname});return r.abort();}
 if(u.pathname.endsWith('.mp3'))audioAssets.add(u.pathname);
 return r.continue();
});}
async function noOverflow(p){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.equal(await p.evaluate(()=>[document.body,document.getElementById('root')].some(e=>e&&e.scrollHeight>e.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(e).overflowY))),false);}
try{
for(const width of [1440,1024,768,390]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',hasTouch:width===390,reducedMotion:'reduce'});await protect(c);const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>pageErrors.push(e.message));
 await p.goto(origin+'/engent-alpha/');await p.getByRole('heading',{name:'Explore Our Decision Tools',exact:true}).waitFor();await noOverflow(p);await p.screenshot({path:out+'/homepage-'+width+'.png',fullPage:true});
 await p.goto(origin+'/explore');await p.getByRole('button',{name:'Open Decision Navigator',exact:true}).waitFor();await noOverflow(p);
 assert.equal(await p.getByRole('link',{name:/Explore Cases:/}).count(),7);assert.equal(await p.getByText('Cases coming soon',{exact:true}).count(),0);
 assert.equal(await p.locator('.engent-launch-control').count(),3);assert.equal(await p.locator('.engent-explore-coach .engent-status').filter({hasText:'Coming Soon'}).count(),4);
 for(const label of ['Open Decision Navigator','Launch Decision Process Coach','Launch Decision Tree Coach']){
  const control=p.getByRole(label.startsWith('Open')?'button':'link',{name:label,exact:true});await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();assert.equal(b.width,44);assert.equal(b.height,44);assert.equal(await control.innerText(),'');
  const wrap=control.locator('..'),tip=wrap.getByRole('tooltip',{includeHidden:true});assert.equal(await tip.isVisible(),false);
  if(width!==390){await control.hover();await tip.waitFor({state:'visible'});assert.equal(await tip.innerText(),label);const box=await tip.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);await p.mouse.move(0,0);}
  await p.keyboard.press('Tab');await control.focus();await tip.waitFor({state:'visible'});assert.equal(await control.evaluate(b=>getComputedStyle(b).outlineWidth),'2px');await p.keyboard.press('Escape');await tip.waitFor({state:'hidden'});await p.getByRole('heading',{name:'Explore Decision Coaches',exact:true}).focus();
 }
 await p.screenshot({path:out+'/explore-'+width+'.png',fullPage:true});
 const open=p.getByRole('button',{name:'Open Decision Navigator',exact:true});if(width===390)await open.tap();else await open.click();const d=p.getByRole('dialog',{name:'AI Decision Navigator',exact:true});await d.waitFor();await d.getByRole('textbox').fill('Unsent local decision');await p.keyboard.press('Escape');await d.waitFor({state:'hidden'});assert(await open.evaluate(e=>document.activeElement===e));await open.click();assert.equal(await d.getByRole('textbox').inputValue(),'Unsent local decision');await d.getByRole('button',{name:'Close Navigator'}).click();
 for(const [name,path]of [['Launch Decision Process Coach','/process/'],['Launch Decision Tree Coach','/']]){const link=p.getByRole('link',{name,exact:true});assert.equal(await link.getAttribute('href'),name.includes('Tree')?origin+'/':path);if(width===390)await link.tap();else await link.click();await p.waitForURL(origin+path);await p.locator('[data-engent-header] [aria-label="Account: Guest"]').waitFor();if(path==='/')await p.waitForFunction(()=>!document.body.innerText.includes('Checking account access'),null,{timeout:15000});else await p.getByRole('textbox',{name:'Define Your Decision',exact:true}).waitFor();await p.goto(origin+'/explore');await open.waitFor();}
 const media=[];
 for(const id of ['process','forecast','scenario','tree','simulation','optimization','navigator']){
  await p.getByRole('link',{name:id==='navigator'?'Explore Cases: AI Decision Navigator':'Explore Cases: '+({process:'Decision Process',forecast:'Forecasting',scenario:'Scenario Analysis',tree:'Decision Tree',simulation:'Simulation',optimization:'Optimization'}[id])+' Coach',exact:true}).click();
  await p.getByRole('heading',{name:collections[id].title+' Business Case Podcasts',exact:true}).waitFor();const rows=p.locator('.engent-case-episodes>button');assert.equal(await rows.count(),collections[id].cases.length);
  assert.deepEqual(await rows.locator('.engent-case-title').allTextContents(),collections[id].cases.map(e=>e.title));await noOverflow(p);
  const count=width===1440?collections[id].cases.length:2;
  for(let i=0;i<count;i++){
   const prior=await p.locator('audio').elementHandle();if(i===1){await p.getByRole('button',{name:'Play episode',exact:true}).click();await p.getByRole('button',{name:'Pause episode',exact:true}).waitFor();}await rows.nth(i).click();assert.equal(await p.getByRole('heading',{name:collections[id].cases[i].title,exact:true}).count(),1);if(i>0)assert.equal(await prior.evaluate(a=>a.paused),true);
   await p.locator('audio').evaluate(a=>{a.muted=true;});await p.getByRole('button',{name:'Play episode',exact:true}).click();await p.waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused&&a.currentTime>.1;},null,{timeout:10000});await p.getByRole('button',{name:'Pause episode',exact:true}).click();assert(await p.locator('audio').evaluate(a=>a.paused));
   const expected=collections[id].cases[i].seconds,actual=await p.locator('audio').evaluate(a=>a.duration);assert(Math.abs(actual-expected)<2,JSON.stringify({id,i,actual,expected}));
  }
  await rows.first().focus();await p.keyboard.press('ArrowDown');await rows.last().focus();await p.keyboard.press('Enter');assert.equal(await rows.last().getAttribute('aria-pressed'),'true');await noOverflow(p);
  if([1440,390].includes(width))await p.screenshot({path:out+'/podcasts-'+id+'-'+width+'.png',fullPage:true});
  await p.reload();await p.getByRole('heading',{name:collections[id].title+' Business Case Podcasts',exact:true}).waitFor();media.push({coach:id,episodes:collections[id].cases.length,playbackTested:count,episodeSwitch:true,keyboard:true,directRefresh:true});await p.goto(origin+'/explore');await open.waitFor();
 }
 results.push({width,compactControls:3,tooltipsHoverFocusEscape:true,modalDraftAndFocusPreserved:true,directLaunch:true,noOverflow:true,podcasts:media});await c.close();
}
const c=await browser.newContext({viewport:null,serviceWorkers:'block',reducedMotion:'reduce'});await protect(c);const p=await c.newPage(),cd=await c.newCDPSession(p);await p.goto(origin+'/explore');const {windowId}=await cd.send('Browser.getWindowForTarget');for(const path of ['/engent-alpha/','/explore']){await p.goto(origin+path);await p.locator('[data-engent-header]').waitFor();for(const w of[1440,1024,900,800,768,600,1440]){const frame=await p.evaluate(()=>({w:outerWidth-innerWidth,h:outerHeight-innerHeight}));await cd.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal',width:w+frame.w,height:900+frame.h}});await p.waitForFunction(w=>innerWidth===w,w,{timeout:10000});await noOverflow(p);}}await c.close();
writeFileSync(out+'/blocked-requests.json',JSON.stringify({blocked,blockedPaths},null,2));/* Blocked mutations are recorded, never dispatched; Guest Coaches may attempt session initialization. */
assert.equal(pageErrors.length,0,JSON.stringify(pageErrors));assert.equal(audioAssets.size,39);writeFileSync(out+'/results.json',JSON.stringify({passed:true,hosted:true,paidAiCalls:0,projectAuthWrites:0,blockedRequests:blocked,uniquePlayableAssets:audioAssets.size,nativeResize:true,results,pageErrors},null,2)+'\n');console.log(JSON.stringify({passed:true,hosted:true,uniquePlayableAssets:audioAssets.size,widths:results.length,blockedWrites:blockedPaths.filter(x=>!['GET','HEAD'].includes(x.method)).length}));
}finally{await browser.close();}
