import {randomUUID} from 'node:crypto';
import {PlatformError} from './oauth.mjs';

export const abuseLimits=Object.freeze({guestDaily:5,guestMinute:2,guestConcurrent:1,ipDaily:20,
 accountDaily:20,accountMinute:5,accountConcurrent:1,globalConcurrent:2});
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
const count=x=>Number.isSafeInteger(x)&&x>=0;
const label=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
const unavailable=()=>new PlatformError(503,'AI access controls are temporarily unavailable.');
export class AbuseLimitError extends PlatformError{
 constructor(code,message,retryAfter){super(429,message);this.code=code;this.retryAfter=retryAfter;}
}

// Request counts, execution locks and replay claims only. No currency or usage ledger.
// Existing actor/day, IP/day and global schemas are retained to carry active limits.
export function abuseControls(store,{limits=abuseLimits,now=Date.now,leaseMs=60000}={}){
 if(Object.keys(abuseLimits).some(k=>!Number.isSafeInteger(limits[k])||limits[k]<1)||
    !Number.isSafeInteger(leaseMs)||leaseMs<60000||leaseMs>300000)throw unavailable();
 function valid(row,kind){
  if(row===undefined||row===null)return;
  if(!record(row)||!count(row.version)||row.version<1)throw unavailable();
  if(kind==='ip'){if(!count(row.daily))throw unavailable();return;}
  if(!record(row.leases))throw unavailable();
  if(kind==='user'&&(!count(row.daily)||!count(row.minute)||!count(row.minuteCount)))throw unavailable();
  if(Object.values(row.leases).some(v=>!count(kind==='global'?v?.expires:v)))throw unavailable();
 }
 const active=(row,kind,time)=>Object.fromEntries(Object.entries(row?.leases??{}).filter(([,v])=>(kind==='global'?v.expires:v)>time));
 async function acquire(actor,ip,guest=true,claim){
  if(!label(actor)||!label(ip)||typeof guest!=='boolean'||
     (claim&&(!/^ACCESS#SCENARIO#[0-9a-f-]{36}$/.test(claim.id??'')||!record(claim.value))))throw unavailable();
  for(let attempt=0;attempt<8;attempt++){
   const time=now(),day=new Date(time).toISOString().slice(0,10),minute=Math.floor(time/60000);
   const ids=['NAVIGATOR#GLOBAL','ACTOR#'+actor+'#'+day,'IP#'+ip+'#'+day];
   const [global,user,address,previousDay,priorClaim]=await Promise.all([
    ...ids.map(id=>store.get(id)),store.get('ACTOR#'+actor+'#'+new Date(time-86400000).toISOString().slice(0,10)),
    claim?store.get(claim.id):Promise.resolve(undefined)]);
   valid(global,'global');valid(user,'user');valid(address,'ip');valid(previousDay,'user');
   if(priorClaim)throw new PlatformError(409,'This request was already submitted.');
   const all=active(global,'global',time),person={...active(previousDay,'user',time),...active(user,'user',time)};
   const retryMinute=Math.max(1,Math.ceil(((minute+1)*60000-time)/1000)),retryDay=Math.max(1,Math.ceil((Date.parse(day)+86400000-time)/1000));
   if((user?.daily??0)>=(guest?limits.guestDaily:limits.accountDaily)||(guest&&(address?.daily??0)>=limits.ipDaily))
    throw new AbuseLimitError('daily_allowance','Daily AI request allowance reached. Try tomorrow.',retryDay);
   if((user?.minute===minute?user.minuteCount:0)>=(guest?limits.guestMinute:limits.accountMinute))
    throw new AbuseLimitError('rate_limit','Please wait before sending another AI request.',retryMinute);
   if(Object.keys(person).length>=(guest?limits.guestConcurrent:limits.accountConcurrent))
    throw new AbuseLimitError('visitor_busy','An AI request is already in progress.',Math.max(1,Math.ceil((Math.min(...Object.values(person))-time)/1000)));
   if(Object.keys(all).length>=limits.globalConcurrent)
    throw new AbuseLimitError('capacity','AI is busy. Please try again shortly.',Math.max(1,Math.ceil((Math.min(...Object.values(all).map(v=>v.expires))-time)/1000)));
   const id=randomUUID(),expires=time+leaseMs,expiresAt=Math.ceil((time+2*86400000)/1000),lease={id,ids,expires};
   const changes=[
    {id:ids[0],previous:global,value:{leases:{...all,[id]:{expires}},expiresAt}},
    {id:ids[1],previous:user,value:{daily:(user?.daily??0)+1,minute,minuteCount:(user?.minute===minute?user.minuteCount:0)+1,leases:{...active(user,'user',time),[id]:expires},expiresAt}},
    ...(guest?[{id:ids[2],previous:address,value:{daily:(address?.daily??0)+1,expiresAt}}]:[]),
    ...(claim?[{id:claim.id,previous:undefined,value:{...claim.value,lease}}]:[])
   ];
   if(await store.transaction(changes))return lease;
  }
  throw unavailable();
 }
 async function finish(lease,claim){
  if(!record(lease)||!Array.isArray(lease.ids)||lease.ids.length!==3||
     !/^[0-9a-f-]{36}$/.test(lease.id??''))throw unavailable();
  for(let attempt=0;attempt<8;attempt++){
   const ids=[lease.ids[0],lease.ids[1]],rows=await Promise.all(ids.map(id=>store.get(id)));
   rows.forEach((r,i)=>valid(r,i===0?'global':'user'));
   if(rows.some(r=>!r))throw unavailable();
   const changes=rows.map((row,i)=>{const leases={...row.leases};delete leases[lease.id];return{id:ids[i],previous:row,value:{...row,leases}};});
   if(claim)changes.push(claim);
   if(await store.transaction(changes))return true;
  }
  throw unavailable();
 }
 return{acquire,finish};
}
