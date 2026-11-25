import {it,expect} from 'vitest';
import {createHmac,randomUUID} from 'node:crypto';
import {scenarioAlphaAdmission,SCENARIO_ADMISSION_PATH,SCENARIO_ALPHA_ORIGIN} from '../../server/platform/scenario-alpha-admission.mjs';
import {navigatorControls} from '../../server/platform/budget.mjs';
const secret='fixture-secret-for-scenario-platform-only';
function fixture(){
 const rows=new Map();let time=Date.UTC(2026,10,24,12),on=true,broken=false;
 const clone=x=>x===undefined?undefined:structuredClone(x);
 const check=(id,v)=>(rows.get(id)?.version??0)===(v??0);
 const put=(id,v,x)=>rows.set(id,{...clone(x),version:(v??0)+1});
 const store={get:async id=>clone(rows.get(id)),replace:async(id,v,x)=>{if(!check(id,v))return false;put(id,v,x);return true;},
  transaction:async changes=>{if(broken)throw Error('unknown transaction');if(!changes.every(x=>check(x.id,x.previous?.version)))return false;for(const x of changes)put(x.id,x.previous?.version,x.value);return true;}};
 const controls=navigatorControls(store,{now:()=>time});
 const app=scenarioAlphaAdmission({store,controls,signingSecret:async()=>secret,now:()=>time,master:{assertEnabled:async()=>{if(!on)throw Error('master off');return {revision:11};}}});
 const value='a'.repeat(43)+'.'+(Math.floor(time/1000)+86400);
 const cookie='__Host-engent-navigator='+value+'.'+createHmac('sha256',secret).update('navigator-session#'+value).digest('base64url');
 const proof={cookie,sourceIp:'192.0.2.10',origin:SCENARIO_ALPHA_ORIGIN};
 const event=body=>({rawPath:SCENARIO_ADMISSION_PATH,routeKey:'POST '+SCENARIO_ADMISSION_PATH,
  requestContext:{apiId:'8qmgd1ghdi',stage:'$default',http:{method:'POST'},authorizer:{iam:{userArn:'arn:aws:sts::771049112957:assumed-role/scenario-alpha-runtime/fixture'}}},body:JSON.stringify(body)});
 const call=async body=>{const result=await app(event(body));return {status:result.statusCode,...JSON.parse(result.body)};};
 const admit=(extra={})=>call({operation:'admit',...proof,requestId:randomUUID(),model:'gpt-6-luna',requestBytes:1000,maxOutputTokens:640,...extra});
 return {rows,app,event,call,admit,proof,controls,off:()=>on=false,tick:ms=>time+=ms,breakTransactions:()=>broken=true};
}
it('restricts private admission to exact Alpha caller, route, API and environment',async()=>{
 const f=fixture();for(const modify of [e=>e.requestContext.authorizer.iam.userArn='arn:aws:sts::771049112957:assumed-role/other/runtime',e=>e.requestContext.apiId='prod',e=>e.routeKey='ANY /{proxy+}',e=>e.requestContext.http.method='GET']){
  const e=f.event({operation:'master'});modify(e);expect((await f.app(e)).statusCode).toBe(403);
 }expect(f.rows.size).toBe(0);
});
it('verifies valid proof without returning private actor/IP/secret or touching ledgers',async()=>{
 const f=fixture();expect(await f.call({operation:'verify',...f.proof})).toEqual({status:200,verified:true,coach:'scenario',environment:'alpha'});expect(f.rows.size).toBe(0);
 for(const extra of [{cookie:''},{cookie:f.proof.cookie+'; '+f.proof.cookie},{cookie:f.proof.cookie.slice(0,-1)+'x'},{origin:'https://evil.example'},{sourceIp:'not-an-IP'}])expect((await f.admit(extra)).status).not.toBe(200);
 f.tick(86400001);expect((await f.admit()).status).toBe(401);
});
it('reserves canonical budget and shared actor/IP/global state; dispatch and settlement replay denied',async()=>{
 const f=fixture(),a=await f.admit();expect(a.reservationMicros).toBe(832);
 expect(f.rows.get('BUDGET#2026-11').reserved).toBe(832);expect(f.rows.has('NAVIGATOR#GLOBAL')).toBe(true);
 expect((await f.admit({requestId:a.leaseId})).status).toBe(409);
 expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(200);
 expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(409);
 const s=await f.call({operation:'settle',leaseId:a.leaseId,usage:{input_tokens:100,output_tokens:20}});
 expect(s.costMicros).toBe(23);expect(f.rows.get('BUDGET#2026-11')).toMatchObject({spent:23,reserved:0});
 expect(f.rows.get('SCENARIO#REQUEST#'+a.leaseId)).toMatchObject({state:'settled',coach:'scenario',cost:23});
 expect((await f.call({operation:'settle',leaseId:a.leaseId,notDispatched:true})).status).toBe(409);
});
it('retains uncertain reservations and blocks settlement replay; unknown transactions fail closed',async()=>{
 const f=fixture(),a=await f.admit();await f.call({operation:'dispatch',leaseId:a.leaseId});
 expect(await f.call({operation:'settle',leaseId:a.leaseId,uncertain:true})).toMatchObject({retained:true,reservedMicros:832});
 expect(f.rows.get('BUDGET#2026-11').reserved).toBe(832);
 expect((await f.call({operation:'settle',leaseId:a.leaseId,notDispatched:true})).status).toBe(409);
 const g=fixture(),b=await g.admit();g.breakTransactions();expect((await g.call({operation:'settle',leaseId:b.leaseId,notDispatched:true})).status).toBe(503);
 expect(g.rows.get('BUDGET#2026-11').reserved).toBe(832);expect(g.rows.get('SCENARIO#REQUEST#'+b.leaseId).state).toBe('settling');
});
it('preserves master OFF and authoritative dispatch recheck; known no-dispatch can reconcile zero',async()=>{
 const f=fixture(),a=await f.admit();f.off();expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(503);
 expect((await f.admit()).status).toBe(503);expect((await f.call({operation:'settle',leaseId:a.leaseId,notDispatched:true})).status).toBe(200);
 expect(f.rows.get('BUDGET#2026-11').reserved).toBe(0);
});
it('enforces fixed model/output ceiling, shared capacity and shared monthly money',async()=>{
 const f=fixture();for(const x of [{model:'other'},{requestBytes:24577},{maxOutputTokens:641}])expect((await f.admit(x)).status).toBe(400);
 const a=await f.admit();expect((await f.admit()).status).toBe(429);
 await f.call({operation:'settle',leaseId:a.leaseId,notDispatched:true});
 f.rows.set('BUDGET#2026-11',{version:20,spent:9999999,reserved:0,leases:{}});expect((await f.admit()).status).toBe(429);
});
it('expires dispatch authorization without releasing money and pauses accounting on overrun',async()=>{
 const f=fixture(),a=await f.admit();f.tick(15001);expect((await f.call({operation:'dispatch',leaseId:a.leaseId})).status).toBe(409);
 expect(f.rows.get('BUDGET#2026-11').reserved).toBe(832);
 const g=fixture(),b=await g.admit();await g.call({operation:'settle',leaseId:b.leaseId,usage:{input_tokens:20000,output_tokens:640}});
 expect(g.rows.get('BUDGET#2026-11').paused).toBe(true);
});
it('uses the same global capacity and monthly cap as concurrent Navigator admissions',async()=>{
 const f=fixture();
 const nav=await f.controls.admit('navigator-other','network-other',true,100);
 const a=await f.admit();expect(a.status).toBe(200);
 await expect(f.controls.admit('third-actor','third-network',true,100)).rejects.toMatchObject({status:429});
 await f.call({operation:'settle',leaseId:a.leaseId,usage:{input_tokens:100,output_tokens:20}});
 await f.controls.settle(nav,50);
 expect(f.rows.get('BUDGET#2026-11')).toMatchObject({spent:73,reserved:0});
});
it('settles the original month and does not refund on malformed usage or missing leases',async()=>{
 const f=fixture(),a=await f.admit();
 expect((await f.call({operation:'settle',leaseId:a.leaseId,usage:{input_tokens:-1,output_tokens:1}})).status).toBe(503);
 expect((await f.call({operation:'settle',leaseId:randomUUID(),notDispatched:true})).status).toBe(409);
 f.tick(8*86400000);
 expect((await f.call({operation:'settle',leaseId:a.leaseId,usage:{input_tokens:100,output_tokens:20}})).status).toBe(200);
 expect(f.rows.get('BUDGET#2026-11')).toMatchObject({spent:23,reserved:0});expect(f.rows.has('BUDGET#2026-12')).toBe(false);
});
