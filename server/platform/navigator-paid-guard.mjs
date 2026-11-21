import {createHash,randomBytes} from 'node:crypto';

export const canarySource='934f2fd837423c45d77082566ba5f55a50df4771';
export const canaryPrice=Object.freeze({model:'gpt-6-luna',input:.125,output:.50});
const budget=30000,maxSteps=4,maxBytes=12000,maxOutput=1500;
const ledgerId='CANARY#ALPHA-INITIAL';
const hash=value=>createHash('sha256').update(value).digest('hex');
const monthOf=time=>new Date(time).toISOString().slice(0,7);

export function inspectCanaryRequest(request){
 if(request?.model!==canaryPrice.model||request.service_tier!=='default'||
    request.max_output_tokens!==maxOutput||request.store!==false||request.reasoning?.effort!=='none'||
    request.tools!==undefined)throw Error('Canary model configuration mismatch');
 const body=JSON.stringify(request);
 const bytes=Buffer.byteLength(body,'utf8');
 if(bytes>maxBytes)throw Error('Canary provider request exceeds byte limit');
 const inputCeiling=bytes+1024;
 return {body,bytes,inputCeiling,reservation:Math.ceil(inputCeiling*canaryPrice.input+maxOutput*canaryPrice.output),
  requestHash:hash(body)};
}

export function validateCanaryManifest(manifest){
 if(!manifest||manifest.source!==canarySource||typeof manifest.approval!=='string'||
    !/^[a-zA-Z0-9._-]{12,120}$/.test(manifest.approval)||
    !Number.isSafeInteger(manifest.startsAt)||!Number.isSafeInteger(manifest.endsAt)||
    manifest.startsAt>=manifest.endsAt||manifest.endsAt-manifest.startsAt>3600000||
    !Number.isFinite(new Date(manifest.startsAt).getTime())||!Number.isFinite(new Date(manifest.endsAt).getTime())||
    monthOf(manifest.startsAt)!==monthOf(manifest.endsAt))throw Error('Invalid canary manifest');
 return {approval:manifest.approval,month:monthOf(manifest.startsAt),startsAt:manifest.startsAt,endsAt:manifest.endsAt};
}

export function canaryAttempt({manifest,store,step,receipt,master,send,now=Date.now}){
 const pin=validateCanaryManifest(manifest);
 if(!Number.isInteger(step)||step<1||step>maxSteps)throw Error('Invalid canary step');
 let held,known,dispatchStarted=false;
 function checkWindow(){
  const time=now();
  if(time<pin.startsAt||time>=pin.endsAt||monthOf(time)!==pin.month)throw Error('Canary window closed');
 }
 async function generate(key,request){
  checkWindow();
  const data=inspectCanaryRequest(request);
  const current=await store.get(ledgerId);
  if(!current&&step!==1)throw Error('Canary must start at step one');
  if(current&&(current.approval!==pin.approval||current.month!==pin.month||
     current.phase!=='ready'||current.nextStep!==step))throw Error('Canary ledger stopped or step already used');
  if(step>1&&(typeof receipt!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(receipt)||
     hash(receipt)!==current?.receiptHash))throw Error('Canary prior receipt missing or invalid');
  const spent=current?.spent??0;
  if(!Number.isSafeInteger(spent)||spent<0||spent+data.reservation>budget)throw Error('Canary allowance exceeded');
  const value={approval:pin.approval,month:pin.month,phase:'held',nextStep:step,spent,
   hold:data.reservation,requestHash:data.requestHash,attempts:[...(current?.attempts??[])]};
  const version=(current?.version??0)+1;
  if(!await store.replace(ledgerId,version-1,value))throw Error('Canary slot already claimed');
  held={value,version};
  checkWindow();
  await master.assertEnabled();
  checkWindow();
  dispatchStarted=true;
  const response=await send(key,data.body);
  const usage=response?.usage;
  if(![usage?.input_tokens,usage?.output_tokens].every(token=>Number.isSafeInteger(token)&&token>=0))
   throw Error('Canary usage unknown');
  const inputs=usage.input_tokens,outputs=usage.output_tokens;
  const cost=Math.ceil(inputs*canaryPrice.input+outputs*canaryPrice.output);
  if(!Number.isSafeInteger(cost))throw Error('Canary usage out of range');
  known={step,inputs,outputs,cost,bytes:data.bytes,requestHash:data.requestHash,
   withinBounds:inputs<=data.inputCeiling&&outputs<=maxOutput&&cost<=data.reservation&&
    (response.model===undefined||response.model===canaryPrice.model)&&
    (response.service_tier===undefined||response.service_tier==='default')&&
    (response.status===undefined||response.status==='completed')};
  return response;
 }
 async function finish(success){
  if(!held||!known)return {state:held?'held':'unclaimed'};
  const {value,version}=held;
  const phase=!success||!known.withinBounds?'stopped':step===maxSteps?'complete':'ready';
  // A lost response cannot be resumed by guessing the next step.
  const nextReceipt=phase==='ready'?randomBytes(32).toString('base64url'):null;
  const next={...value,phase,nextStep:step+1,spent:value.spent+known.cost,hold:0,
   ...(nextReceipt?{receiptHash:hash(nextReceipt)}:{}),
   attempts:[...value.attempts,known]};
  if(!await store.replace(ledgerId,version,next))throw Error('Canary accounting not confirmed');
  return {state:phase,usage:known,spentMicros:next.spent,...(nextReceipt?{receipt:nextReceipt}:{})};
 }
 return {generate,finish,dispatchStarted:()=>dispatchStarted};
}
