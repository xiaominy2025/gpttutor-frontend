// Same-origin Alpha edge-policy regression using BOTH real adapters; synthetic auth only.
import {createServer} from 'node:https';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {chromium} from '@playwright/test';import {emailPlatform} from '../server/platform/release-b-app.mjs';
const root=process.argv[2];if(!root)throw Error('Supply companion Tree checkout');
const {fixture,memoryStore}=await import(pathToFileURL(resolve(root,'server/releaseB/test-fixture.mjs'))),{treeBridgeHttp}=await import(pathToFileURL(resolve(root,'server/releaseB/http.mjs')));
const dir=resolve('.artifacts/release-b-edge-headers');mkdirSync(dir,{recursive:true});
const tls={key:readFileSync('.artifacts/release-b-browser/fixture.key'),cert:readFileSync('.artifacts/release-b-browser/fixture.crt')};
const staticCsp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
const role='arn:aws:sts::771049112957:assumed-role/engent-platform-alpha-runtime',results=[];let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--host-resolver-rules=MAP explore.engent.test 127.0.0.1','--no-proxy-server']});
 for(const mobile of [false,true])for(const mode of ['before','referrer-only','proposed']){
  const f=fixture();let origin,http,platform,authorizes=0,starts=0,formOrigin=null,cspBlocked=false;
  const server=createServer(tls,async(req,res)=>{try{
   let body='';for await(const b of req)body+=b;
   const path=new URL(req.url,'https://fixture').pathname,e={rawPath:path,body,headers:req.headers,requestContext:{http:{method:req.method}}};
   let r;
   if(path==='/explore')r={statusCode:200,headers:{'Content-Type':'text/html'},body:'<h1>Explore fixture</h1><form method="post" action="/api/shared/email/login"><button>Launch Tree</button></form>'};
   else if(path==='/'){const root=(req.headers.cookie??'').match(/__Host-decision-lab-session=([^;]+)/)?.[1];const p=await f.broker.participant(root);r={statusCode:200,headers:{'Content-Type':'text/html'},body:'<h1>Tree student</h1>'};}
   else if(path.startsWith('/api/platform/')){if(path.endsWith('/authorize'))authorizes++;r=await platform(e);}
   else {if(path==='/api/shared/email/login')formOrigin=req.headers.origin;r=await http(e);}
   const headers={...r.headers};
   // Precisely emulate CloudFront default vs override, not a different auth protocol.
   if(mode==='before'||!headers['Referrer-Policy'])headers['Referrer-Policy']=mode==='before'?'no-referrer':'strict-origin';
   if(mode!=='proposed'||!headers['Content-Security-Policy'])headers['Content-Security-Policy']=staticCsp;
   res.writeHead(r.statusCode,{...headers,...(r.cookies?.length?{'Set-Cookie':r.cookies}:{})});res.end(r.body);
  }catch{res.writeHead(500);res.end('Fixture failed');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='https://explore.engent.test:'+server.address().port;
  http=treeBridgeHttp({broker:f.broker,enabled:true,callerRole:role,exploreOrigin:origin,treeOrigin:origin});
  platform=emailPlatform({store:memoryStore(),enabled:true,origin,treeOrigin:origin,now:()=>1000,fallback:async()=>({statusCode:200}),invoke:async(a,v)=>{
   if(a==='start')starts++;const path='/internal/platform/email/'+a,r=await http({rawPath:path,routeKey:'POST '+path,headers:{'content-type':'application/json'},body:JSON.stringify(v),requestContext:{http:{method:'POST'},authorizer:{iam:{accountId:'771049112957',userArn:role+'/fixture'}}}});
   if(r.statusCode!==200)throw Object.assign(Error('Fixture bridge failure'),{status:r.statusCode});return JSON.parse(r.body);
  }});
  const context=await browser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block',viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Content Security Policy'))cspBlocked=true;});
  try{
   await page.goto(origin+'/explore');
   const pending=await page.evaluate(async()=>{const call=async(p,v)=>{const r=await fetch('/api/platform/'+p,{method:v?'POST':'GET',headers:v?{'Content-Type':'application/json'}:{},body:v?JSON.stringify(v):undefined});if(!r.ok)throw Error('Fixture failed');return r.json();};const b=await call('email/bootstrap');await call('email/start',{email:'fixture@example.test',csrf:b.csrf});await call('email/finish',{csrf:b.csrf,code:'123456'});return call('session');});
   assert.equal(pending.pendingSignIn,true);const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/shared/email/login');
   await page.getByRole('button',{name:'Launch Tree'}).click();const first=await response;
   if(mode==='before'){assert.equal(first.status(),403);assert.equal(formOrigin,'null');assert.equal(authorizes,0);}
   else if(mode==='referrer-only'){await page.waitForLoadState('domcontentloaded');assert.equal(first.status(),200);assert.equal(formOrigin,origin);assert.equal(authorizes,0);assert.equal(cspBlocked,true);}
   else{
    await page.getByRole('heading',{name:'Tree student'}).waitFor();assert.equal(formOrigin,origin);assert.equal(authorizes,1);
    assert.equal((await page.evaluate(async()=> (await fetch('/api/platform/session')).json())).signedIn,true);
    const out=await page.evaluate(async()=>{const r=await fetch('/api/platform/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return r.json();});assert.equal(out.scope,'participating-browser');
    assert.equal((await page.evaluate(async()=> (await fetch('/api/shared/email/status')).json())).signedIn,false);
   }
   assert.equal(starts,1);results.push({viewport:mobile?'mobile':'desktop',mode,initialStatus:first.status(),nullOrigin:formOrigin==='null',cspBlocked,oneSyntheticCode:true,pass:true});
  }finally{await context.close();await new Promise(r=>server.close(r));}
 }
 writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.length,results,scope:'Alpha same-origin; production cross-origin edge headers remain a separate gate. No AWS/real OTP/users.'}));
}finally{await browser?.close();}
