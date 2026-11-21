// Server-only, dependency-injected contract. readState must perform a fresh,
// strongly consistent read of the environment's existing AI#CONFIG / STATE.
// ON is necessary, never sufficient: callers retain their own auth, readiness,
// reservations, budgets and timeouts. No enabled decision is cached here.
export class PaidAiMasterError extends Error {
 constructor(reason){super(reason==='paused'?'Paid AI is paused.':'Paid AI control is unavailable.');this.name='PaidAiMasterError';this.status=503;this.code=reason==='paused'?'paid_ai_paused':'paid_ai_master_unavailable';}
}
export function createPaidAiMasterGate({readState,timeoutMs=2000}={}){
 return {async assertEnabled(){
  if(typeof readState!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw new PaidAiMasterError('unavailable');
  const controller=new AbortController();let timer,state;
  try{state=await Promise.race([Promise.resolve().then(()=>readState({signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new PaidAiMasterError('unavailable'));},timeoutMs);})]);}catch{throw new PaidAiMasterError('unavailable');}finally{clearTimeout(timer);}

  if(!state||typeof state!=='object'||Array.isArray(state)||typeof state.suspended!=='boolean'||!Number.isSafeInteger(state.revision)||state.revision<1)throw new PaidAiMasterError('unavailable');
  if(state.suspended)throw new PaidAiMasterError('paused');
  return {revision:state.revision};
 }};
}
