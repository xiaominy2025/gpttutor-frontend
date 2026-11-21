import {createHash} from 'node:crypto';
import {closeSync,fsyncSync,openSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {validateCanaryManifest} from './navigator-paid-guard.mjs';

const journalName='navigator-alpha-initial.ndjson';
const hash=text=>createHash('sha256').update(text).digest('hex');
const opaque=/^[A-Za-z0-9_-]{43}$/;
const signedContinuation=/^\d{13}\.[a-f0-9]{24}\.[a-f0-9]{64}(?:\.[A-Za-z0-9_-]{1,4096})?$/;
const hex=/^[a-f0-9]{64}$/;
const nonnegative=value=>Number.isSafeInteger(value)&&value>=0;

function acknowledgement(result,step,previousReceipt,spent){
 if(result?.status!==200)throw Error('non-success');
 if(step===0){
  if(typeof result.cookie!=='string'||!/^__Host-engent-navigator=[A-Za-z0-9_-]{43}\.\d{10}\.[A-Za-z0-9_-]{43}$/.test(result.cookie))
   throw Error('invalid-bootstrap');
  return {};
 }
 const {canary,result:guidance}=result;
 const usage=canary?.usage;
 const final=step===4;
 if(!usage||usage.step!==step||usage.withinBounds!==true||
    ![usage.inputs,usage.outputs,usage.bytes,usage.cost,canary.spentMicros].every(nonnegative)||
    usage.bytes<1||usage.bytes>12000||usage.inputs>usage.bytes+1024||usage.outputs>1500||
    usage.cost!==Math.ceil(usage.inputs*.125+usage.outputs*.50)||
    spent+usage.cost!==canary.spentMicros||canary.spentMicros>30000||
    typeof usage.requestHash!=='string'||!hex.test(usage.requestHash)||
    typeof guidance?.reply!=='string'||!guidance.reply.trim()||!Array.isArray(guidance.followUps)||
    guidance.done!==final||canary.state!==(final?'complete':'ready'))throw Error('invalid-accounting');
 if(final){
  if(guidance.continuation!==null||canary.receipt!==undefined||guidance.followUps.length!==0)throw Error('invalid-closure');
 }else if(typeof canary.receipt!=='string'||!opaque.test(canary.receipt)||canary.receipt===previousReceipt||
    typeof guidance.continuation!=='string'||!signedContinuation.test(guidance.continuation))throw Error('invalid-receipt');
 return {bytes:usage.bytes,inputs:usage.inputs,outputs:usage.outputs,costMicros:usage.cost,
  spentMicros:canary.spentMicros,requestHash:usage.requestHash};
}

export function openCanaryJournal({directory,manifest,artifactSha256,transport,now=Date.now}){
 const pin=validateCanaryManifest(manifest);
 if(Object.keys(manifest).sort().join(',')!=='approval,endsAt,source,startsAt'||
    typeof artifactSha256!=='string'||!hex.test(artifactSha256)||typeof transport!=='function')
  throw Error('Invalid journal binding');
 if(now()<pin.startsAt||now()>=pin.endsAt)throw Error('Canary window closed');
 const manifestHash=hash(JSON.stringify({source:manifest.source,approval:pin.approval,startsAt:pin.startsAt,endsAt:pin.endsAt}));
 const binding=Object.freeze({run:'alpha-initial',manifestHash,artifactSha256,source:manifest.source,approval:pin.approval});
 const filename=join(directory,journalName);
 let file;
 try {file=openSync(filename,'wx',0o600);}
 catch(error){if(error?.code==='EEXIST')throw Error('Canary journal already exists. Do not resume or restart.');throw error;}
 let phase='ready',step=0,previous,spent=0;
 function append(record){
  writeFileSync(file,JSON.stringify(record)+'\n');
  fsyncSync(file);
 }
 function closeFile(){if(file!==undefined){const handle=file;file=undefined;closeSync(handle);}}
 try{
  append({event:'run',...binding});
  // On platforms supporting directory fsync, persist the exclusive directory entry as well.
  if(process.platform!=='win32'){
   const parent=openSync(directory,'r');
   try{fsyncSync(parent);}finally{closeSync(parent);}
  }
 }catch(error){closeFile();throw error;}

 async function runStep(){
  if(phase!=='ready')throw Error('Canary journal does not allow another invocation');
  phase='in-flight';
  let stop='journal-write';
  try{
   append({event:'pending',step});
   if(now()<pin.startsAt||now()>=pin.endsAt){stop='window-closed';throw Error('Canary window closed');}
   stop='transport-uncertain';
   const result=await transport({binding,step,previous:previous===undefined?undefined:structuredClone(previous)});
   stop='invalid-result';
   const details=acknowledgement(result,step,previous?.canary?.receipt,spent);
   const nextPrevious=structuredClone(result);
   stop='journal-write';
   append({event:'acknowledged',step,...details});
   previous=nextPrevious;
   if(step>0)spent=details.spentMicros;
   step++;
   phase=step===5?'complete':'ready';
   if(phase==='complete'){closeFile();previous=undefined;}
   return {step:step-1,state:phase,...details};
  }catch{
   phase='stopped';
   previous=undefined;
   if(file!==undefined){
    try{append({event:'stopped',step,reason:stop});}catch{/* Existing journal blocks restart. */}
    closeFile();
   }
   throw Error('Canary stopped: '+stop);
  }
 }
 function close(){
  if(phase==='in-flight')throw Error('Canary invocation is pending');
  if(phase==='ready'){
   phase='stopped';previous=undefined;
   try{append({event:'stopped',step,reason:'operator-closed'});}finally{closeFile();}
  }
 }
 return {filename,binding,runStep,close};
}
