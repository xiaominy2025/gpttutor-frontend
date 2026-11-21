import {describe,expect,it,vi} from 'vitest';
import {canaryAttempt,canarySource,inspectCanaryRequest,validateCanaryManifest} from '../../server/platform/navigator-paid-guard.mjs';
import {executeCanary,handlerEntry} from '../../server/platform/navigator-paid-canary.mjs';

const epoch=Date.UTC(2026,10,21,12);
const manifest={source:canarySource,approval:'offline-test-only',startsAt:epoch,endsAt:epoch+3600000};
const request={model:'gpt-6-luna',service_tier:'default',store:false,reasoning:{effort:'none'},max_output_tokens:1500,input:'判断'};
const modelResponse={
 usage:{input_tokens:100,output_tokens:30},
 output:[{content:[{type:'output_text',text:JSON.stringify({kind:'guide',reply:'Clarify what you want to learn.',followUps:[],exploredDimension:null})}]}]
};
function memoryStore(){
 const rows=new Map();
 const valid=(id,version)=>(rows.get(id)?.version??0)===version;
 const put=(id,version,value)=>rows.set(id,{...structuredClone(value),version:version+1});
 return {rows,get:vi.fn(async id=>structuredClone(rows.get(id))),
  replace:vi.fn(async(id,version,value)=>{if(!valid(id,version))return false;put(id,version,value);return true;}),
  remove:vi.fn(async(id,version)=>valid(id,version)&&rows.delete(id)),
  transaction:vi.fn(async updates=>{
   if(!updates.every(row=>valid(row.id,row.previous?.version??0)))return false;
   for(const row of updates)put(row.id,row.previous?.version??0,row.value);
   return true;
  })};
}
function fixture(){
 const store=memoryStore();
 const master={assertEnabled:vi.fn(async()=>({revision:9}))};
 const send=vi.fn(async()=>modelResponse);
 let time=epoch;
 const now=()=>time;
 const attempt=(step,overrides)=>canaryAttempt({manifest,store,step,master,send,now,...overrides});
 return {store,master,send,now,timeTo:value=>{time=value;},attempt};
}
const ledger='CANARY#ALPHA-INITIAL';

describe('durable paid canary boundaries',()=>{
 it('validates final UTF-8 bytes and pricing contract, including the exact ceiling',()=>{
  const initial=inspectCanaryRequest(request);
  const fill='a'.repeat(12000-initial.bytes);
  const max={...request,input:request.input+fill};
  expect(inspectCanaryRequest(max)).toMatchObject({bytes:12000,inputCeiling:13024,reservation:2378});
  expect(initial.body).toBe(JSON.stringify(request));
  expect(initial.bytes).toBeGreaterThan(initial.body.length);
  expect(()=>inspectCanaryRequest({...max,input:max.input+'x'})).toThrow('byte limit');
  for(const wrong of [{service_tier:'priority'},{model:'different'},{max_output_tokens:1501},{store:true},{tools:[]}])
   expect(()=>inspectCanaryRequest({...request,...wrong})).toThrow('configuration');
 });
 it('admits exactly four sequential steps and meters the same serialized body',async()=>{
  const f=fixture();
  await expect(f.attempt(2).generate('fixture-key',request)).rejects.toThrow('step one');
  let receipt;
  for(let step=1;step<=4;step++){
   const turn=f.attempt(step,{receipt});
   await turn.generate('fixture-key',request);
   expect(f.send.mock.calls.at(-1)).toEqual(['fixture-key',JSON.stringify(request)]);
   const result=await turn.finish(true);
   expect(result).toMatchObject({state:step===4?'complete':'ready',spentMicros:step*28});
   receipt=result.receipt;
   await expect(f.attempt(step).generate('fixture-key',request)).rejects.toThrow('already used');
  }
  expect(()=>f.attempt(5)).toThrow('step');
  expect(f.send).toHaveBeenCalledTimes(4);
  expect(f.master.assertEnabled).toHaveBeenCalledTimes(4);
 });
 it('serializes concurrent and restarted controllers with one atomic slot',async()=>{
  const f=fixture();
  const outcomes=await Promise.allSettled([f.attempt(1).generate('fixture-key',request),f.attempt(1).generate('fixture-key',request)]);
  expect(outcomes.map(value=>value.status).sort()).toEqual(['fulfilled','rejected']);
  await expect(f.attempt(1).generate('fixture-key',request)).rejects.toThrow('stopped');
  expect(f.send).toHaveBeenCalledTimes(1);
  expect(f.store.rows.get(ledger)).toMatchObject({phase:'held',nextStep:1});
 });
 it('retains a hold for a crash after the reserve commits and for a lost settlement response',async()=>{
  const f=fixture();
  const realPut=f.store.replace.getMockImplementation();
  f.store.replace.mockImplementationOnce(async(...args)=>{await realPut(...args);throw Error('possible committed reservation');});
  await expect(f.attempt(1).generate('fixture-key',request)).rejects.toThrow('possible committed');
  expect(f.store.rows.get(ledger).hold).toBe(inspectCanaryRequest(request).reservation);
  await expect(f.attempt(1).generate('fixture-key',request)).rejects.toThrow('stopped');
  expect(f.send).not.toHaveBeenCalled();

  const second=fixture();
  const turn=second.attempt(1);
  await turn.generate('fixture-key',request);
  second.store.replace.mockRejectedValueOnce(Error('settlement failed'));
  await expect(turn.finish(true)).rejects.toThrow('settlement failed');
  await expect(second.attempt(2).generate('fixture-key',request)).rejects.toThrow('stopped');
  expect(second.store.rows.get(ledger)).toMatchObject({phase:'held'});
 });
 it.each(['transport failure','missing usage','master denial'])('stops and retains the reservation after %s',async failure=>{
  const f=fixture(),turn=f.attempt(1);
  if(failure==='transport failure')f.send.mockRejectedValueOnce(Error('Timeout'));
  if(failure==='missing usage')f.send.mockResolvedValueOnce({});
  if(failure==='master denial')f.master.assertEnabled.mockRejectedValueOnce(Error('Denied'));
  await expect(turn.generate('fixture-key',request)).rejects.toThrow();
  expect(await turn.finish(false)).toEqual({state:'held'});
  await expect(f.attempt(1).generate('fixture-key',request)).rejects.toThrow('stopped');
  expect(f.send).toHaveBeenCalledTimes(failure==='master denial'?0:1);
 });
 it('records known usage and stops on invalid output or unexpectedly high usage',async()=>{
  for(const high of [false,true]){
   const f=fixture(),turn=f.attempt(1);
   if(high)f.send.mockResolvedValueOnce({usage:{input_tokens:100,output_tokens:1501}});
   await turn.generate('fixture-key',request);
   expect(await turn.finish(high)).toMatchObject({state:'stopped',usage:{withinBounds:!high}});
   await expect(f.attempt(2).generate('fixture-key',request)).rejects.toThrow('stopped');
  }
 });
 it('does not open a fresh ledger at month rollover or allow a closed window to dispatch',async()=>{
  const f=fixture();
  const turn=f.attempt(1);
  await turn.generate('fixture-key',request);
  await turn.finish(true);
  const boundary=Date.UTC(2026,11,1);
  expect(()=>validateCanaryManifest({...manifest,startsAt:boundary-1000,endsAt:boundary+1000})).toThrow('manifest');
  f.timeTo(boundary+1000);
  await expect(f.attempt(2).generate('fixture-key',request)).rejects.toThrow('window');
  const nextManifest={...manifest,approval:'different-approval',startsAt:boundary,endsAt:boundary+10000};
  await expect(f.attempt(1,{manifest:nextManifest}).generate('fixture-key',request)).rejects.toThrow('stopped');
  expect(f.send).toHaveBeenCalledTimes(1);
 });
});

it('uses both canonical monthly accounting and the canary ledger end to end without network calls',async()=>{
 const f=fixture();
 const options={...f,manifest,signingSecret:async()=>'offline-hmac-fixture-value-with-entropy',credential:async()=>'fixture-key'};
 const boot=await executeCanary({approval:manifest.approval,step:0},options);
 expect(boot).toMatchObject({status:200,cookie:expect.stringMatching(/^__Host-engent-navigator=/)});
 expect(f.send).not.toHaveBeenCalled();
 const execution=await executeCanary({approval:manifest.approval,step:1,cookie:boot.cookie,history:[]},options);
 expect(execution).toMatchObject({status:200,canary:{state:'ready',spentMicros:28},result:{done:false}});
 expect(f.master.assertEnabled).toHaveBeenCalledTimes(2);
 expect(f.store.rows.get('BUDGET#2026-11')).toMatchObject({spent:28,reserved:0});
 expect(f.store.rows.get(ledger)).toMatchObject({spent:28,hold:0,phase:'ready'});
 expect(f.send).toHaveBeenCalledTimes(1);
 expect(await handlerEntry({approval:manifest.approval},{functionVersion:'1',invokedFunctionArn:'invalid'})).toMatchObject({status:503});
});

it('cannot resume after a successful settlement whose acknowledgement was lost',async()=>{
 const f=fixture(),turn=f.attempt(1);
 await turn.generate('fixture-key',request);
 const realPut=f.store.replace.getMockImplementation();
 f.store.replace.mockImplementationOnce(async(...args)=>{await realPut(...args);throw Error('response lost after commit');});
 await expect(turn.finish(true)).rejects.toThrow('response lost');
 expect(f.store.rows.get(ledger)).toMatchObject({phase:'ready',spent:28,hold:0});
 await expect(f.attempt(2).generate('fixture-key',request)).rejects.toThrow('prior receipt');
 await expect(f.attempt(2,{receipt:'x'.repeat(43)}).generate('fixture-key',request)).rejects.toThrow('prior receipt');
 expect(f.send).toHaveBeenCalledTimes(1);
});

it('enforces the canonical monthly cap before claiming a canary slot',async()=>{
 const f=fixture();
 await f.store.replace('BUDGET#2026-11',0,{spent:9999999,reserved:0,leases:{},alerted:100});
 const options={...f,manifest,signingSecret:async()=>'offline-hmac-fixture-value-with-entropy',credential:async()=>'fixture-key'};
 const boot=await executeCanary({approval:manifest.approval,step:0},options);
 const turn=await executeCanary({approval:manifest.approval,step:1,cookie:boot.cookie,history:[]},options);
 expect(turn).toMatchObject({status:429,canary:{state:'stopped'}});
 expect(f.store.rows.has(ledger)).toBe(false);
 expect(f.send).not.toHaveBeenCalled();
});
it('keeps the canary hold but settles zero canonical model spend if the final master check denies dispatch',async()=>{
 const f=fixture();
 f.master.assertEnabled.mockResolvedValueOnce({revision:9}).mockRejectedValueOnce(Error('master denied'));
 const options={...f,manifest,signingSecret:async()=>'offline-hmac-fixture-value-with-entropy',credential:async()=>'fixture-key'};
 const boot=await executeCanary({approval:manifest.approval,step:0},options);
 expect(await executeCanary({approval:manifest.approval,step:1,cookie:boot.cookie,history:[]},options))
  .toMatchObject({status:503,canary:{state:'held'}});
 expect(f.store.rows.get('BUDGET#2026-11')).toMatchObject({spent:0,reserved:0});
 expect(f.store.rows.get(ledger)).toMatchObject({phase:'held',hold:expect.any(Number)});
 expect(f.send).not.toHaveBeenCalled();
});
