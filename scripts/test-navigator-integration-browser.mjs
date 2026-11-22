// Built candidate only. All traffic is intercepted; no live AI/auth/account requests.
import{chromium}from'@playwright/test';import{readFileSync,existsSync,mkdirSync,writeFileSync}from'node:fs';import{resolve,extname}from'node:path';import assert from'node:assert/strict';
const root=resolve('.artifacts/navigator-alpha-integration/web'),out=resolve('.artifacts/navigator-alpha-integration/browser'),origin='https://d6owpirihdsus.cloudfront.net';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:false}),results=[];
try{for(const width of[1440,1024,768,390]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});let turns=0,bootstrap=0,blocked=0;const blockedPaths=[],externalBlocked=[];
 await c.route('**/*',r=>{
  const q=r.request(),u=new URL(q.url());if(u.origin!==origin){externalBlocked.push(u.origin+u.pathname);return r.abort();}
  if(u.pathname==='/api/platform/session'&&q.method()==='GET')return r.fulfill({json:{signedIn:false}});
  if(u.pathname==='/api/platform/navigator/session'&&q.method()==='POST'){bootstrap++;return r.fulfill({json:{ready:true}});}
  if(u.pathname==='/api/platform/navigator'&&q.method()==='POST'){
   const b=q.postDataJSON();turns++;assert(turns<=4);assert.equal(b.history.length,(turns-1)*2);if(turns>1)assert.equal(b.continuation,'fixture-'+(turns-1));
   const all=[{dimension:'objectives',question:'How can I clarify my priorities?'},{dimension:'analysis',question:'How can I examine my assumptions?'},{dimension:'judgment',question:'How can I weigh a difficult compromise?'}];
   return r.fulfill({json:{reply:'Fixture reasoning '+turns+'\n\nA transferable reasoning move.',done:turns===4,continuation:turns===4?null:'fixture-'+turns,followUps:turns===4?[]:all.slice(turns-1)}});
  }
  if(u.pathname.startsWith('/api/')||!['GET','HEAD'].includes(q.method())){blocked++;blockedPaths.push(q.method()+' '+u.pathname);return r.abort();}
  const relative=decodeURIComponent(u.pathname.startsWith('/engent-alpha/')?u.pathname.slice(14):u.pathname.slice(1));if(relative.includes('..'))return r.abort();
  const file=existsSync(root+'/'+relative)&&extname(relative)?root+'/'+relative:root+'/index.html',mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.txt':'text/plain'}[extname(file)];return r.fulfill({body:readFileSync(file),contentType:mime??'application/octet-stream'});
 });
 const p=await c.newPage();p.setDefaultTimeout(10000);await p.goto(origin+'/explore');const nav=p.getByRole('heading',{name:'AI Decision Navigator',exact:true}).first();await nav.waitFor();
 assert.equal(await p.locator('.engent-explore-coach').count(),6);assert.equal(await p.locator('.navigator-intro a').count(),0);assert.equal(await p.locator('.navigator-art-mark').count(),33);
 assert(await nav.evaluate(n=>n.compareDocumentPosition(document.querySelector('#process'))&Node.DOCUMENT_POSITION_FOLLOWING));
 assert.equal(await p.getByRole('link',{name:'Launch Decision Process Coach',exact:true}).getAttribute('href'),'/process/');assert.equal(await p.getByRole('link',{name:'Launch Decision Tree Coach',exact:true}).getAttribute('href'),origin+'/');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await p.evaluate(()=>[document.body,document.getElementById('root')].some(x=>x.scrollHeight>x.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(x).overflowY))),false);
 for(const article of await p.locator('.engent-explore-coach').all()){
  const geometry=await article.locator('.coach-overlay').evaluate(b=>{const r=b.getBoundingClientRect(),s=b.closest('.coach-stage').getBoundingClientRect();return{right:s.right-r.right,bottom:s.bottom-r.bottom,width:r.width,height:r.height};});
  assert(Math.abs(geometry.right-6)<2&&Math.abs(geometry.bottom-6)<2);assert.equal(geometry.width,34);assert.equal(geometry.height,34);
 }
 const launch=p.getByRole('button',{name:'Open Decision Navigator',exact:true}),processLaunch=p.getByRole('link',{name:'Launch Decision Process Coach',exact:true});
 const buttonStyle=locator=>locator.evaluate(b=>{const s=getComputedStyle(b);return Object.fromEntries(['width','height','backgroundColor','color','padding','borderRadius','borderWidth'].map(k=>[k,s[k]]));});
 assert.deepEqual(await buttonStyle(launch),await buttonStyle(processLaunch));
 const navControl=p.locator('.navigator-art-playback');await navControl.click();await p.mouse.move(0,0);await p.waitForTimeout(250);
 const circleStyle=locator=>locator.evaluate(b=>{const s=getComputedStyle(b);return Object.fromEntries(['width','height','borderWidth','borderColor','borderRadius','backgroundColor','color','right','bottom'].map(k=>[k,s[k]]));});
 const reference=await circleStyle(navControl),icon=await navControl.locator('svg').innerHTML();
 for(const article of await p.locator('.engent-explore-coach').all()){
  const control=article.locator('.coach-overlay');assert.deepEqual(await circleStyle(control),reference);assert.equal(await control.locator('svg').innerHTML(),icon);
  assert.equal(await control.evaluate(b=>getComputedStyle(b,'::after').width),'44px');
  await control.hover();await p.waitForTimeout(250);const hover=await control.evaluate(b=>getComputedStyle(b).backgroundColor);await navControl.hover();await p.waitForTimeout(250);assert.equal(hover,await navControl.evaluate(b=>getComputedStyle(b).backgroundColor));await p.mouse.move(0,0);
  await p.keyboard.press('Tab');await control.focus();assert.equal(await control.evaluate(b=>getComputedStyle(b).outlineWidth),'2px');assert.equal(await control.evaluate(b=>getComputedStyle(b).outlineOffset),'2px');
  await p.keyboard.press('Enter');await article.getByRole('button',{name:'Pause',exact:true}).waitFor();const slider=article.getByRole('slider');await p.waitForFunction(e=>Number(e.value)>.1,await slider.elementHandle(),{timeout:10000});
  await p.keyboard.press('Space');await article.getByRole('button',{name:'Resume',exact:true}).waitFor();const paused=await slider.inputValue();await p.waitForTimeout(60);assert.equal(await slider.inputValue(),paused);
  await slider.focus();await p.keyboard.press('End');await article.getByRole('button',{name:'Replay',exact:true}).waitFor();assert.equal(Number(await slider.getAttribute('max')),9.6);
  await control.focus();await p.keyboard.press('Enter');await article.getByRole('button',{name:'Pause',exact:true}).waitFor();await p.keyboard.press('Space');
 }
 await p.goto(origin+'/explore?entry=email');const email=p.getByRole('textbox',{name:'Email',exact:true});await email.waitFor();const emailBox=await email.boundingBox();assert(emailBox.x>=0&&emailBox.x+emailBox.width<=width+1);await p.keyboard.press('Escape');assert(!await email.isVisible());
 await p.locator('[data-engent-header] summary').click();await p.mouse.click(5,850);assert.equal(await p.locator('[data-engent-header] details[open]').count(),0);
 await p.goto(origin+'/explore');await p.getByRole('heading',{name:'AI Decision Navigator',exact:true}).waitFor();
 const first=p.locator('.engent-explore-coach').first(),play=first.getByRole('button',{name:'Play demo',exact:true});await play.focus();await p.keyboard.press('Enter');await first.getByRole('button',{name:'Pause',exact:true}).waitFor();await first.getByRole('button',{name:'Pause',exact:true}).click();await first.getByRole('button',{name:'Resume',exact:true}).waitFor();
 await p.screenshot({path:out+'/explore-'+width+'.png',fullPage:true});
 const open=p.getByRole('button',{name:'Open Decision Navigator'});await open.click();const dialog=p.getByRole('dialog',{name:'AI Decision Navigator'});await dialog.waitFor();assert.equal(turns,0);assert.equal(bootstrap,0);
 await p.keyboard.press('Tab');assert(await dialog.evaluate(d=>d.contains(document.activeElement)));await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await open.evaluate(x=>x===document.activeElement));await open.click();
 const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);
 await dialog.getByRole('textbox').fill('Synthetic decision for anonymous layout validation');await dialog.getByRole('button',{name:'Send decision'}).click();await dialog.getByText('Fixture reasoning 1',{exact:false}).waitFor();
 for(let turn=2;turn<=4;turn++){await dialog.getByRole('button',{name:/How can I/}).first().click();await dialog.getByText('Fixture reasoning '+turn,{exact:false}).waitFor();}
 assert.equal(turns,4);assert.equal(bootstrap,1);assert.equal(await dialog.getByRole('textbox').count(),0);assert.equal(await dialog.getByRole('group',{name:'Explore a follow-up path'}).count(),0);
 await p.screenshot({path:out+'/dialog-'+width+'.png'});await dialog.getByRole('button',{name:'Start New Decision'}).click();await dialog.getByRole('heading',{name:'Welcome to AI Navigator'}).waitFor();await dialog.getByRole('textbox').fill('Unsent draft');await dialog.getByRole('button',{name:'Close Navigator'}).click();await open.click();assert.equal(await dialog.getByRole('textbox').inputValue(),'Unsent draft');await dialog.getByRole('button',{name:'Close Navigator'}).click();await p.reload();await open.click();assert.equal(await dialog.getByRole('textbox').inputValue(),'');await p.keyboard.press('Escape');
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.locator('.navigator-art').waitFor();assert.equal(await p.locator('.navigator-art-mark').first().evaluate(x=>getComputedStyle(x).animationName),'none');await first.getByRole('button',{name:'Show illustration still',exact:true}).click();await first.getByRole('button',{name:'Show poster',exact:true}).waitFor();
 assert.equal(blocked,0,JSON.stringify(blockedPaths));results.push({width,anonymous:true,coachSections:6,playBottomRight:6,circularControlsMatchNavigator:6,compactLaunchMatchesProcess:true,allSixPlaybackReplay:true,authenticationControls:true,keyboardPlayback:true,navigatorArtwork:true,dialogFocusEscape:true,fourInteractions:true,continuationForwarding:true,bootstrapWithoutAccount:true,closeReopen:true,refreshClearsTranscript:true,reducedMotion:true,horizontalOverflow:false,nestedPageScrollbar:false,blockedRequests:blocked,externalBlocked});await c.close();
}writeFileSync(out+'/results.json',JSON.stringify({passed:true,results,fixtureOnly:true,realApiCalls:0,paidCalls:0},null,2));console.log(JSON.stringify({passed:true,widths:results.length,realApiCalls:0,paidCalls:0}));}finally{await browser.close();}


