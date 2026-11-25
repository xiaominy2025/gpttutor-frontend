import {it,expect} from 'vitest';
import {createHmac,randomUUID} from 'node:crypto';
import {scenarioQuotaAdmission} from '../../server/platform/scenario-quota-admission.mjs';
import {abuseControls} from '../../server/platform/abuse-controls.mjs';
function fixture(environment='alpha'){
 const rows=new Map();let time=Date.UTC(2026,10,25,12),on=true;
 const copy=x=>x===undefined?undefined:structuredClone(x);
 const check=id=>{if(/BUDGET|REQUEST#|PILOT/.test(id))throw Error('Financial access forbidden');};
 const store={get:async id=>{check(id);return copy(rows.get(id));},replace:async(id,v,value)=>{check(id);if((rows.get(id)?.version??0)!==(v??0))return false;rows.set(id,{...copy(value),version:v+1});return true;},transaction:async changes=>{
  changes.forEach(x=>check(x.id));if(changes.some(x=>(rows.get(x.id)?.version??0)!==(x.previous?.version??0)))return false;
  changes.forEach(x=>rows.set(x.id,{...copy(x.value),version:(x.previous?.version??0)+1}));return true;
 }};
 const origin=environment==='alpha'?'https://d6owpirihdsus.cloudfront.net':'https://www.engentlabs.com',secret='fixture-secret-for-platform-quota-access';
 const app=scenarioQuotaAdmission(environment,{store,controls:abuseControls(store,{now:()=>time}),signingSecret:async()=>secret,now:()=>time,master:{assertEnabled:async()=>{if(!on)throw Error('masterOFF');}}});
 const value='a'.repeat(43)+'.'+(Math.floor(time/1000)+86400),cookie='__Host-engent-navigator='+value+'.'+createHmac('sha256',secret).update('navigator-session#'+value).digest('base64url');
 const proof={origin,cookie,sourceIp:'192.0.2.10'},event=x=>({rawPath:'/internal/coaches/scenario/ai',routeKey:'POST /internal/coaches/scenario/ai',requestContext:{apiId:environment==='alpha'?'8qmgd1ghdi':'eoszayfkqd',stage:'$default',http:{method:'POST'},authorizer:{iam:{userArn:'arn:aws:sts::771049112957:assumed-role/scenario-'+environment+'-runtime/fixture'}}},body:JSON.stringify({contractVersion:2,...x})});
 const call=async x=>{const r=await app(event(x));return{status:r.statusCode,...JSON.parse(r.body)};};
 const acquire=x=>call({operation:'acquire',...proof,requestId:randomUUID(),model:'gpt-6-luna',requestBytes:1000,maxOutputTokens:640,...x});
 return{app,event,call,acquire,rows,proof,tick:x=>time+=x,off:()=>on=false};
}
it('acquires, dispatches and finishes with no monetary rows or fields, denying replays',async()=>{
 const f=fixture(),a=await f.acquire();expect(a).toMatchObject({status:200,admitted:true,coach:'scenario',environment:'alpha',noRetry:true});expect(a).not.toHaveProperty('reservationMicros');
 expect((await f.acquire({requestId:a.leaseId})).status).toBe(409);
 expect(await f.call({operation:'dispatch',leaseId:a.leaseId})).toMatchObject({allowed:true,noRetry:true});
 expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(409);
 expect(await f.call({operation:'finish',leaseId:a.leaseId,outcome:'completed'})).toEqual({status:200,finished:true});
 expect((await f.call({operation:'finish',leaseId:a.leaseId,outcome:'completed'})).status).toBe(409);
 expect([...f.rows.keys()].every(x=>!x.includes('BUDGET'))).toBe(true);
});
it('allows safe pre-dispatch finish but rejects pretending dispatched work never ran',async()=>{
 const f=fixture(),a=await f.acquire();expect((await f.call({operation:'finish',leaseId:a.leaseId,outcome:'not_dispatched'})).status).toBe(200);
 const b=await f.acquire();await f.call({operation:'dispatch',leaseId:b.leaseId});expect((await f.call({operation:'finish',leaseId:b.leaseId,outcome:'not_dispatched'})).status).toBe(409);
});
it('uncertain work retains only bounded concurrency and cannot block the service indefinitely',async()=>{
 const f=fixture(),a=await f.acquire();await f.call({operation:'dispatch',leaseId:a.leaseId});expect((await f.call({operation:'finish',leaseId:a.leaseId,outcome:'uncertain'})).status).toBe(200);
 expect((await f.acquire()).status).toBe(429);f.tick(60001);expect((await f.acquire()).status).toBe(200);
});
it('fresh master denies dispatch; expired authorization is one-shot and fail closed',async()=>{
 const f=fixture(),a=await f.acquire();f.off();expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(503);
 expect((await f.acquire()).status).toBe(503);
 const g=fixture(),b=await g.acquire();g.tick(15001);expect((await g.call({operation:'dispatch',leaseId:b.leaseId})).status).toBe(409);
});
it('rejects invalid Guest, wrong Origin/IP, financial fields and invalid bounds',async()=>{
 const f=fixture();for(const x of [{cookie:''},{cookie:f.proof.cookie+'; '+f.proof.cookie},{origin:'https://evil.example'},{sourceIp:'bad'},{maxOutputTokens:641},{requestBytes:24577},{reservation:1}])expect((await f.acquire(x)).status).not.toBe(200);
 expect(f.rows.size).toBe(0);
});
it('isolates Alpha/Production exact caller, route, API and contract',async()=>{
 for(const env of ['alpha','prod']){const f=fixture(env);expect((await f.call({operation:'verify',...f.proof})).verified).toBe(true);
  for(const modify of [e=>e.requestContext.apiId='wrong',e=>e.requestContext.authorizer.iam.userArn='arn:aws:sts::771049112957:assumed-role/other/fixture',e=>e.requestContext.http.method='GET']){const e=f.event({operation:'master'});modify(e);expect((await f.app(e)).statusCode).toBe(403);}
  expect((await f.call({operation:'master',contractVersion:1})).status).toBe(400);
 }
});
