import {Sha256} from '@aws-crypto/sha256-js';
import {HttpRequest} from '@smithy/protocol-http';
import {SignatureV4} from '@smithy/signature-v4';
import {setTimeout as delay} from 'node:timers/promises';
import {openCanaryJournal} from '../server/platform/navigator-canary-journal.mjs';
import {validateCanaryManifest} from '../server/platform/navigator-paid-guard.mjs';

const region='us-east-1';
const account='771049112957';
const target='arn:aws:lambda:'+region+':'+account+':function:decisionnavigator-alpha-api';
const role='arn:aws:iam::'+account+':role/decisionnavigator-alpha-runtime';
const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5';
const base='/2015-03-31/functions/'+target;
const messages=[
 'I study chemistry and am weighing an industry internship against summer research. I want to learn what suits me before deciding whether to pursue graduate school.',
 'How can I tell which objectives the summer should serve?',
 'How could I compare what I might actually learn from the two experiences?',
 'How can I weigh what I learn against practical constraints without treating it as a final verdict?'
];
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const sha256=/^[a-f0-9]{64}$/;
const sha256Base64=/^[A-Za-z0-9+/]{43}=$/;
const validCount=value=>Number.isSafeInteger(value)&&value>=0;
const latest='$LATEST';

function configurationMatches(value,version,digest,revision){
 const variables=value?.Environment?.Variables;
 const keys=variables&&Object.keys(variables).sort().join(',');
 const versionArn=target+':'+version;
 return value?.Version===version&&(value.FunctionArn===versionArn||(version===latest&&value.FunctionArn===target))&&
  value.CodeSha256===digest&&(!revision||value.RevisionId===revision)&&value.Role===role&&
  value.Runtime==='nodejs22.x'&&value.Handler==='index.handlerEntry'&&value.Timeout===29&&
  value.State==='Active'&&(version!==latest||value.LastUpdateStatus==='Successful')&&
  keys==='NAVIGATOR_ENABLED,STAGE'&&variables.STAGE==='alpha'&&variables.NAVIGATOR_ENABLED==='false';
}

export function createNavigatorCanaryOperator({
 directory,manifest,artifactSha256,publicCodeSha256,latestRevision,aliasRevision,masterRevision,credentialVersion=3,
 credentials,fetchOnce=globalThis.fetch,now=Date.now,monotonic=()=>performance.now(),sleep=delay,observeResponse
}){
 const pin=validateCanaryManifest(manifest);
 if(typeof artifactSha256!=='string'||!sha256.test(artifactSha256)||
    typeof publicCodeSha256!=='string'||!sha256Base64.test(publicCodeSha256)||
    !uuid.test(latestRevision??'')||!uuid.test(aliasRevision??'')||
    !Number.isSafeInteger(masterRevision)||masterRevision<1||!Number.isSafeInteger(credentialVersion)||credentialVersion<1||!credentials||typeof fetchOnce!=='function'||
    (observeResponse!==undefined&&typeof observeResponse!=='function'))
  throw Error('Invalid operator pins');
 const installedDigest=Buffer.from(artifactSha256,'hex').toString('base64');
 if(installedDigest===publicCodeSha256)throw Error('Private canary and public OFF artifacts must differ');
 const signerFor=service=>new SignatureV4({service,region,credentials,sha256:Sha256});
 const signers={lambda:signerFor('lambda'),dynamodb:signerFor('dynamodb'),ssm:signerFor('ssm')};

 // One signed fetch per operation. Do not follow redirects or expose AWS error bodies.
 async function request(service,method,path,{query={},headers={},body,timeout=4500}={}){
  const hostname=service+'.'+region+'.amazonaws.com';
  const signer=signers[service];
  const signal=AbortSignal.timeout(timeout);
  const signed=await signer.sign(new HttpRequest({protocol:'https:',hostname,path,method,query,body,
   headers:{host:hostname,...headers}}));
  signal.throwIfAborted();
  const suffix=new URLSearchParams(query).toString();
  const response=await fetchOnce('https://'+hostname+path+(suffix?'?'+suffix:''),{
   method,headers:signed.headers,body:signed.body,redirect:'error',signal
  });
  if(response.status!==200||response.headers.has('x-amz-function-error'))throw Error('AWS operation failed');
  if(path.endsWith('/invocations')&&response.headers.get('x-amz-executed-version')!==latest)
   throw Error('Unexpected Lambda execution version');
  return response.json();
 }
 function getState(pk,attributes){
  const names=Object.fromEntries(attributes.map((attribute,index)=>['#n'+index,attribute]));
  return request('dynamodb','POST','/',{headers:{'content-type':'application/x-amz-json-1.0',
   'x-amz-target':'DynamoDB_20120810.GetItem'},body:JSON.stringify({
   TableName:table,Key:{pk:{S:pk},sk:{S:'STATE'}},ConsistentRead:true,
   ProjectionExpression:Object.keys(names).join(', '),ExpressionAttributeNames:names
  })});
 }
 async function preflight(){
  const installed=await request('lambda','GET',base+'/configuration',{query:{Qualifier:latest}});
  if(!configurationMatches(installed,latest,installedDigest,latestRevision))throw Error('Private code or configuration drift');
  const alias=await request('lambda','GET',base+'/aliases/live');
  if(alias?.AliasArn!==target+':live'||alias.FunctionVersion!=='1'||alias.RevisionId!==aliasRevision||
     Object.keys(alias.RoutingConfig?.AdditionalVersionWeights??{}).length!==0)throw Error('Public alias drift');
  const off=await request('lambda','GET',base+'/configuration',{query:{Qualifier:'1'}});
  if(!configurationMatches(off,'1',publicCodeSha256))throw Error('Public OFF configuration drift');
  const {Item}=await getState('AI#CONFIG',['pk','sk','suspended','revision']);
  if(Item?.pk?.S!=='AI#CONFIG'||Item.sk?.S!=='STATE'||Item.suspended?.BOOL!==false||
     Item.revision?.N!==String(masterRevision))throw Error('Shared master state drift');
  const metadata=await request('ssm','POST','/',{headers:{'content-type':'application/x-amz-json-1.1',
   'x-amz-target':'AmazonSSM.DescribeParameters'},body:JSON.stringify({ParameterFilters:[{Key:'Name',Option:'Equals',Values:['/decisionnavigator-alpha/openai-api-key']}]})});
  const parameter=metadata.Parameters?.find(p=>p.Name==='/decisionnavigator-alpha/openai-api-key');
  if(metadata.Parameters?.length!==1||parameter?.Type!=='SecureString'||parameter.Tier!=='Standard'||parameter.Version!==credentialVersion)
   throw Error('Credential metadata drift');
 }
 function checkWindow(){
  if(now()<pin.startsAt||now()>=pin.endsAt)throw Error('Canary window closed');
 }
 async function getBudget(){
  const {Item}=await getState('NAVIGATOR#BUDGET#'+pin.month,['spent','reserved','paused']);
  if(!Item)return {spent:0,reserved:0,paused:false};
  const spent=Number(Item.spent?.N),reserved=Number(Item.reserved?.N);
  if(!validCount(spent)||!validCount(reserved))throw Error('Canonical ledger unavailable');
  return {spent,reserved,paused:Item.paused?.BOOL===true};
 }

 const capabilities=new Set();
 let cookie,history=[],secondCompletedAt,baseline,lastTransportResult;
 const journal=openCanaryJournal({directory,manifest,artifactSha256,now,
  transport:async({binding,step,previous})=>{
   if(binding.artifactSha256!==artifactSha256)throw Error('Journal artifact mismatch');
   if(step===0){
    baseline=await getBudget();
    if(baseline.reserved!==0||baseline.paused)throw Error('Canonical ledger has existing holds or is paused');
    const {Item}=await getState('NAVIGATOR#CANARY#ALPHA-INITIAL',['phase']);
    if(Item)throw Error('Canary ledger already exists');
   }
   if(step===3){
    const remaining=61000-(monotonic()-secondCompletedAt);
    if(remaining>0)await sleep(remaining);
    if(monotonic()-secondCompletedAt<61000)throw Error('Guest pacing not satisfied');
   }
   checkWindow();
   await preflight();
   checkWindow();
   const event={approval:pin.approval,step};
   if(step===1){
    cookie=previous.cookie;
    Object.assign(event,{cookie,history});
   }
   if(step>1){
    history.push({role:'user',text:messages[step-2]},{role:'assistant',text:previous.result.reply});
    Object.assign(event,{cookie,history,continuation:previous.result.continuation,receipt:previous.canary.receipt});
   }
   const result=await request('lambda','POST',base+'/invocations',{query:{Qualifier:latest},
    headers:{'content-type':'application/json','x-amz-invocation-type':'RequestResponse','x-amz-log-type':'None'},
    body:JSON.stringify(event),timeout:35000});
   if(step===2)secondCompletedAt=monotonic();
   lastTransportResult=result;
   for(const value of [result.cookie,result.result?.continuation,result.canary?.receipt])if(typeof value==='string'){
    capabilities.add(value);if(value.startsWith('__Host-engent-navigator='))capabilities.add(value.split('=')[1]);
   }
   return result;
  }
 });
 function clear(){cookie=undefined;history=[];lastTransportResult=undefined;capabilities.clear();}
 function safeSyntheticEvidence(value){
  const text=JSON.stringify(value);
  if([...capabilities].some(capability=>text.includes(capability))||
     /__Host-engent-navigator=|[A-Za-z0-9_-]{43}\.\d{10}\.[A-Za-z0-9_-]{43}|\d{13}\.[a-f0-9]{24}\.[a-f0-9]{64}/.test(text))
   throw Error('Capability-shaped response cannot be saved');
  return value;
 }
 async function run(){
  const receipts=[];
  try{
   for(let i=0;i<=4;i++){
    const acknowledged=await journal.runStep();receipts.push(acknowledged);
    // Explicit owner-authorized evidence for this synthetic case only, after durable validation.
    // Never pass bootstrap cookies, continuations, raw receipts or the full provider response.
    if(i>0&&observeResponse)await observeResponse(safeSyntheticEvidence({step:i,status:200,syntheticPrompt:messages[i-1],reply:lastTransportResult.result.reply,
     followUps:lastTransportResult.result.followUps.map(({dimension,question})=>({dimension,question})),done:lastTransportResult.result.done,usage:acknowledged}));
    lastTransportResult=undefined;
   }
   await preflight();
   const budget=await getBudget();
   const paidReceipts=receipts.slice(1);
   const expected=paidReceipts.at(-1).spentMicros;
   const {Item}=await getState('NAVIGATOR#CANARY#ALPHA-INITIAL',['phase','spent','hold','nextStep']);
   if(budget.spent-baseline.spent!==expected||budget.reserved!==0||budget.paused||
      Item?.phase?.S!=='complete'||Item.spent?.N!==String(expected)||Item.hold?.N!=='0'||Item.nextStep?.N!=='5')
    throw Error('Canary reconciliation failed');
   return {status:'reconciled',requests:paidReceipts.length,spentMicros:expected,receipts:paidReceipts};
  }catch{
   journal.close();
   throw Error('Canary stopped. Do not retry; reconcile using the sanitized journal.');
  }finally{clear();}
 }
 // Single caller even when two operators share the same in-process object.
 let started=false;
 return {filename:journal.filename,async run(){
  if(started)throw Error('Canary operator already started');
  started=true;
  return run();
 }};
}
