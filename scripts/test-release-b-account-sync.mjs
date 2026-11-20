import {chromium} from '@playwright/test';import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {extname,resolve} from 'node:path';
// Local builds only: all browser requests are fulfilled from disk or API fixtures.
// Usage: node scripts/test-release-b-account-sync.mjs <frontend-web-directory> <tree-web-directory>
if(!process.argv[2]||!process.argv[3])throw Error('Supply both locally built web directories');
const origin='https://d6owpirihdsus.cloudfront.net',front=resolve(process.argv[2]),tree=resolve(process.argv[3]),out=resolve('.artifacts/account-ux-paired-browser.json');
for(const root of [front,tree])if(!existsSync(root+'/index.html'))throw Error('Missing local index.html');
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];try{
for(const [viewport,width,height]of [['desktop',1365,900],['mobile',390,844]])for(const advanced of [false,true]){
 const state={signedIn:false,starts:0,finishes:0,logout:0,handoff:null};const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
 await c.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(u.origin!==origin)return r.abort();const p=u.pathname;
 if(p.startsWith('/api/')){
  if(p==='/api/platform/session')return r.fulfill({json:{signedIn:state.signedIn,emailBridge:state.signedIn,treeLaunchUrl:state.signedIn?origin+'/api/shared/email/login':undefined,entitlements:{tree:{advanced}}}});
  if(p==='/api/session')return r.fulfill({status:state.signedIn?200:401,json:state.signedIn?{userId:'fixture-paired-owner',emailVerified:true,accountType:advanced?'advanced':'student'}:{}});
  if(p==='/api/shared/email/status')return r.fulfill({json:{signedIn:state.signedIn,advanced}});
  if(p==='/api/platform/email/bootstrap')return r.fulfill({json:{csrf:'x'.repeat(43)}});
  if(p==='/api/platform/email/start'){state.starts++;return r.fulfill({json:{codeSent:true}});}
  if(p==='/api/platform/email/finish'){state.finishes++;state.signedIn=true;return r.fulfill({json:{needsHandoff:true}});}
  if(p==='/api/shared/email/login'){state.handoff=new URLSearchParams(q.postData()).get('returnTo');return r.fulfill({contentType:'text/html',body:'<script>location.replace("/")</script>'});}
  if(p==='/api/shared/email/logout'){state.logout++;state.signedIn=false;return r.fulfill({json:{ok:true,scope:'participating-browser'}});}
  if(p==='/api/health')return r.fulfill({json:{status:'ok'}});
  throw Error('Unexpected fixture API '+p);
 }
 const platform=p.startsWith('/engent-alpha/')||p.startsWith('/explore');const root=platform?front:tree;const relative=platform&&p.startsWith('/engent-alpha/')?p.slice('/engent-alpha/'.length):p.slice(1);if(relative.includes('..'))throw Error('Unsafe fixture path');const path=root+'/'+relative;const file=existsSync(path)&&extname(path)?path:root+'/index.html';const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain'};return r.fulfill({body:readFileSync(file),contentType:types[extname(file)]??'application/octet-stream'});
 });
 const p=await c.newPage();await p.goto(origin+'/engent-alpha/',{waitUntil:'domcontentloaded'});await p.locator('[data-engent-header="1.1.0"]').waitFor();await p.getByRole('link',{name:'Explore Coaches',exact:true}).click();await p.waitForURL(origin+'/explore');await p.locator('.euh-menu > summary').click();await p.getByRole('button',{name:'Continue as Guest',exact:true}).click();await p.getByRole('link',{name:'Launch Decision Tree Coach',exact:true}).click();await p.waitForURL(origin+'/');await p.getByRole('heading',{name:'Decision Map',exact:true}).waitFor();await p.getByLabel('Account: Guest',{exact:true}).click();await p.getByRole('button',{name:'Guest',exact:true}).click();if(await p.getByRole('dialog').count())throw Error('Redundant guest prompt');
 await p.getByLabel('Account: Guest',{exact:true}).click();await p.getByRole('link',{name:'Sign in with Email',exact:true}).click();await p.waitForURL(origin+'/explore?entry=email&return=tree');await p.getByRole('textbox',{name:'Email',exact:true}).fill('synthetic@example.test');await p.getByRole('button',{name:'Send sign-in code',exact:true}).click();await p.getByRole('textbox',{name:'Email code'}).fill('000000');await p.getByRole('button',{name:'Verify and sign in'}).click();await p.waitForURL(origin+'/');await p.getByLabel('Account: '+(advanced?'Advanced':'Student'),{exact:true}).waitFor();if(state.handoff!=='tree'||state.starts!==1||state.finishes!==1)throw Error('Origin return mismatch');
 const exploreTab=await c.newPage();await exploreTab.goto(origin+'/explore');await exploreTab.getByLabel('Account: '+(advanced?'Advanced':'Student'),{exact:true}).waitFor();
 await p.bringToFront();await p.getByLabel('Account: '+(advanced?'Advanced':'Student'),{exact:true}).click();
 if(advanced&&await p.getByRole('link',{name:'Manage Tree access',exact:true}).count())throw Error('Advanced redundant access link');
 if(!advanced&&await p.getByRole('link',{name:'Manage Tree access',exact:true}).count()!==1)throw Error('Student access action absent');
 await p.getByRole('button',{name:'Sign out',exact:true}).click();
 await exploreTab.getByLabel('Account: Guest',{exact:true}).waitFor({timeout:5000});
 await p.getByLabel('Account: Guest',{exact:true}).waitFor();if(p.url()!==origin+'/'||state.logout!==1)throw Error('Logout moved origin');await p.getByRole('heading',{name:'Decision Map',exact:true}).waitFor();results.push({viewport,role:advanced?'Advanced':'Student',homeExploreGuestTree:true,guestAutomaticAndIdempotent:true,oneSyntheticCode:true,treeOriginReturn:true,signOutStaysTree:true,guestAfterSignOut:true,treeBroadcastUpdatesExplore:true,roleMenuCorrect:true,backend:'mock-only',awsRequestsForwarded:0});await c.close();
}writeFileSync(out,JSON.stringify({results,sourceFrontend:'local-working-source',sourceTree:'local-working-source',sharedHeader:'1.1.0',realEmails:0,awsWrites:0},null,2));console.log(JSON.stringify({pairedFlows:results.length,passed:true,realEmails:0,awsRequestsForwarded:0}));}finally{await browser.close();}

