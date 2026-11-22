// Pure, offline-testable ownership and terminal-response checks. Never return secret data.
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
export function acknowledgedInstallRevision(acknowledgement,expectedHash,priorRevision){
 if(acknowledgement?.CodeSha256!==expectedHash||!uuid.test(acknowledgement.RevisionId??'')||acknowledgement.RevisionId===priorRevision)
  throw Error('Install ownership was not acknowledged; stop and reconcile');
 return acknowledgement.RevisionId;
}
export function assertOwnedPrivateRevision(configuration,expectedHash,ownedRevision){
 if(!uuid.test(ownedRevision??'')||configuration?.CodeSha256!==expectedHash||configuration.RevisionId!==ownedRevision)
  throw Error('Private code revision ownership lost; stop without overwriting');
}
export function observeTerminalLambdaResponse(response,onTerminal){
 return {status:response.status,headers:response.headers,async json(){
  if(response.status!==200||response.headers.has('x-amz-function-error')||response.headers.get('x-amz-executed-version')!=='$LATEST')
   throw Error('Terminal Lambda result not established');
  const payload=await response.json(); // A truncated/unreadable payload must not clear uncertainty.
  await onTerminal();
  return payload;
 }};
}

// Configuration ownership excludes only deployment lifecycle/code-result fields.
// Hashes (never raw environment values) may be recorded in operator evidence.
import {createHash} from 'node:crypto';
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
export function runtimeConfigurationHash(c){
 const keys=['Role','Runtime','Handler','Timeout','MemorySize','Environment','Layers','Architectures','VpcConfig',
  'KMSKeyArn','DeadLetterConfig','TracingConfig','FileSystemConfigs','EphemeralStorage','LoggingConfig',
  'SnapStart','PackageType','RuntimeVersionConfig','ImageConfigResponse'];
 return createHash('sha256').update(JSON.stringify(canonical(Object.fromEntries(keys.filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))))).digest('hex');
}

export function deploymentWriteEvents(records,functionArn){
 const match=/^arn:aws:lambda:([^:]+):(\d{12}):function:([^:]+)$/.exec(functionArn);
 if(!match||!Array.isArray(records))throw Error('CloudTrail target/result unavailable');
 const [,region,account,name]=match;
 const identifiers=[name,account+':function:'+name,functionArn];
 const targets=value=>typeof value==='string'&&identifiers.some(id=>value===id||value.startsWith(id+':'));
 return records.flatMap(item=>{
  const e=JSON.parse(item.CloudTrailEvent);
  if(e.eventSource!=='lambda.amazonaws.com'||(e.awsRegion&&e.awsRegion!==region)||
     (e.recipientAccountId&&e.recipientAccountId!==account))return [];
  const p=e.requestParameters??{};
  const names=[p.functionName,p.functionArn,p.resourceArn,...(e.resources??[]).flatMap(r=>[r.ARN,r.resourceName]),
   ...(item.Resources??[]).map(r=>r.ResourceName)];
  if(!names.some(targets))return [];
  return [{at:e.eventTime,event:e.eventName,eventId:e.eventID,principal:e.userIdentity?.arn,error:e.errorCode,
   functionArn,priorRevision:p.revisionId,publish:p.publish,acknowledgedRevision:e.responseElements?.revisionId,
   hash:e.responseElements?.codeSha256}];
 });
}

// Read polls only. Never retries a deployment write or an invocation. A different
// completed revision is accepted only with two stable reads and exact CloudTrail ownership.
export async function completedDeployment({acknowledgement:ack,priorRevision,expectedHash,configurationHash,
 functionArn,principal,startedAt,readConfiguration,readWriteEvents,now=Date.now,sleep,
 timeoutMs=600000,pollMs=15000}){
 const acknowledgedRevision=acknowledgedInstallRevision(ack,expectedHash,priorRevision);
 const modified=Date.parse(ack.LastModified);
 let candidateRevision;
 const check=c=>{
  if(c?.CodeSha256!==expectedHash||runtimeConfigurationHash(c)!==configurationHash||
     ![functionArn,functionArn+':$LATEST'].includes(c.FunctionArn)||c.Version!=='$LATEST'||
     c.LastModified!==ack.LastModified||!uuid.test(c.RevisionId??'')||c.RevisionId===priorRevision||
     (candidateRevision&&c.RevisionId!==candidateRevision)||
     c.State!=='Active'||!['InProgress','Successful'].includes(c.LastUpdateStatus))
   throw Error('Deployment failed or configuration/ownership drift; reconcile without overwriting');
 };
 if(!Number.isFinite(modified)||modified<Math.floor(startedAt/1000)*1000||modified>now()+1000)
  throw Error('Deployment acknowledgement time is ambiguous');
 check(ack);
 const deadline=now()+timeoutMs;
 while(now()<deadline){
  const first=await readConfiguration(true);check(first);
  if(first.LastUpdateStatus==='Successful'){
   const second=await readConfiguration(false);check(second);
   if(second.LastUpdateStatus!=='Successful'||first.RevisionId!==second.RevisionId)
    throw Error('Completed deployment revision is unstable; reconcile without overwriting');
   candidateRevision=first.RevisionId;
   const events=await readWriteEvents(startedAt,now());
   if(!Array.isArray(events))throw Error('CloudTrail evidence unavailable');
   if(events.length>1)throw Error('Concurrent Lambda writes detected; reconcile without overwriting');
   if(events.length===1){
    const e=events[0];
    if(e.event!=='UpdateFunctionCode20150331v2'||e.principal!==principal||e.error||
       e.functionArn!==functionArn||e.priorRevision!==priorRevision||e.publish!==false||
       e.acknowledgedRevision!==acknowledgedRevision||e.hash!==expectedHash||
       Math.floor(Date.parse(e.at)/1000)!==Math.floor(modified/1000)||typeof e.eventId!=='string'||!uuid.test(e.eventId))
     throw Error('CloudTrail does not establish exact deployment ownership');
    // Pin again after the audit lookup. All subsequent operations use this ready
    // revision as a CAS token; the acknowledgement revision remains historical evidence.
    const confirmed=await readConfiguration(true);check(confirmed);
    assertOwnedPrivateRevision(confirmed,expectedHash,first.RevisionId);
    if(confirmed.LastUpdateStatus!=='Successful')throw Error('Completed deployment changed');
    return {acknowledgedRevision,readyRevision:confirmed.RevisionId,hash:expectedHash,
     configurationHash,lastModified:confirmed.LastModified,cloudTrailEventId:e.eventId};
   }
  }
  await sleep(pollMs);
 }
 throw Error('Ready deployment or CloudTrail evidence timed out; reconcile without overwriting');
}
