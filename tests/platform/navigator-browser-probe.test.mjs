import {describe,it,expect,vi} from 'vitest';
import {browserProbe} from '../../server/platform/navigator-browser-probe.mjs';
const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api';
const direct={functionVersion:'$LATEST',invokedFunctionArn:arn+':$LATEST'};
const hosted={functionVersion:'2',invokedFunctionArn:arn+':live'};
const origin='https://d6owpirihdsus.cloudfront.net';
function fixture(){
 let time=Date.UTC(2026,10,21,12);const rows=new Map();
 const store={get:vi.fn(async id=>structuredClone(rows.get(id))),replace:vi.fn(async(id,version,value)=>{
  if((rows.get(id)?.version??0)!==version)return false;
  rows.set(id,{...structuredClone(value),version:version+1});return true;
 })};
 const manifest={run:'offline-probe-test',startsAt:time,endsAt:time+300000};
 const options={store,manifest,now:()=>time,environment:{STAGE:'alpha',NAVIGATOR_ENABLED:'false'},signingSecret:async()=> 'test-only-signing-secret-12345678901234567890'};
 const run=browserProbe(options);
 const prepare=(network='a')=>run({operation:'prepare',network,expectedIp:'192.0.2.9'},direct);
 const event=(token,action='bootstrap',cookies=[])=>({rawPath:'/api/platform/navigator/session',routeKey:'POST /api/platform/navigator/session',
  headers:{origin,'x-engent-navigator-probe':token},cookies,body:JSON.stringify({network:'a',action}),
  requestContext:{apiId:'8qmgd1ghdi',stage:'$default',requestId:'test-request',http:{method:'POST',sourceIp:'192.0.2.9'}}});
 return {options,rows,store,run,prepare,event,expire:()=>time+=300000};
}
describe('confined browser probe',()=>{
 it('requires an armed short-lived manifest before any reads or writes',async()=>{
  const f=fixture();expect((await browserProbe({...f.options,manifest:null})({},direct)).statusCode).toBe(503);
  expect(f.store.get).not.toHaveBeenCalled();expect(f.store.replace).not.toHaveBeenCalled();
 });
 it('prepares only through direct IAM and stores hashes rather than raw identity',async()=>{
  const f=fixture();expect((await f.run({operation:'prepare',network:'a',expectedIp:'192.0.2.9'},hosted)).statusCode).toBe(503);
  const r=await f.prepare();expect(r.prepared).toBe(true);
  expect(JSON.stringify([...f.rows.values()])).not.toContain('192.0.2.9');expect(JSON.stringify([...f.rows.values()])).not.toContain(r.token);
  expect((await f.prepare()).statusCode).toBe(503);
 });
 it('uses actual core cookie creation and validation, without quota or AI admission',async()=>{
  const f=fixture(),{token}=await f.prepare(),boot=await f.run(f.event(token),hosted);
  expect(boot.statusCode).toBe(200);expect(boot.cookies[0]).toMatch(/; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=86400$/);
  const r=await f.run(f.event(token,'verify',[boot.cookies[0].split(';')[0]]),hosted);
  expect(JSON.parse(r.body)).toMatchObject({sourceIpMatchesExpectedViewer:true,cookieAccepted:true,providerTransport:'absent'});
  expect((await f.run(f.event(token,'verify'),hosted)).statusCode).toBe(503);
  expect([...f.rows.keys()].every(k=>k.startsWith('probe#offline-probe-test#'))).toBe(true);
 });
 it('reports a missing cookie and actual IP mismatch without exposing either address',async()=>{
  const f=fixture(),{token}=await f.prepare(),e=f.event(token);e.requestContext.http.sourceIp='198.51.100.5';
  const boot=await f.run(e,hosted);expect(JSON.parse(boot.body).sourceIpMatchesExpectedViewer).toBe(false);
  const r=await f.run(f.event(token,'verify'),hosted);expect(JSON.parse(r.body).cookieAccepted).toBe(false);
  expect(boot.body).not.toMatch(/192\.0\.2|198\.51\.100/);
 });
 it('rejects unmarked traffic, wrong origin and expired capabilities',async()=>{
  const f=fixture(),{token}=await f.prepare();
  for(const e of [f.event('invalid'),{...f.event(token),headers:{origin:'https://example.invalid','x-engent-navigator-probe':token}}])
   expect((await f.run(e,hosted)).statusCode).toBe(503);
  f.expire();expect((await f.run(f.event(token),hosted)).statusCode).toBe(503);
 });
 it('allows only one conditional bootstrap when requests race',async()=>{
  const f=fixture(),{token}=await f.prepare();
  const results=await Promise.all([f.run(f.event(token),hosted),f.run(f.event(token),hosted)]);
  expect(results.filter(r=>r.statusCode===200)).toHaveLength(1);
 });
});
