// Owner-approved, provider-free, one-window Navigator probe. No secret-bearing output.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,openSync,closeSync,fsyncSync,renameSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {resolve4} from 'node:dns/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {fromIni} from '@aws-sdk/credential-provider-ini';
import {chromium} from '@playwright/test';

const fn='decisionnavigator-alpha-api',arn='arn:aws:lambda:us-east-1:771049112957:function:'+fn;
const base='https://d6owpirihdsus.cloudfront.net',bootstrap='/api/platform/navigator/session';
const original='HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=';
const pin='00cec89c87ad695abf067f0c8bf240b33e745c94';
const run='navigator-browser-'+randomUUID(),dir=resolve('.artifacts/'+run);
const sha=value=>createHash('sha256').update(value).digest('hex');
const ensure=(condition,code)=>{if(!condition)throw Object.assign(Error(code),{safeCode:code});};
ensure(process.argv.slice(2).join(' ')==='--execute-approved-probe','explicit-execution-required');
ensure(!process.env.DEBUG&&!process.env.PWDEBUG,'debug-output-not-permitted');
mkdirSync(dir);const journal=dir+'/journal.json';
const j={run,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),probeSourcePin:pin,startedAt:new Date().toISOString(),events:[],providerRequests:0};
function save(){const fd=openSync(journal+'.tmp','w');try{writeFileSync(fd,JSON.stringify(j,null,2));fsyncSync(fd);}finally{closeSync(fd);}renameSync(journal+'.tmp',journal);}
function note(event,data={}){j.events.push({event,at:new Date().toISOString(),...data});save();console.log(JSON.stringify({event,...data}));}
function preservePendingForRestore(){if(j.pending){j.interruptedOperations??=[];j.interruptedOperations.push({...j.pending,action:'stop-without-retry; restore-owned-state-only'});delete j.pending;save();}}
function aws(service,operation,input={}){
 try{return JSON.parse(execFileSync('aws',[service,operation,'--cli-input-json',JSON.stringify(input),'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:8000000,env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_RETRY_MODE:'standard'}}));}
 catch(error){const code=String(error.stderr??'').match(/\(([A-Za-z0-9_.-]+)\) when calling/)?.[1]??'uncertain';
  throw Object.assign(Error('AWS operation failed'),{safeCode:'aws-'+service+'-'+operation+'-'+code});}
}
function mutate(operation,input,extra=[]){
 ensure(input.FunctionName===fn&&['update-function-code','publish-version','update-alias'].includes(operation),'mutation-scope');
 ensure(!j.pending,'pending-operation-needs-reconciliation');
 j.pending={operation,at:new Date().toISOString()};save();
 let result;
 if(extra.length){
  try{result=JSON.parse(execFileSync('aws',['lambda',operation,'--cli-input-json',JSON.stringify(input),...extra,'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],
   {encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:8000000,env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_RETRY_MODE:'standard'}}));}
  catch{throw Object.assign(Error('Code install failed or uncertain'),{safeCode:'code-install-uncertain'});}
 }else result=aws('lambda',operation,input);
 delete j.pending;save();return result;
}
const alias=()=>aws('lambda','get-alias',{FunctionName:fn,Name:'live'});
const latest=()=>aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'$LATEST'});
function configuration(c){
 ensure(c.Role==='arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime'&&c.Handler==='index.handlerEntry'&&c.Runtime==='nodejs22.x'&&c.Timeout===29&&c.MemorySize===256&&
  JSON.stringify(Object.entries(c.Environment?.Variables??{}).sort())===JSON.stringify([['NAVIGATOR_ENABLED','false'],['STAGE','alpha']]),'navigator-configuration-drift');
}
async function ready(expected){
 for(let n=0;n<10;n++){
  const c=latest();configuration(c);ensure(c.CodeSha256===expected,'latest-code-drift');
  if(c.LastUpdateStatus==='Successful'&&c.State==='Active')return c;
  ensure(c.LastUpdateStatus!=='Failed','code-update-failed');await delay(1000);
 }
 throw Object.assign(Error('Code update not ready'),{safeCode:'code-update-not-ready'});
}
function protectedState(){
 const identity=aws('sts','get-caller-identity');ensure(identity.Arn==='arn:aws:iam::771049112957:user/engentlabs-cli','identity-drift');
 const baseline=JSON.parse(readFileSync('.artifacts/ui-publication-20261121/manifest.json'));
 const edge=aws('cloudfront','get-distribution-config',{Id:'E1C4AJI9FUE47B'});
 ensure(JSON.stringify(edge)===JSON.stringify(baseline.edge),'cloudfront-drift');
 ensure(edge.DistributionConfig?.Logging?.Enabled!==true,'unexpected-cloudfront-access-logging');
 const stage=aws('apigatewayv2','get-stage',{ApiId:'8qmgd1ghdi',StageName:'$default'});
 ensure(!stage.AccessLogSettings?.DestinationArn,'unexpected-api-access-logging');
 const aliases={};
 for(const [name,version]of Object.entries({'engent-platform-alpha-api':'5','decisiontree-alpha-staging-api':'18','decisionprocess-alpha-api':'6'})){
  const a=aws('lambda','get-alias',{FunctionName:name,Name:'live'});ensure(a.FunctionVersion===version,'protected-alias-drift');aliases[name]={version,revision:a.RevisionId};
 }
 const receipt=JSON.parse(readFileSync('docs/ui-refinement-20261121/hosted/release-receipt.json'));
 const html=[];for(const h of receipt.html){const r=aws('s3api','head-object',{Bucket:receipt.bucket,Key:h.key,ExpectedBucketOwner:'771049112957'});
  ensure(r.VersionId===h.version&&r.ETag===h.etag,'protected-html-drift');html.push({key:h.key,version:r.VersionId,etag:r.ETag});}
 const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5';
 const master=aws('dynamodb','get-item',{TableName:table,Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'pk,sk,suspended,revision'});
 ensure(master.Item?.suspended?.BOOL===false&&master.Item?.revision?.N==='9','master-drift');
 const budget=aws('dynamodb','get-item',{TableName:table,Key:{pk:{S:'NAVIGATOR#BUDGET#'+new Date().toISOString().slice(0,7)},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'pk,sk,spent,reserved,version'});
 const integration=aws('apigatewayv2','get-integration',{ApiId:'8qmgd1ghdi',IntegrationId:'5wsf6z0'});
 ensure(integration.IntegrationUri===arn+':live','integration-drift');
 return {edgeSha256:sha(JSON.stringify(edge)),stageSha256:sha(JSON.stringify(stage)),aliases,html,master,budget,integrationSha256:sha(JSON.stringify(integration))};
}
async function prepare(expectedIp){
 ensure(!j.pending,'pending-operation-needs-reconciliation');j.pending={operation:'prepare-once',at:new Date().toISOString()};save();
 const signer=new SignatureV4({service:'lambda',region:'us-east-1',credentials:fromIni({profile:'default'}),sha256:Sha256});
 const host='lambda.us-east-1.amazonaws.com',path='/2015-03-31/functions/'+fn+'/invocations';
 const body=JSON.stringify({operation:'prepare',network:'a',expectedIp});
 const signed=await signer.sign(new HttpRequest({hostname:host,method:'POST',path,query:{Qualifier:'$LATEST'},headers:{host,'content-type':'application/json','x-amz-invocation-type':'RequestResponse'},body}));
 const response=await fetch('https://'+host+path+'?Qualifier=%24LATEST',{method:'POST',headers:signed.headers,body,redirect:'error',signal:AbortSignal.timeout(25000)});
 ensure(response.ok&&!response.headers.get('x-amz-function-error')&&response.headers.get('x-amz-executed-version')==='$LATEST','prepare-invocation-failed');
 const result=await response.json();ensure(result.prepared===true&&result.network==='a'&&/^[A-Za-z0-9_-]{43}$/.test(result.token??''),'prepare-result-invalid');
 delete j.pending;save();return result.token;
}

let browser,context,page,baselineAlias,probeHash,ownedPrivate=false,publicStarted=false,token,expectedIp;
let failed;
try{
 for(const path of ['server/platform/navigator-browser-probe.mjs','scripts/build-navigator-browser-probe.mjs','scripts/test-navigator-confined-browser.mjs']){
  ensure(execFileSync('git',['hash-object','--path='+path,path],{encoding:'utf8'}).trim()===execFileSync('git',['rev-parse',pin+':'+path],{encoding:'utf8'}).trim(),'reviewed-probe-source-drift');
 }
 j.before=protectedState();baselineAlias=alias();
 ensure(baselineAlias.FunctionVersion==='1'&&baselineAlias.RevisionId==='40267485-ed37-4a71-adbc-4a6c36ebb483'&&!Object.keys(baselineAlias.RoutingConfig?.AdditionalVersionWeights??{}).length,'off-alias-drift');
 j.aliasBefore=baselineAlias;const c=latest();configuration(c);ensure(c.CodeSha256===original&&c.LastUpdateStatus==='Successful','initial-private-code-drift');
 const v1=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'1'});configuration(v1);ensure(v1.CodeSha256===original,'off-version-code-drift');
 for(const [action,resources]of [['lambda:PublishVersion',[arn]],['lambda:UpdateAlias',[arn,arn+':live']]]){
  const r=aws('iam','simulate-principal-policy',{PolicySourceArn:'arn:aws:iam::771049112957:user/engentlabs-cli',ActionNames:[action],ResourceArns:resources});
  ensure(r.EvaluationResults?.some(x=>x.EvalDecision==='allowed'),'operator-permission-not-confirmed');
 }
 const cf=(await resolve4('d6owpirihdsus.cloudfront.net'))[0],check=(await resolve4('checkip.amazonaws.com'))[0];
 browser=await chromium.launch({headless:true,args:['--no-proxy-server','--disable-quic','--host-resolver-rules=MAP d6owpirihdsus.cloudfront.net '+cf+', MAP checkip.amazonaws.com '+check]});
 context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  const allowed=req.method()==='GET'&&[base,'https://checkip.amazonaws.com'].includes(url.origin)||
   req.method()==='POST'&&url.origin===base&&url.pathname===bootstrap&&token&&req.headers()['x-engent-navigator-probe']===token;
  await(allowed?route.continue():route.abort('blockedbyclient'));
 });
 page=await context.newPage();await page.goto('https://checkip.amazonaws.com/',{waitUntil:'domcontentloaded',timeout:15000});
 expectedIp=(await page.textContent('body')).trim();ensure(/^(?:\d{1,3}\.){3}\d{1,3}$/.test(expectedIp),'controlled-ipv4-unavailable');
 await page.goto(base+'/explore',{waitUntil:'domcontentloaded',timeout:15000});
 note('preflight-passed',{controlledNetworks:1,proxyDisabled:true,ipv4Pinned:true});
 const startsAt=Date.now(),manifest={run,startsAt,endsAt:startsAt+300000};ensure(manifest.endsAt-manifest.startsAt<=300000,'manifest-window');
 writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2),{flag:'wx'});j.manifest=manifest;j.manifestSha256=sha(readFileSync(dir+'/manifest.json'));
 execFileSync(process.execPath,['scripts/build-navigator-browser-probe.mjs','--manifest',dir+'/manifest.json'],{stdio:'pipe'});
 const cjs=resolve('.artifacts/navigator-browser-probe/reviewed-manifest/index.cjs'),zip=dir+'/probe.zip';
 ensure(!/api\.openai\.com|\/openai-api-key/.test(readFileSync(cjs,'utf8')),'provider-path-present');
 execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Compress-Archive -LiteralPath '"+cjs.replaceAll("'","''")+"' -DestinationPath '"+zip.replaceAll("'","''")+"'"],{stdio:'pipe'});
 const bytes=readFileSync(zip);probeHash=createHash('sha256').update(bytes).digest('base64');j.zipSha256=sha(bytes);j.zipSha256Base64=probeHash;save();
 note('manifest-frozen',{manifestSha256:j.manifestSha256,zipSha256:j.zipSha256,endsAt:new Date(manifest.endsAt).toISOString()});
 ensure(Date.now()<manifest.endsAt-90000,'insufficient-probe-window');
 const beforeInstall=latest();ensure(beforeInstall.RevisionId===c.RevisionId&&beforeInstall.CodeSha256===original,'private-state-drift-before-install');
 // Ownership is reconciled by code hash if an acknowledgement is lost.
 ownedPrivate=true;
 mutate('update-function-code',{FunctionName:fn,RevisionId:c.RevisionId,Publish:false},['--zip-file','fileb://'+zip]);
 const installed=await ready(probeHash);note('private-probe-installed');
 token=await prepare(expectedIp);note('one-use-challenge-prepared');
 const published=mutate('publish-version',{FunctionName:fn,CodeSha256:probeHash,RevisionId:installed.RevisionId,Description:run});
 ensure(/^\d+$/.test(published.Version)&&published.Version!=='1'&&published.CodeSha256===probeHash,'published-version-mismatch');j.probeVersion=published.Version;save();
 ensure(JSON.stringify(alias())===JSON.stringify(baselineAlias),'alias-drift-before-transition');
 ensure(Date.now()<manifest.endsAt-60000,'insufficient-public-window');
 publicStarted=true;
 const changed=mutate('update-alias',{FunctionName:fn,Name:'live',FunctionVersion:published.Version,RevisionId:baselineAlias.RevisionId,Description:run});
 ensure(changed.FunctionVersion===published.Version,'alias-transition-mismatch');j.activeAliasRevision=changed.RevisionId;j.aliasActivatedAt=new Date().toISOString();save();
 note('probe-alias-active',{version:published.Version});
 const post=action=>page.evaluate(async({token,path,action})=>{
  const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','x-engent-navigator-probe':token},body:JSON.stringify({network:'a',action})});
  return {status:response.status,body:await response.json()};
 },{token,path:bootstrap,action});
 const boot=await post('bootstrap');j.bootstrap={status:boot.status,...(boot.status===200?{sourceIpMatchesExpectedViewer:boot.body.sourceIpMatchesExpectedViewer,requestId:boot.body.requestId}:{})};save();
 ensure(boot.status===200&&boot.body.providerTransport==='absent','browser-bootstrap-failed');
 const cookies=(await context.cookies(base)).filter(x=>x.name==='__Host-engent-navigator');
 const cookie=cookies[0];ensure(cookies.length===1&&cookie.secure&&cookie.httpOnly&&cookie.sameSite==='Strict'&&cookie.path==='/'&&cookie.domain==='d6owpirihdsus.cloudfront.net','browser-cookie-flags-failed');
 ensure(!await page.evaluate(()=>document.cookie.split(';').some(v=>v.trim().startsWith('__Host-engent-navigator='))),'cookie-exposed-to-javascript');
 const verified=await post('verify');ensure(verified.status===200&&verified.body.providerTransport==='absent','browser-cookie-return-failed');
 j.browser={cookieAccepted:verified.body.cookieAccepted===true,secure:true,httpOnly:true,sameSite:'Strict',hostOnly:true,path:'/',javascriptCannotRead:true,
  sourceIpMatchesExpectedViewer:boot.body.sourceIpMatchesExpectedViewer===true&&verified.body.sourceIpMatchesExpectedViewer===true,requestId:verified.body.requestId,networksUsed:1};save();
 // One completed two-request pair only. No second network/retry after mismatch.
 ensure(j.browser.cookieAccepted,'browser-cookie-validation-failed');
 if(!j.browser.sourceIpMatchesExpectedViewer)failed='viewer-ip-mismatch';
 note('browser-pair-completed',j.browser);
}catch(error){failed=error.safeCode??'unexpected-or-ambiguous-outcome';j.failure=failed;save();}
finally{
 // Restore public routing first, even after a failed or uncertain request.
 if(publicStarted){try{
  const current=alias();
  if(current.FunctionVersion==='1')j.aliasAlreadyOff=true;
  else{
   ensure(current.FunctionVersion===j.probeVersion&&current.Description===run&&!Object.keys(current.RoutingConfig?.AdditionalVersionWeights??{}).length,'alias-ownership-lost');
   // An uncertain update is reconciled by the exact owned version/description/current revision.
   preservePendingForRestore();
   const restored=mutate('update-alias',{FunctionName:fn,Name:'live',FunctionVersion:'1',RevisionId:current.RevisionId,Description:baselineAlias.Description??''});
   ensure(restored.FunctionVersion==='1','off-alias-restore-failed');j.aliasRestored={at:new Date().toISOString(),revision:restored.RevisionId,version:'1'};save();
  }
  note('public-alias-restored-off',{version:'1'});
 }catch(error){j.aliasRestoreFailure=error.safeCode??'ambiguous-alias-restoration';failed??=j.aliasRestoreFailure;save();}}
 if(ownedPrivate){try{
  const current=latest();configuration(current);
  if(current.CodeSha256===original)j.privateAlreadyOriginal=true;
  else{
   ensure(current.CodeSha256===probeHash&&current.LastUpdateStatus==='Successful','private-code-ownership-lost');
   preservePendingForRestore();
   mutate('update-function-code',{FunctionName:fn,RevisionId:current.RevisionId,Publish:false,S3Bucket:'decisiontree-alpha-artifacts-771049112957-us-east-1',
    S3Key:'releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip',S3ObjectVersion:'qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n'});
   const restored=await ready(original);j.privateRestored={revision:restored.RevisionId,codeSha256:restored.CodeSha256};save();
  }
  note('private-code-restored');
 }catch(error){j.privateRestoreFailure=error.safeCode??'ambiguous-private-restoration';failed??=j.privateRestoreFailure;save();}}
 if(context){try{await context.clearCookies();await context.close();}catch{failed??='browser-cleanup-failed';}}
 if(browser){try{await browser.close();}catch{failed??='browser-close-failed';}}
 token=undefined;expectedIp=undefined;
}
try{
 const a=alias();ensure(a.FunctionVersion==='1'&&!Object.keys(a.RoutingConfig?.AdditionalVersionWeights??{}).length,'final-alias-not-off');
 const c=latest();configuration(c);ensure(c.CodeSha256===original&&c.LastUpdateStatus==='Successful','final-private-code-not-restored');
 j.after=protectedState();ensure(JSON.stringify(j.after)===JSON.stringify(j.before),'protected-state-changed');
 const off=await fetch(base+bootstrap,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}',redirect:'error',signal:AbortSignal.timeout(10000)});
 ensure(off.status===503&&!off.headers.get('set-cookie'),'public-off-smoke-failed');
 j.restorationVerified={at:new Date().toISOString(),navigatorOff:true,originalPrivateCode:true,protectedStateUnchanged:true,masterOn:true,canonicalBudgetUnchanged:true,publicStatus:off.status};
 j.result=failed?'failed':'passed';if(failed)j.failure=failed;save();note('completed',{result:j.result,failure:failed??null,restorationVerified:true,run});
}catch(error){j.finalVerificationFailure=error.safeCode??'ambiguous-final-verification';j.result='failed';save();note('final-verification-failed',{code:j.finalVerificationFailure,run});}
if(j.result!=='passed')process.exitCode=1;
