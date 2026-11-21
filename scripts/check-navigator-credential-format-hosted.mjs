// One non-paid direct $LATEST credential check. No public alias/configuration writes.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,openSync,closeSync,fsyncSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const mode=process.argv[2],afterOwnerUpdate=process.argv[3]==='--after-owner-update';
if(process.argv.length>4||(process.argv[3]&&!afterOwnerUpdate))throw Error('Unexpected arguments');
const fn='decisionnavigator-alpha-api',dir=resolve('.artifacts/navigator-credential-format-20261121');
const run=afterOwnerUpdate?'credential-after-owner-update':'credential';
const zip=dir+'/credential-check.zip',journal=dir+'/'+run+'-journal.json';
if(!['check','install','ready','invoke','restore','verify'].includes(mode))throw Error('Invalid operation');
const original='HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=';
const bytes=readFileSync(zip),hash=createHash('sha256').update(bytes).digest('base64');
const expected='c39b8feac98366e5421e38c0523c587761a8bc79a348af64e5ee64f0a563c56e';
if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Unreviewed credential bundle');
let j=existsSync(journal)?JSON.parse(readFileSync(journal)):{hash,createdAt:new Date().toISOString(),afterOwnerUpdate};
if(j.hash!==hash||Boolean(j.afterOwnerUpdate)!==afterOwnerUpdate)throw Error('Journal mismatch');
function save(){const f=openSync(journal+'.tmp','w');try{writeFileSync(f,JSON.stringify(j,null,2));fsyncSync(f);}finally{closeSync(f);}renameSync(journal+'.tmp',journal);}
function aws(service,operation,flags=[]){
 try{return JSON.parse(execFileSync('aws',[service,operation,...flags,'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_RETRY_MODE:'standard'}}));}
 catch{throw Error('AWS '+service+'/'+operation+' failed or uncertain; reconcile without retry');}
}
const cfg=()=>aws('lambda','get-function-configuration',['--function-name',fn,'--qualifier','$LATEST']);
function preflight(){
 if(aws('sts','get-caller-identity').Arn!=='arn:aws:iam::771049112957:user/engentlabs-cli')throw Error('Identity drift');
 const a=aws('lambda','get-alias',['--function-name',fn,'--name','live']);
 if(a.FunctionVersion!=='1'||a.RevisionId!=='40267485-ed37-4a71-adbc-4a6c36ebb483')throw Error('Public alias drift');
 const p=aws('lambda','get-function-configuration',['--function-name',fn,'--qualifier','1']);
 if(p.CodeSha256!==original||p.Environment?.Variables?.NAVIGATOR_ENABLED!=='false')throw Error('OFF version drift');
 const integration=aws('apigatewayv2','get-integration',['--api-id','8qmgd1ghdi','--integration-id','5wsf6z0']);
 if(integration.IntegrationUri!=='arn:aws:lambda:us-east-1:771049112957:function:'+fn+':live')throw Error('Routing drift');
 const master=aws('dynamodb','get-item',['--table-name','decisiontree-alpha-staging-Data-JH4B4OFXWER5','--consistent-read','--key',JSON.stringify({pk:{S:'AI#CONFIG'},sk:{S:'STATE'}}),'--projection-expression','pk,sk,suspended,revision']);
 if(master.Item?.suspended?.BOOL!==false||master.Item?.revision?.N!=='9')throw Error('Master drift');
 const c=cfg();
 if(c.State!=='Active'||c.LastUpdateStatus!=='Successful'||c.Role!=='arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime'||
  c.Environment?.Variables?.STAGE!=='alpha'||c.Environment?.Variables?.NAVIGATOR_ENABLED!=='false'||c.Handler!=='index.handlerEntry'||c.Runtime!=='nodejs22.x'||c.Timeout!==29||c.MemorySize!==256)throw Error('Runtime configuration drift');
 return c;
}
function mutation(operation,flags){
 if(j.pending)throw Error('Uncertain operation requires read-only reconciliation');
 j.pending={operation,mode,at:new Date().toISOString()};save();
 const result=aws('lambda',operation,flags);j.receipts??=[];j.receipts.push({mode,result});delete j.pending;save();return result;
}
const c=preflight();
if(mode==='check'){
 if(j.before||c.CodeSha256!==original)throw Error('Not a fresh check');
 if(afterOwnerUpdate){
  const metadata=aws('ssm','describe-parameters',['--parameter-filters','Key=Name,Option=Equals,Values=/decisionnavigator-alpha/openai-api-key',
   '--query','Parameters[0].{Version:Version,Type:Type,Tier:Tier}']);
  if(metadata?.Type!=='SecureString'||metadata?.Tier!=='Standard'||!Number.isInteger(metadata.Version)||metadata.Version<=1)
   throw Error('Owner update not observed in parameter metadata');
  j.parameterVersion=metadata.Version;
 }
 j.before={revision:c.RevisionId,hash:c.CodeSha256};save();
}else{
 if(!j.before)throw Error('Fresh check required');
 if(mode==='install'){
  if(j.installed||c.RevisionId!==j.before.revision||c.CodeSha256!==original)throw Error('Install drift or replay');
  j.installed=mutation('update-function-code',['--function-name',fn,'--revision-id',c.RevisionId,'--no-publish','--zip-file','fileb://'+zip]);save();
 }else if(mode==='ready'){
  if(c.CodeSha256!==(j.restored?original:hash))throw Error('Code mismatch');j.ready=c.RevisionId;save();
 }else if(mode==='invoke'){
  if(j.result||j.invoked||j.restored||c.RevisionId!==j.ready||c.CodeSha256!==hash)throw Error('Invocation drift or replay');
  j.invoked=true;save();const input=dir+'/'+run+'-input.json',output=dir+'/'+run+'-output.json';
  writeFileSync(input,JSON.stringify({operation:afterOwnerUpdate?'verify-credential-format':'inspect-credential-format'}));
  const r=mutation('invoke',['--function-name',fn,'--qualifier','$LATEST','--invocation-type','RequestResponse','--payload','fileb://'+input,output]);
  j.result=JSON.parse(readFileSync(output));j.invokeReceipt=r;save();
  if(r.FunctionError||r.ExecutedVersion!=='$LATEST'||typeof j.result.rawFormatValid!=='boolean')throw Error('Format diagnostic failed; restore owned code');
  if(afterOwnerUpdate&&(j.result.parameterVersion!==j.parameterVersion||j.result.verified!==true))throw Error('Corrected credential verification failed; restore owned code');
 }else if(mode==='restore'){
  if(!j.installed||j.restored||c.CodeSha256!==hash||c.RevisionId!==j.ready)throw Error('Refuse unowned restoration');
  j.restored=mutation('update-function-code',['--function-name',fn,'--revision-id',c.RevisionId,'--no-publish',
   '--s3-bucket','decisiontree-alpha-artifacts-771049112957-us-east-1',
   '--s3-key','releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip',
   '--s3-object-version','qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n']);save();
 }else if(mode==='verify'){
  if(!j.restored||c.CodeSha256!==original)throw Error('Restoration unconfirmed');
  j.verified={at:new Date().toISOString(),latestRestored:true,publicOff:true,masterOnUnchanged:true,generationCalls:0};save();
 }
}
console.log(JSON.stringify({operation:mode,passed:true,...(mode==='invoke'?{result:j.result}:{}),...(mode==='verify'?j.verified:{})}));
