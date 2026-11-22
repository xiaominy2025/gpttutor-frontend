// Preparation is read-only AWS + local files. Execution requires a separate owner approval.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,fsyncSync,renameSync,existsSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {fromIni} from '@aws-sdk/credential-provider-ini';
import {createNavigatorCanaryOperator} from './navigator-paid-canary-operator.mjs';
import {assertOwnedPrivateRevision,observeTerminalLambdaResponse,completedDeployment,runtimeConfigurationHash,deploymentWriteEvents} from './navigator-canary-execution-guards.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),fn='decisionnavigator-alpha-api';
const original='HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=';
const aliasRevision='9545575c-3a9c-4163-96cd-98f747a769e0',originalRevision='0e61fca1-fde3-490f-8b58-e16f51c90f8b';
const functionArn='arn:aws:lambda:us-east-1:771049112957:function:'+fn;
const principal='arn:aws:iam::771049112957:user/engentlabs-cli';
const executionDirectory='.artifacts/navigator-paid-canary/alpha-reviewed-lifecycle-execution';
const stoppedJournal='.artifacts/navigator-paid-canary/alpha-initial-execution/execution-journal.json';
const stoppedJournalSha256='fd938f8134976794f62f71c236d755cbe155c19eadb6a15186bb3e9a4477960a';
const files=['scripts/execute-navigator-paid-canary.mjs','scripts/navigator-paid-canary-operator.mjs','scripts/navigator-canary-execution-guards.mjs','scripts/build-navigator-paid-canary.mjs',
 'server/platform/navigator-paid-canary.mjs','server/platform/navigator-paid-guard.mjs','server/platform/navigator-canary-journal.mjs',
 'server/platform/navigator-runtime.mjs','server/platform/navigator.mjs','server/platform/budget.mjs','server/platform/store.mjs','server/shared/paid-ai-master.mjs'];
const sha=value=>createHash('sha256').update(value).digest('hex');
const check=(condition,code)=>{if(!condition)throw Object.assign(Error(code),{safeCode:code});};
const args=process.argv.slice(2),prepare=args.length===1&&args[0]==='--prepare';
const execute=args.length===3&&args[0]==='--execute-owner-approved'&&/^[a-f0-9]{64}$/.test(args[2]);
check(prepare||execute,'Expected --prepare OR --execute-owner-approved <exact-plan-path> <plan-sha256>');
check(!process.env.DEBUG&&!process.env.PWDEBUG&&!process.env.NODE_DEBUG,'debug-output-not-permitted');
function aws(service,operation,input,extra=[]){
 try{const out=execFileSync('aws',[service,operation,'--cli-input-json',JSON.stringify(input),...extra,'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:6000000,timeout:20000,env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_RETRY_MODE:'standard'}});return out.trim()?JSON.parse(out):{};}
 catch{throw Object.assign(Error('AWS operation failed or uncertain; do not retry'),{safeCode:'aws-'+service+'-'+operation});}
}
const latest=()=>aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'$LATEST'});
function config(c){check(c.Role==='arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime'&&c.Runtime==='nodejs22.x'&&c.Handler==='index.handlerEntry'&&c.Timeout===29&&c.MemorySize===256&&
 JSON.stringify(Object.entries(c.Environment?.Variables??{}).sort())===JSON.stringify([['NAVIGATOR_ENABLED','false'],['STAGE','alpha']]),'navigator-config-drift');}
function baseline(){
 check(aws('sts','get-caller-identity',{}).Arn===principal,'operator-identity-drift');
 check(sha(readFileSync(resolve(root,stoppedJournal)))===stoppedJournalSha256&&
  !existsSync(resolve(root,'.artifacts/navigator-paid-canary/alpha-initial-execution/navigator-alpha-initial.ndjson')),'stopped-journal-drift');
 const a=aws('lambda','get-alias',{FunctionName:fn,Name:'live'});check(a.FunctionVersion==='1'&&a.RevisionId===aliasRevision&&!Object.keys(a.RoutingConfig?.AdditionalVersionWeights??{}).length,'public-off-alias-drift');
 const off=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'1'});config(off);check(off.CodeSha256===original,'immutable-off-code-drift');
 const c=latest();config(c);check(c.CodeSha256===original&&c.RevisionId===originalRevision&&c.LastUpdateStatus==='Successful'&&c.State==='Active','private-baseline-drift');
 const m=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'pk,sk,suspended,revision'}).Item;
 check(m?.suspended?.BOOL===false&&m.revision?.N==='11','restored-master-drift');
 const p=aws('ssm','describe-parameters',{ParameterFilters:[{Key:'Name',Option:'Equals',Values:['/decisionnavigator-alpha/openai-api-key']}]}).Parameters;
 check(p?.length===1&&p[0].Type==='SecureString'&&p[0].Tier==='Standard'&&p[0].Version===3,'credential-metadata-drift');
 const canary=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'NAVIGATOR#CANARY#ALPHA-INITIAL'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'pk,sk'});
 check(!canary.Item,'canary-already-attempted');
 return {masterRevision:11,aliasVersion:'1',aliasRevision:a.RevisionId,privateRevision:c.RevisionId,publicCodeSha256:original,credentialVersion:3,configurationHash:runtimeConfigurationHash(c)};
}
// Existing CloudTrail event history only; no logging/infrastructure changes. CLI
// pagination is completed before returning. Only allowlisted ownership fields survive.
function writeEvents(startedAt,endedAt){
 const events=aws('cloudtrail','lookup-events',{LookupAttributes:[{AttributeKey:'ReadOnly',AttributeValue:'false'}],
  StartTime:new Date(Math.floor(startedAt/1000)*1000).toISOString(),EndTime:new Date(endedAt).toISOString()}).Events;
 check(Array.isArray(events),'cloudtrail-result-unavailable');
 return deploymentWriteEvents(events,functionArn);
}
function completed(ack,priorRevision,hash,configurationHash,startedAt){
 return completedDeployment({acknowledgement:ack,priorRevision,expectedHash:hash,configurationHash,functionArn,principal,startedAt,
  readConfiguration:qualified=>aws('lambda','get-function-configuration',{FunctionName:fn,...(qualified?{Qualifier:'$LATEST'}:{})}),
  readWriteEvents:writeEvents,sleep:delay});
}
function localPath(path){const p=resolve(root,path);check(p.startsWith(resolve(root,'.artifacts')+'/')||p.startsWith(resolve(root,'.artifacts')+'\\'),'artifact-outside-workspace');return p;}
let planPath;
if(prepare){
 const b=baseline(),source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 check(execFileSync('git',['status','--porcelain','--',...files],{cwd:root,encoding:'utf8'}).trim()==='','source-files-not-committed');
 const run='navigator-paid-review-'+randomUUID(),folder=resolve(root,'.artifacts/'+run);mkdirSync(folder);
 const startsAt=Date.now(),manifest={source:'934f2fd837423c45d77082566ba5f55a50df4771',approval:run,startsAt,endsAt:startsAt+3600000};
 const manifestPath=folder+'/manifest.json';writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 execFileSync(process.execPath,['scripts/build-navigator-paid-canary.mjs','--manifest',manifestPath],{cwd:root,stdio:'pipe'});
 const cjs=resolve(root,'.artifacts/navigator-paid-canary/reviewed-manifest/index.cjs'),zip=folder+'/canary.zip';
 execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ProgressPreference='SilentlyContinue'; Compress-Archive -LiteralPath '"+cjs.replaceAll("'","''")+"' -DestinationPath '"+zip.replaceAll("'","''")+"'"],{stdio:'pipe'});
 const bytes=readFileSync(zip),plan={status:'PREPARED_FOR_REVIEW_NOT_AUTHORIZED',source,sourceBlobs:Object.fromEntries(files.map(file=>[file,execFileSync('git',['hash-object','--path='+file,file],{cwd:root,encoding:'utf8'}).trim()])),
  account:'771049112957',region:'us-east-1',function:fn,baseline:b,manifest,manifestSha256:sha(readFileSync(manifestPath)),artifact:{path:relative(root,zip).replaceAll('\\','/'),sha256:sha(bytes),sha256Base64:createHash('sha256').update(bytes).digest('base64'),bytes:bytes.length},
  lifecycleVersion:2,executionJournalDirectory:executionDirectory,
  preservedStoppedJournal:{path:stoppedJournal,sha256:stoppedJournalSha256},
  limits:{paidCalls:4,automaticRetries:0,incrementalCeilingMicros:30000,requestBytes:12000,outputTokens:1500,monthlyMicros:10000000,guestPerMinute:2,guestPerDay:5,ipPerDay:20,globalConcurrency:2,actorConcurrency:1},
  provider:{url:'https://api.openai.com/v1/responses',method:'POST',model:'gpt-6-luna',serviceTier:'default',store:false,inputUSDPerMillion:.125,outputUSDPerMillion:.5},
  directInvocations:5,bootstrapCalls:1,paidGenerationCallsMaximum:4,credentialParameter:'/decisionnavigator-alpha/openai-api-key',
  writeSet:['conditional Navigator $LATEST code install','one bootstrap and at most4 sequential direct private Lambda calls','reviewed NAVIGATOR# operational/budget/guard records only','conditional original-code restoration'],
  forbidden:['public alias/version/HTML publication','master toggle','IAM/Cognito/DNS/other coaches/Production changes','key output or mutation','retry/reset/refund on uncertainty'],
  restore:{bucket:'decisiontree-alpha-artifacts-771049112957-us-east-1',key:'releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip',version:'qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n',codeSha256:original},
  remainingRisk:'Provider authentication/model access and coaching quality are unproven; first approved paid call tests these. Abort without retry on denial, usage mismatch or uncertainty.'};
 planPath=folder+'/execution-plan.json';writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({prepared:true,executionAuthorized:false,planPath,planSha256:sha(readFileSync(planPath)),artifactSha256:plan.artifact.sha256,endsAt:new Date(manifest.endsAt).toISOString()}));
}else{
 planPath=resolve(args[1]);const bytes=readFileSync(planPath);check(sha(bytes)===args[2],'plan-sha256-mismatch');const p=JSON.parse(bytes);
 check(p.account==='771049112957'&&p.region==='us-east-1'&&p.function===fn&&p.baseline.masterRevision===11&&p.baseline.aliasRevision===aliasRevision&&p.baseline.privateRevision===originalRevision,'plan-target-drift');
 check(Date.now()>=p.manifest.startsAt&&Date.now()<p.manifest.endsAt,'reviewed-window-expired');
 for(const [file,blob]of Object.entries(p.sourceBlobs)){check(files.includes(file)&&execFileSync('git',['hash-object','--path='+file,file],{cwd:root,encoding:'utf8'}).trim()===blob,'reviewed-source-drift');}
 check(Object.keys(p.sourceBlobs).length===files.length,'source-pin-set-incomplete');
 const zip=localPath(p.artifact.path);check(sha(readFileSync(zip))===p.artifact.sha256,'artifact-sha256-mismatch');
 const currentBaseline=baseline();check(currentBaseline.configurationHash===p.baseline.configurationHash,'runtime-configuration-drift');
 check(p.lifecycleVersion===2&&p.executionJournalDirectory===executionDirectory&&
  p.preservedStoppedJournal?.path===stoppedJournal&&p.preservedStoppedJournal?.sha256===stoppedJournalSha256,'journal-path-drift');
 const folder=localPath(p.executionJournalDirectory);mkdirSync(folder,{recursive:true});const jp=folder+'/execution-journal.json';
 const fd=openSync(jp,'wx',0o600);closeSync(fd);const j={planSha256:args[2],artifactSha256:p.artifact.sha256,startedAt:new Date().toISOString(),events:[]};
 function save(){const f=openSync(jp+'.tmp','w');try{writeFileSync(f,JSON.stringify(j,null,2));fsyncSync(f);}finally{closeSync(f);}renameSync(jp+'.tmp',jp);}
 let owned=false,ownedRevision,lastInvokeStarted=0,lastInvokeUnknown=false;
 try{
  j.pending={operation:'install-private',revision:originalRevision,startedAt:Date.now()};save();
  const installed=aws('lambda','update-function-code',{FunctionName:fn,RevisionId:originalRevision,Publish:false},['--zip-file','fileb://'+zip]);
  j.installAcknowledgement={revision:installed.RevisionId,hash:installed.CodeSha256,status:installed.LastUpdateStatus};save();
  j.install=await completed(installed,originalRevision,p.artifact.sha256Base64,p.baseline.configurationHash,j.pending.startedAt);
  ownedRevision=j.install.readyRevision;owned=true;delete j.pending;save();
  const operator=createNavigatorCanaryOperator({directory:folder,manifest:p.manifest,artifactSha256:p.artifact.sha256,publicCodeSha256:original,
   latestRevision:ownedRevision,aliasRevision,masterRevision:11,credentialVersion:3,credentials:fromIni({profile:'default'}),
   observeResponse:async response=>{j.responses??=[];j.responses.push(response);save();},
   fetchOnce:async(url,options)=>{const invoke=new URL(url).pathname.endsWith('/invocations');
    if(invoke){lastInvokeStarted=Date.now();lastInvokeUnknown=true;j.lastInvocation={startedAt:new Date(lastInvokeStarted).toISOString(),outcome:'pending'};save();}
    const response=await fetch(url,options);
    if(!invoke)return response;
    return observeTerminalLambdaResponse(response,async()=>{lastInvokeUnknown=false;j.lastInvocation.outcome='terminal-lambda-payload-received';j.lastInvocation.http=response.status;save();});
   }});
  j.result=await operator.run();j.status='reconciled';save();
 }catch(error){j.status='stopped';j.failure=error.safeCode??'unknown-or-validation-failure';save();process.exitCode=1;}
 finally{
  if(lastInvokeUnknown){const remaining=lastInvokeStarted+65000-Date.now();if(remaining>0)await delay(remaining);}
  if(owned){const current=latest();config(current);assertOwnedPrivateRevision(current,p.artifact.sha256Base64,ownedRevision);
   check(runtimeConfigurationHash(current)===p.baseline.configurationHash,'pre-restore-configuration-drift');
   {if(j.pending){j.interruptedOperation=j.pending;delete j.pending;}j.pending={operation:'restore-private',revision:ownedRevision,startedAt:Date.now()};save();
    const r=aws('lambda','update-function-code',{FunctionName:fn,RevisionId:ownedRevision,Publish:false,S3Bucket:p.restore.bucket,S3Key:p.restore.key,S3ObjectVersion:p.restore.version});
    j.restoreAcknowledgement={revision:r.RevisionId,hash:r.CodeSha256,status:r.LastUpdateStatus};save();
    j.restoration=await completed(r,ownedRevision,original,p.baseline.configurationHash,j.pending.startedAt);delete j.pending;save();
   }
  }
  else if(j.pending?.operation==='install-private'){
   const observed=latest();j.requiresReadOnlyReconciliation=true;j.observedPrivate={hash:observed.CodeSha256,revision:observed.RevisionId,state:observed.State,update:observed.LastUpdateStatus};save();
  }
 }
 const restored=latest();config(restored);assertOwnedPrivateRevision(restored,original,j.restoration?.readyRevision);
 check(runtimeConfigurationHash(restored)===p.baseline.configurationHash,'restored-configuration-drift');
 check(restored.State==='Active'&&restored.LastUpdateStatus==='Successful','restored-code-not-ready');
 const finalAlias=aws('lambda','get-alias',{FunctionName:fn,Name:'live'});
 check(finalAlias.FunctionVersion==='1'&&finalAlias.RevisionId===aliasRevision&&!Object.keys(finalAlias.RoutingConfig?.AdditionalVersionWeights??{}).length,'public-alias-changed');
 const finalMaster=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'suspended,revision'}).Item;
 check(finalMaster?.suspended?.BOOL===false&&finalMaster.revision?.N==='11','master-changed-during-canary');
 j.restorationVerified={at:new Date().toISOString(),latestRevision:restored.RevisionId,privateCodeOriginal:true,publicOff:true,masterOnRevision:11};save();
 console.log(JSON.stringify({status:j.status,restorationVerified:true,planSha256:args[2]}));
}
