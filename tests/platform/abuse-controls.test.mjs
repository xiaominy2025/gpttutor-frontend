import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {abuseControls,abuseLimits} from '../../server/platform/abuse-controls.mjs';
function fixture(){
 const rows=new Map();let time=Date.UTC(2026,10,30,23,50),broken=false;
 const clone=x=>x===undefined?undefined:structuredClone(x);
 const check=id=>{if(/BUDGET|REQUEST#|PILOT|CANARY/.test(id))throw Error('Financial state forbidden');};
 const store={get:async id=>{check(id);if(broken)throw Error('State unavailable');return clone(rows.get(id));},transaction:async changes=>{
  if(broken)throw Error('Unknown result');changes.forEach(x=>check(x.id));
  if(changes.some(x=>(rows.get(x.id)?.version??0)!==(x.previous?.version??0)))return false;
  changes.forEach(x=>rows.set(x.id,{...clone(x.value),version:(x.previous?.version??0)+1}));return true;
 }};
 return{rows,store,controls:abuseControls(store,{now:()=>time}),tick:n=>time+=n,break:()=>broken=true};
}
it('acquires/releases security slots without any financial access or quota refund',async()=>{
 const f=fixture(),l=await f.controls.acquire('guest','network');expect(l).not.toHaveProperty('reservation');await f.controls.finish(l);
 expect(f.rows.get(l.ids[1]).daily).toBe(1);expect(f.rows.get(l.ids[0]).leases).toEqual({});expect([...f.rows.keys()].some(x=>/BUDGET/.test(x))).toBe(false);
});
it('atomically admits at most two across contention and one per visitor',async()=>{
 const f=fixture(),r=await Promise.allSettled(Array.from({length:8},(_,i)=>f.controls.acquire('guest'+i,'ip'+i)));
 expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(2);
 const g=fixture();await g.controls.acquire('same','network');await expect(g.controls.acquire('same','network')).rejects.toMatchObject({code:'visitor_busy'});
});
it('preserves carried legacy counter/leases and rejects malformed security state',async()=>{
 const f=fixture();f.rows.set('ACTOR#guest#2026-11-30',{version:2,daily:5,minute:0,minuteCount:0,leases:{}});
 await expect(f.controls.acquire('guest','network')).rejects.toMatchObject({code:'daily_allowance'});
 f.rows.set('ACTOR#guest#2026-11-30',{version:3,daily:'broken',leases:{}});await expect(f.controls.acquire('guest','network')).rejects.toMatchObject({status:503});
});
it('rate-limit retry is known and daily/IP counters survive completion',async()=>{
 const f=fixture();for(let i=0;i<2;i++)await f.controls.finish(await f.controls.acquire('guest','network'));
 await expect(f.controls.acquire('guest','network')).rejects.toMatchObject({code:'rate_limit',retryAfter:60});
 f.tick(61000);await f.controls.finish(await f.controls.acquire('guest','network'));
 expect(f.rows.get('ACTOR#guest#2026-11-30').daily).toBe(3);
 const g=fixture();for(let i=0;i<20;i++)await g.controls.finish(await g.controls.acquire('guest'+i,'network'));
 await expect(g.controls.acquire('new','network')).rejects.toMatchObject({code:'daily_allowance'});
});
it('uncertain completion expires as a lock, without finance or indefinite shutdown',async()=>{
 const f=fixture();await f.controls.acquire('guest','network');f.tick(60001);await expect(f.controls.acquire('guest','network')).resolves.toHaveProperty('id');
});
it('one visitor remains locked across UTC day/month boundary',async()=>{
 const f=fixture();f.tick(9*60000+40000);await f.controls.acquire('guest','network');f.tick(30000);
 await expect(f.controls.acquire('guest','network')).rejects.toMatchObject({code:'visitor_busy'});
 f.tick(31000);await expect(f.controls.acquire('guest','network')).resolves.toHaveProperty('id');
});
it('request claims are acquired atomically and replay cannot consume another slot',async()=>{
 const f=fixture(),claim={id:'ACCESS#SCENARIO#'+randomUUID(),value:{state:'admitted'}};
 await f.controls.acquire('guest','network',true,claim);
 await expect(f.controls.acquire('guest','network',true,claim)).rejects.toMatchObject({status:409});
 expect(f.rows.get('ACTOR#guest#2026-11-30').daily).toBe(1);
});
it('fails closed for missing controls, invalid inputs and unknown transaction outcomes',async()=>{
 const f=fixture();expect(()=>abuseControls(f.store,{leaseMs:1})).toThrow();expect(()=>abuseControls(f.store,{limits:{...abuseLimits,globalConcurrent:0}})).toThrow();
 await expect(f.controls.acquire('bad#key','network')).rejects.toMatchObject({status:503});f.break();await expect(f.controls.acquire('guest','network')).rejects.toThrow();
});
