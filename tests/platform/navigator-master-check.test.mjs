import {it,expect} from 'vitest';
import {checkMaster} from '../../server/platform/navigator-master-check.mjs';
it.each([false,true])('reflects actual master suspended=%s without writes',async suspended=>{
 const result=await checkMaster(async()=>({suspended,revision:9}));
 expect(result).toEqual({allowed:!suspended,observed:{suspended,revision:9},providerTransport:'absent',writes:0});
});
it('denies missing master and read failures without leaking errors',async()=>{
 expect((await checkMaster(async()=>null)).allowed).toBe(false);
 expect((await checkMaster(async()=>{throw Error('sensitive');}))).toEqual({allowed:false,providerTransport:'absent',writes:0});
});
