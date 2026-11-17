import {it,expect} from 'vitest';
import {navigatorControls} from '../../server/platform/budget.mjs';
function memory() {
 const rows=new Map();
 return {
  get:async id=>structuredClone(rows.get(id)),
  replace:async(id,version,value)=>{if(rows.get(id)?.version!==version)return false;rows.set(id,{...value,version:version+1});return true;},
  transaction:async changes=>{
   if(changes.some(row=>(rows.get(row.id)?.version??0)!==(row.previous?.version??0)))return false;
   changes.forEach(row=>rows.set(row.id,{...structuredClone(row.value),version:(row.previous?.version??0)+1}));return true;
  }
 };
}
it('caps account usage independently of guest quotas and rejects simultaneous requests from one account',async()=>{
 const store=memory();let time=Date.parse('2026-11-17T00:00:00Z');
 const controls=navigatorControls(store,{now:()=>time});
 const first=await controls.admit('student','ip',false,100);
 await expect(controls.admit('student','ip',false,100)).rejects.toThrow();
 await controls.settle(first,50);
 for(let count=1;count<20;count++){
  time+=61000;
  const lease=await controls.admit('student','ip',false,100);await controls.settle(lease,50);
 }
 time+=61000;
 await expect(controls.admit('student','different-ip',false,100)).rejects.toThrow();
});
it('retains an abandoned reservation after the concurrency lease expires and emits exhaustion alerts',async()=>{
 const store=memory();let time=Date.parse('2026-11-17T00:00:00Z');const levels=[];
 const controls=navigatorControls(store,{now:()=>time,alert:async level=>levels.push(level)});
 await controls.admit('first','ip',true,6000000);
 time+=61000;
 await expect(controls.admit('second','ip2',true,5000000)).rejects.toThrow();
 expect((await store.get('BUDGET#2026-11')).reserved).toBe(6000000);
 expect(levels).toEqual([50,100]);
});
