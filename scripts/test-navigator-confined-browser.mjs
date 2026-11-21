// Executes only during a separately approved, armed probe window. Never captures a trace/HAR.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const args=process.argv.slice(2);
assert(args.length===3&&args[0]==='--execute-approved-probe'&&['a','b'].includes(args[2]),
 'Required: --execute-approved-probe <frozen-manifest-file> <a|b>');
const manifest=JSON.parse(await readFile(args[1],'utf8'));
assert(manifest.endsAt-manifest.startsAt<=300000&&Date.now()>=manifest.startsAt&&Date.now()<manifest.endsAt,'Probe window closed');
const token=process.env.NAVIGATOR_PROBE_TOKEN;
assert(/^[A-Za-z0-9_-]{43}$/.test(token??''),'One-use capability required in private environment');
const base='https://d6owpirihdsus.cloudfront.net',path='/api/platform/navigator/session';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'block'});
try{
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  const allowed=url.origin===base&&(request.method()==='GET'||
   (request.method()==='POST'&&url.pathname===path&&request.headers()['x-engent-navigator-probe']===token));
  await (allowed?route.continue():route.abort('blockedbyclient'));
 });
 const page=await context.newPage();await page.goto(base+'/explore',{waitUntil:'domcontentloaded'});
 const post=action=>page.evaluate(async({path,token,network,action})=>{
  const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-engent-navigator-probe':token},body:JSON.stringify({network,action})});
  return {status:response.status,body:await response.json()};
 },{path,token,network:args[2],action});
 const boot=await post('bootstrap');assert.equal(boot.status,200,'Bootstrap failed; do not retry');
 const cookies=(await context.cookies(base)).filter(c=>c.name==='__Host-engent-navigator');
 assert.equal(cookies.length,1,'Browser did not accept exactly one test cookie');
 const cookie=cookies[0];assert(cookie.secure&&cookie.httpOnly&&cookie.sameSite==='Strict'&&cookie.path==='/'&&cookie.domain==='d6owpirihdsus.cloudfront.net','Cookie attributes mismatch');
 assert.equal(await page.evaluate(()=>document.cookie.split(';').some(c=>c.trim().startsWith('__Host-engent-navigator='))),false,'HttpOnly cookie exposed to JS');
 const verify=await post('verify');assert.equal(verify.status,200,'Cookie verification failed; do not retry');
 assert.equal(verify.body.cookieAccepted,true,'Cookie was not automatically accepted by the core validator');
 const matches=boot.body.sourceIpMatchesExpectedViewer===true&&verify.body.sourceIpMatchesExpectedViewer===true;
 console.log(JSON.stringify({network:args[2],browserCookieAccepted:true,httpOnly:true,secure:true,sameSite:'Strict',hostOnly:true,path:'/',sourceIpMatchesExpectedViewer:matches,providerTransport:'absent'}));
 assert(matches,'Actual viewer-IP attribution did not match; activation stays blocked');
}finally{await context.clearCookies();await context.close();await browser.close();}
