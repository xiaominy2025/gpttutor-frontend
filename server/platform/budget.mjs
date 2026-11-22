import {randomUUID} from 'node:crypto';
import {PlatformError} from './oauth.mjs';

export const pilot = Object.freeze({monthlyMicros:10000000,guestDaily:20,guestMinute:6,guestConcurrent:1,
 ipDaily:100,accountDaily:20,accountMinute:5,accountConcurrent:1,globalConcurrent:2});
export class NavigatorLimitError extends PlatformError {
 constructor(code,message,retryAt=null,status=429) {
  super(status,message);this.code=code;this.retryAt=retryAt;
 }
}
export function navigatorControls(store, {limits=pilot, now=()=>Date.now(), alert=async()=>{}}={}) {
 const fail = (code,message,retryAt=null,status=429) => new NavigatorLimitError(code,message,retryAt,status);
 const expiry = () => Math.floor(now()/1000)+40*86400;
 async function admit(actor,ip,guest,reservation) {
  if(!Number.isSafeInteger(reservation)||reservation<=0||reservation>limits.monthlyMicros) throw new PlatformError(503,'Navigator usage could not be verified.');
  const date=new Date(now()).toISOString(),day=date.slice(0,10),month=day.slice(0,7),minute=Math.floor(now()/60000);
  const ids=['BUDGET#'+month,'NAVIGATOR#GLOBAL','ACTOR#'+actor+'#'+day,...(guest?['IP#'+ip+'#'+day]:[])];
  for(let attempt=0;attempt<8;attempt++) {
   const [budget,global,user,address]=await Promise.all(ids.map(id=>store.get(id)));
   const state=budget??{spent:0,reserved:0,leases:{},alerted:0};
   const activeGlobal=Object.fromEntries(Object.entries(global?.leases??{}).filter(([,lease])=>lease.expires>now()));
   const activeUser=Object.values(user?.leases??{}).filter(lease=>lease>now()).length;
   const minuteCount=user?.minute===minute?user.minuteCount:0;
   if(state.spent+state.reserved+reservation>limits.monthlyMicros) {
    if((state.alerted??0)<100){await alert(100,state.spent+state.reserved);await store.replace(ids[0],state.version,{...state,alerted:100});}
    throw fail('NAVIGATOR_MONTHLY_BUDGET','Navigator’s monthly AI allowance cannot cover this request.',state.reserved===0?Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7)),1):null);
   }
   if(state.paused) throw fail('NAVIGATOR_USAGE_UNAVAILABLE','Navigator AI is temporarily unavailable while usage is verified.',null,503);
   const nextDay=Date.parse(day+'T00:00:00Z')+86400000;
   if((user?.daily??0)>=(guest?limits.guestDaily:limits.accountDaily))
    throw fail('NAVIGATOR_VISITOR_DAILY','You’ve reached today’s Navigator allowance.',nextDay);
   if(guest && (address?.daily??0)>=limits.ipDaily)
    throw fail('NAVIGATOR_NETWORK_DAILY','This network has reached today’s Navigator allowance.',nextDay);
   if(minuteCount>=(guest?limits.guestMinute:limits.accountMinute))
    throw fail('NAVIGATOR_VISITOR_RATE','You’re sending Navigator requests too quickly.',(minute+1)*60000);
   if(activeUser>=(guest?limits.guestConcurrent:limits.accountConcurrent))
    throw fail('NAVIGATOR_VISITOR_CAPACITY','Your previous Navigator request is still running. Please wait for it to finish.');
   if(Object.keys(activeGlobal).length>=limits.globalConcurrent)
    throw fail('NAVIGATOR_GLOBAL_CAPACITY','Navigator is at capacity. Please try again shortly.');
   const id=randomUUID(),expires=now()+60000;
   const updates=[
    {id:ids[0],previous:budget,value:{...state,reserved:state.reserved+reservation,leases:{...state.leases,[id]:reservation},expiresAt:expiry()}},
    {id:ids[1],previous:global,value:{leases:{...activeGlobal,[id]:{expires}},expiresAt:expiry()}},
    {id:ids[2],previous:user,value:{daily:(user?.daily??0)+1,minute,minuteCount:minuteCount+1,leases:{...Object.fromEntries(Object.entries(user?.leases??{}).filter(([,time])=>time>now())),[id]:expires},expiresAt:expiry()}},
    ...(guest?[{id:ids[3],previous:address,value:{daily:(address?.daily??0)+1,expiresAt:expiry()}}]:[])
   ];
   if(await store.transaction(updates)) {await report(ids[0]);return {id,month,ids,reservation};}
  }
  throw fail('NAVIGATOR_BUSY','Navigator is temporarily busy. Please try again shortly.',null,503);
 }
 async function settle(lease,cost,uncertain=false) {
  // Ambiguous provider outcomes retain the entire reservation. Expired leases never refund money.
  const charge=uncertain?lease.reservation:cost;
  if(!Number.isSafeInteger(charge)||charge<0) throw new PlatformError(503,'Usage could not be verified.');
  for(let attempt=0;attempt<8;attempt++){
   const [budget,global,user]=await Promise.all(lease.ids.slice(0,3).map(id=>store.get(id)));
   if(!budget?.leases?.[lease.id]) return;
   const money={...budget.leases},all={...global?.leases},person={...user?.leases};
   delete money[lease.id];delete all[lease.id];delete person[lease.id];
   const next={...budget,spent:budget.spent+charge,reserved:budget.reserved-lease.reservation,leases:money,
    paused:budget.paused||charge>lease.reservation};
   if(await store.transaction([
    {id:lease.ids[0],previous:budget,value:next},
    {id:lease.ids[1],previous:global,value:{...global,leases:all}},
    {id:lease.ids[2],previous:user,value:{...user,leases:person}}
   ])){
    await report(lease.ids[0]);return;
   }
  }
  throw new PlatformError(503,'Usage accounting is temporarily unavailable.');
 }
 async function report(id) {
  for(let attempt=0;attempt<8;attempt++){
   const state=await store.get(id);
   const percent=Math.floor((state.spent+state.reserved)*100/limits.monthlyMicros);
   const threshold=[100,80,50].find(level=>percent>=level && level>(state.alerted??0));
   if(!threshold) return;
   // Emit before marking. At-least-once metric delivery keeps alarms reliable across process crashes.
   await alert(threshold,state.spent+state.reserved);
   if(await store.replace(id,state.version,{...state,alerted:threshold})) return;
  }
 }
 return {admit,settle,report};
}
