import {it,expect} from 'vitest';
import {checkMaster,checkMasterAdmission} from '../../server/platform/navigator-master-check.mjs';
it.each([false,true])('reflects actual master suspended=%s without writes',async suspended=>{
 const result=await checkMaster(async()=>({suspended,revision:9}));
 expect(result).toEqual({allowed:!suspended,observed:{suspended,revision:9},providerTransport:'absent',writes:0});
});
it('denies missing master and read failures without leaking errors',async()=>{
 expect((await checkMaster(async()=>null)).allowed).toBe(false);
 expect((await checkMaster(async()=>{throw Error('sensitive');}))).toEqual({allowed:false,providerTransport:'absent',writes:0});
});
it.each([false,true])('core admission honors real-reader suspended=%s with transport absent',async suspended=>{
 const r=await checkMasterAdmission(async()=>({suspended,revision:10}));
 expect(r).toEqual({observed:{suspended,revision:10},status:suspended?503:200,providerStubCalls:suspended?0:1,
  syntheticAdmissions:1,syntheticSettlements:1,providerTransport:'absent',realWrites:0,paidCalls:0});
});
it('core fail-closed reader cannot reach even the provider stub',async()=>{
 const r=await checkMasterAdmission(async()=>{throw Error('unavailable');});
 expect(r.status).toBe(503);expect(r.providerStubCalls).toBe(0);expect(r.realWrites).toBe(0);
});
