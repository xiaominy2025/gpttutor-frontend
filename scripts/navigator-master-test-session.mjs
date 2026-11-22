// Approved Alpha-only master test. Authentication is entered by the owner, never automated.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,openSync,fsyncSync,closeSync,renameSync} from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {fromIni} from '@aws-sdk/credential-provider-ini';

const base='https://d6owpirihdsus.cloudfront.net',fn='decisionnavigator-alpha-api',arn='arn:aws:lambda:us-east-1:771049112957:function:'+fn;
const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5',usage='decisionprocess-alpha-usage';
const original='HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=';
const root=fileURLToPath(new URL('..',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;})(value));
const check=(condition,code)=>{if(!condition)throw Object.assign(Error(code),{safeCode:code});};
function aws(service,operation,input){
 try{const out=execFileSync('aws',[service,operation,'--cli-input-json',JSON.stringify(input),'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],
  {encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:5000000,timeout:15000,env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_RETRY_MODE:'standard'}});return out.trim()?JSON.parse(out):{};}
 catch{throw Object.assign(Error('AWS operation failed or uncertain'),{safeCode:'aws-'+service+'-'+operation});}
}
const get=(TableName,Key,ProjectionExpression,ExpressionAttributeNames)=>aws('dynamodb','get-item',{TableName,Key,ConsistentRead:true,ProjectionExpression,...(ExpressionAttributeNames?{ExpressionAttributeNames}:{})}).Item;
const master=()=>{const r=get(table,{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},'pk,sk,suspended,revision');check(typeof r?.suspended?.BOOL==='boolean'&&Number.isSafeInteger(Number(r?.revision?.N)),'invalid-master-state');return {suspended:r.suspended.BOOL,revision:Number(r.revision.N)};};
const alias=()=>aws('lambda','get-alias',{FunctionName:fn,Name:'live'});
const latest=()=>aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'$LATEST'});
function config(c){check(c.Role==='arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime'&&c.Handler==='index.handlerEntry'&&c.Runtime==='nodejs22.x'&&c.Timeout===29&&c.MemorySize===256&&
 JSON.stringify(Object.entries(c.Environment?.Variables??{}).sort())===JSON.stringify([['NAVIGATOR_ENABLED','false'],['STAGE','alpha']]),'navigator-config-drift');}
async function ready(expected){for(let i=0;i<10;i++){const c=latest();config(c);check(c.CodeSha256===expected,'navigator-code-drift');if(c.LastUpdateStatus==='Successful'&&c.State==='Active')return c;check(c.LastUpdateStatus!=='Failed','navigator-update-failed');await delay(1000);}throw Error('Navigator update not ready');}

export async function createMasterTestSession({accountEmail,processFixtureUrl}){
 check(!process.env.DEBUG&&!process.env.PWDEBUG&&!process.env.NODE_DEBUG,'debug-output-not-permitted');
 check(aws('sts','get-caller-identity',{}).Arn==='arn:aws:iam::771049112957:user/engentlabs-cli','operator-identity-drift');
 const user=aws('cognito-idp','admin-get-user',{UserPoolId:'us-east-1_CipTwwDZb',Username:accountEmail});
 const attr=n=>user.UserAttributes.find(a=>a.Name===n)?.Value,subject=attr('sub');
 const member=get(table,{pk:{S:'MEMBERS'},sk:{S:accountEmail}},'#m.#s,#m.#e,#m.#a,#m.#t',{'#m':'member','#s':'sub','#e':'enabled','#a':'aiEnabled','#t':'accountType'})?.member?.M;
 check(user.Enabled&&user.UserStatus==='CONFIRMED'&&attr('email_verified')==='true'&&member?.enabled?.BOOL&&member.sub?.S===subject&&member.aiEnabled?.BOOL!==false&&['student','advanced'].includes(member.accountType?.S),'designated-account-not-eligible');
 const {chemistryWorkbook}=await import(processFixtureUrl);
 const processBody=JSON.stringify({project:chemistryWorkbook(),stage:0,scope:'objectives',seen:[]});
 const processId=randomUUID(),processKey='REQUEST#'+hash(subject+'\0'+processId);
 const processUser='C#'+createHmac('sha256','engent-process-usage-v1').update(subject).digest('hex');
 const voiceBody=JSON.stringify({caption:'Shared master OFF acceptance.',speaker:'Mark'});
 const run='navigator-master-'+randomUUID(),dir=resolve(root,'.artifacts/'+run);mkdirSync(dir);
 const journal=dir+'/journal.json',j={run,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd:root}).trim(),createdAt:new Date().toISOString(),accountRole:member.accountType.S,guardVerified:false,forwardedSettings:[],settingsAcknowledgements:[],forwardedOffProbes:[],blocked:{project:0,paid:0,other:0},auth:{},events:[]};
 function save(){const f=openSync(journal+'.tmp','w');try{writeFileSync(f,JSON.stringify(j,null,2));fsyncSync(f);}finally{closeSync(f);}renameSync(journal+'.tmp',journal);}
 function note(event,details={}){j.events.push({event,at:new Date().toISOString(),...details});save();}
 let phase='authentication',settingPermit,probePermit=false,settingsCount=0,voiceCount=0,processCount=0,offOwned,offStartedAt,unresolvedUntil=0;
 let ownedCode=false,checkerHash,originalRevision,closed=false;
 const browser=await chromium.launch({channel:'chrome',headless:false});
 const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false,viewport:{width:1260,height:860}});
 context.setDefaultTimeout(8000);context.setDefaultNavigationTimeout(15000);
 await context.routeWebSocket(/.*/,socket=>socket.close());
 let adminPage,studentPage;
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
  if(url.origin===base&&path==='/__master_guard_probe__')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Protected Alpha test</title>'});
  let allow=false,category='other';
  if(url.origin===base&&/^\/api\/projects(?:\/|$)/.test(path))category='project';
  else if(url.origin===base&&['GET','HEAD'].includes(method))allow=true;
  else if(url.origin===base&&method==='POST'){
   if(path==='/api/platform/email/start'){
    try{allow=phase==='authentication'&&JSON.parse(req.postData()??'{}').email?.toLowerCase()===accountEmail.toLowerCase();}catch{}
   }else if(['/api/platform/email/finish','/api/platform/email/authorize','/api/shared/email/login','/api/shared/email/callback','/api/platform/email/return'].includes(path))allow=phase==='authentication';
   else if(['/api/admin/start','/api/admin/finish'].includes(path))allow=phase==='authentication'; // Never inspect password/MFA bodies.
   else if(path==='/api/admin/settings'){
    try{const body=JSON.parse(req.postData()??'{}');allow=typeof settingPermit==='boolean'&&req.frame().page()===adminPage&&
     Object.keys(body).sort().join(',')==='confirm,enabled,kind'&&body.kind==='AI'&&body.confirm===true&&body.enabled===settingPermit&&settingsCount<2;
     if(allow){settingPermit=undefined;settingsCount++;j.forwardedSettings.push({enabled:body.enabled,at:new Date().toISOString()});save();}
    }catch{}
   }else if(path==='/api/decision-playback/voice'){
    category='paid';allow=probePermit&&offOwned&&req.frame().page()===studentPage&&Date.now()-offStartedAt<20000&&voiceCount===0&&req.postData()===voiceBody&&req.headers()['x-workspace-user']===subject;
    if(allow){voiceCount++;j.forwardedOffProbes.push({coach:'Tree',at:new Date().toISOString()});save();}
   }else if(path==='/api/process/workbook/suggestions'){
    category='paid';allow=probePermit&&offOwned&&req.frame().page()===studentPage&&Date.now()-offStartedAt<20000&&processCount===0&&req.postData()===processBody&&req.headers()['x-process-request-id']===processId&&req.headers()['x-amz-content-sha256']===hash(processBody);
    if(allow){processCount++;j.forwardedOffProbes.push({coach:'Process',at:new Date().toISOString()});save();}
   }else if(/^\/api\/(coach|thinking-summary|problem-intent|tree-draft|decision-playback|platform\/navigator)(?:\/|$)/.test(path))category='paid';
  }
  if(!allow){j.blocked[category]++;save();return route.abort('blockedbyclient');}
  return route.continue();
 });
 context.on('response',response=>{const u=new URL(response.url());if(u.origin!==base)return;
  if(['/api/admin/finish','/api/platform/email/finish','/api/shared/email/callback'].includes(u.pathname)){j.auth[u.pathname]=response.status();save();}
 });
 const guardPage=await context.newPage();await guardPage.goto(base+'/__master_guard_probe__');
 for(const [method,path]of [['POST','/api/projects/probe'],['PUT','/api/projects/probe'],['DELETE','/api/projects/probe'],['POST','/api/decision-playback/voice'],['POST','/api/process/workbook/suggestions'],['POST','/api/platform/navigator'],['POST','/api/admin/settings']]){
  const blocked=await guardPage.evaluate(async({method,path})=>{try{await fetch(path,{method,headers:{'Content-Type':'application/json'},body:'{}'});return false;}catch{return true;}},{method,path});check(blocked,'browser-write-guard-failed');
 }
 await guardPage.close();j.guardVerified=true;note('guards-verified-before-app-navigation');
 studentPage=await context.newPage();await studentPage.goto(base+'/explore?entry=email');

 async function readSession(){return studentPage.evaluate(async()=>{const r=await fetch('/api/session');return {status:r.status,data:r.ok?await r.json():null};});}
 async function processStatus(){return studentPage.evaluate(async()=>{const r=await fetch('/api/process/workbook/status');const d=await r.json();return {status:r.status,access:d.access,aiEnabled:d.aiEnabled};});}
 async function status(){
  const session=await readSession();return {run,phase,guardVerified:j.guardVerified,studentPath:new URL(studentPage.url()).pathname,
   participatingStudent:session.status===200&&session.data?.userId===subject,role:session.data?.accountType??null,
   administratorReady:adminPage&&!adminPage.isClosed()?await adminPage.getByRole('button',{name:'Pause Paid AI',exact:true}).isVisible().catch(()=>false):false,
   blocked:j.blocked};
 }
 async function openAdmin(){const session=await readSession();check(session.status===200&&session.data?.userId===subject,'student-session-not-ready');
  const p=await processStatus();check(p.status===200&&p.access==='student'&&p.aiEnabled===true,'process-student-session-not-ready');j.studentBefore={treeAuthenticated:true,role:session.data.accountType,process:p};save();
  adminPage=await context.newPage();await adminPage.goto(base+'/admin/');await adminPage.bringToFront();return {administratorPageReady:true};}
 function snapshot(){
  const tree=get(table,{pk:{S:'AI#GLOBAL'},sk:{S:'STATE'}},'#s',{'#s':'state'});
  check(tree?.state?.M?.reserved?.N==='0','tree-not-drained');
  const count=key=>{const r=get(usage,{pk:{S:key}},'#n',{'#n':'count'});check(r?.count?.N==='0','process-not-drained');return 0;};
  const global=count('C#GLOBAL'),userCount=count(processUser);
  const nav=get(table,{pk:{S:'NAVIGATOR#BUDGET#'+new Date().toISOString().slice(0,7)},sk:{S:'STATE'}},'pk,sk,spent,reserved,version')??{};
  check(!nav.reserved||nav.reserved.N==='0','navigator-not-drained');
  const request=get(usage,{pk:{S:processKey}},'pk');check(!request,'process-request-already-exists');
  const month=get(usage,{pk:{S:'MONTH#'+new Date().toISOString().slice(0,7)}},'pk,charged')??{};
  const day=get(usage,{pk:{S:'DAY#'+new Date().toISOString().slice(0,10)}},'pk,charged')??{};
  return {treeStateSha256:hash(canonical(tree)),treeReserved:0,processGlobal:global,processUser:userCount,processRequestAbsent:true,
   processMonthSha256:hash(canonical(month)),processDaySha256:hash(canonical(day)),navigatorBudgetSha256:hash(canonical(nav))};
 }
 async function navInvoke(expected){
  const a=alias();check(a.FunctionVersion==='1'&&a.RevisionId==='9545575c-3a9c-4163-96cd-98f747a769e0','navigator-alias-drift');
  const c=latest();config(c);check(c.CodeSha256===checkerHash,'private-checker-drift');
  const host='lambda.us-east-1.amazonaws.com',path='/2015-03-31/functions/'+fn+'/invocations';
  const body=JSON.stringify({operation:'check-master-admission',expectedSuspended:expected.suspended,expectedRevision:expected.revision});
  const signer=new SignatureV4({service:'lambda',region:'us-east-1',credentials:fromIni({profile:'default'}),sha256:Sha256});
  const signed=await signer.sign(new HttpRequest({hostname:host,path,query:{Qualifier:'$LATEST'},method:'POST',headers:{host,'content-type':'application/json','x-amz-invocation-type':'RequestResponse'},body}));
  const r=await fetch('https://'+host+path+'?Qualifier=%24LATEST',{method:'POST',headers:signed.headers,body,redirect:'error',signal:AbortSignal.timeout(15000)});
  check(r.ok&&!r.headers.get('x-amz-function-error'),'navigator-invocation-failed');const result=await r.json();check(result.verified===true,'navigator-gate-mismatch');return result;
 }
 async function settings(){return adminPage.evaluate(async()=>{const r=await fetch('/api/admin/settings');const d=r.ok?await r.json():null;return {status:r.status,aiPaused:d?.aiPaused,registrationOpen:d?.registrationOpen,usage:d?.usage};});}
 function protectedConfiguration(){
  const result={};
  for(const [name,version,code,timeout]of [['decisiontree-alpha-staging-api','18','ZDHXdHAapn2CYQNtk3pIAKX1Gjr9+rB4JOwKwapac4Y=',28],['decisionprocess-alpha-api','6','07YyCjaVUpeMPc1drHsEI3PHFeIcOAUflwgwZwZVqc0=',80]]){
   const a=aws('lambda','get-alias',{FunctionName:name,Name:'live'}),c=aws('lambda','get-function-configuration',{FunctionName:name,Qualifier:'live'});
   check(a.FunctionVersion===version&&c.CodeSha256===code&&c.Timeout===timeout,'protected-coach-runtime-drift');
   result[name]={version,aliasRevision:a.RevisionId,configurationHash:hash(canonical(c))};
  }
  const platform=aws('lambda','get-alias',{FunctionName:'engent-platform-alpha-api',Name:'live'});check(platform.FunctionVersion==='5','platform-version-drift');
  result.platform={version:'5',aliasRevision:platform.RevisionId};
  return result;
 }
 async function toggle(enabled){
  check(adminPage&&!adminPage.isClosed(),'administrator-window-closed');settingPermit=enabled;
  const expected=(enabled?'Enable':'Pause')+' Paid AI?';
  adminPage.once('dialog',async dialog=>{if(dialog.type()==='confirm'&&dialog.message()===expected)await dialog.accept();else await dialog.dismiss();});
  const response=adminPage.waitForResponse(r=>new URL(r.url()).pathname==='/api/admin/settings'&&r.request().method()==='POST',{timeout:10000});
  await adminPage.getByRole('button',{name:(enabled?'Enable':'Pause')+' Paid AI',exact:true}).click();
  const r=await response;check(r.status()===200,'administrator-toggle-not-acknowledged');j.settingsAcknowledgements.push({enabled,status:200,at:new Date().toISOString()});save();
 }
 async function installChecker(){
  const a=alias();check(a.FunctionVersion==='1'&&a.RevisionId==='9545575c-3a9c-4163-96cd-98f747a769e0','navigator-alias-drift');
  const c=latest();config(c);check(c.CodeSha256===original&&c.LastUpdateStatus==='Successful','navigator-private-baseline-drift');originalRevision=c.RevisionId;
  execFileSync(process.execPath,['scripts/build-navigator-master-check.mjs'],{stdio:'pipe',cwd:root});
  const cjs=resolve(root,'.artifacts/navigator-master-check/index.cjs'),zip=dir+'/checker.zip';
  check(!/api\.openai\.com|\/openai-api-key|GetParameterCommand/.test(readFileSync(cjs,'utf8')),'checker-provider-path-present');
  execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Compress-Archive -LiteralPath '"+cjs.replaceAll("'","''")+"' -DestinationPath '"+zip.replaceAll("'","''")+"'"],{stdio:'pipe'});
  const bytes=readFileSync(zip);checkerHash=createHash('sha256').update(bytes).digest('base64');j.checker={sha256:hash(bytes),sha256Base64:checkerHash,originalRevision};save();
  ownedCode=true;
  try{execFileSync('aws',['lambda','update-function-code','--function-name',fn,'--revision-id',c.RevisionId,'--no-publish','--zip-file','fileb://'+zip,'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],{stdio:'pipe',env:{...process.env,AWS_MAX_ATTEMPTS:'1'}});}catch{throw Error('Private installation uncertain; read-only reconcile');}
  await ready(checkerHash);note('provider-free-private-checker-installed');
 }
 async function restoreChecker(){if(!ownedCode)return;const c=latest();config(c);if(c.CodeSha256===original){ownedCode=false;return;}check(c.CodeSha256===checkerHash&&c.LastUpdateStatus==='Successful','private-checker-ownership-lost');
  aws('lambda','update-function-code',{FunctionName:fn,RevisionId:c.RevisionId,Publish:false,S3Bucket:'decisiontree-alpha-artifacts-771049112957-us-east-1',
   S3Key:'releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip',S3ObjectVersion:'qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n'});
  const c2=await ready(original);j.privateRestored={revision:c2.RevisionId,hash:c2.CodeSha256};ownedCode=false;save();}
 async function runWindow(){
  check(phase==='authentication'&&j.guardVerified,'test-not-ready-or-already-run');
  const s=await readSession();check(s.status===200&&s.data?.userId===subject,'student-session-unavailable');
  const adm=await settings();check(adm.status===200&&adm.aiPaused===false,'administrator-not-ready');
  check(j.auth['/api/admin/finish']===200,'fresh-administrator-mfa-not-verified');
  const start=master();check(!start.suspended&&start.revision===9,'master-baseline-drift');
  j.before=snapshot();j.protectedBefore=protectedConfiguration();j.masterBefore=start;j.settingsBefore=adm;phase='preparing';save();
  let failure;
  try{
   await installChecker();check(JSON.stringify(master())===JSON.stringify(start),'master-changed-during-preparation');
   j.navigatorBefore=await navInvoke(start);j.processBefore=await processStatus();check(j.processBefore.aiEnabled===true,'process-not-on-before-window');
   check(JSON.stringify(snapshot())===JSON.stringify(j.before),'drain-or-spending-drift-before-window');
   phase='pause-authorized';offStartedAt=Date.now();j.pauseRequestedAt=new Date(offStartedAt).toISOString();save();
   await toggle(false);const off=master();check(off.suspended&&off.revision===start.revision+1,'off-revision-not-owned');offOwned=off;j.masterOff=off;phase='off-testing';probePermit=true;save();
   const dispatchedAt=Date.now();unresolvedUntil=dispatchedAt+90000;
   const calls=await Promise.allSettled([
    studentPage.evaluate(async({body,subject})=>{const r=await fetch('/api/decision-playback/voice',{method:'POST',headers:{'Content-Type':'application/json','X-Workspace-User':subject},body,signal:AbortSignal.timeout(25000)});return {status:r.status,body:await r.json()};},{body:voiceBody,subject}),
    studentPage.evaluate(async({body,id,sha256})=>{const r=await fetch('/api/process/workbook/suggestions',{method:'POST',headers:{'Content-Type':'application/json','x-process-request-id':id,'x-amz-content-sha256':sha256},body,signal:AbortSignal.timeout(25000)});return {status:r.status,body:await r.json()};},{body:processBody,id:processId,sha256:hash(processBody)}),
    navInvoke(off),processStatus()
   ]);
   probePermit=false;
   const complete=calls.every(x=>x.status==='fulfilled');if(complete)unresolvedUntil=0;
   j.offResults=calls.map((r,index)=>{const coach=['Tree','Process','Navigator','ProcessStatus'][index];if(r.status!=='fulfilled')return {coach,unknown:true};
    if(index<2)return {coach,status:r.value.status,expectedError:r.value.body?.error===(index===0?'AI access is temporarily unavailable.':'Paid AI is paused.')};
    if(index===2)return {coach,...r.value};return {coach,status:r.value.status,access:['student','guest','unavailable'].includes(r.value.access)?r.value.access:'unknown',aiEnabled:r.value.aiEnabled===true};});save();
   check(complete,'off-request-outcome-unknown');
   check(calls[0].value.status===503&&calls[0].value.body.error==='AI access is temporarily unavailable.','tree-off-denial-unexpected');
   check(calls[1].value.status===503&&calls[1].value.body.error==='Paid AI is paused.','process-off-denial-unexpected');
   check(calls[2].value.verified&&calls[2].value.providerStubCalls===0,'navigator-off-gate-unexpected');
   check(calls[3].value.access==='student'&&calls[3].value.aiEnabled===false,'process-off-status-unexpected');
   check(JSON.stringify(master())===JSON.stringify(off),'master-conflict-during-off');
   check(JSON.stringify(snapshot())===JSON.stringify(j.before),'spending-or-request-state-changed');
   j.offChecksPassed=true;save();
  }catch(error){failure=error.safeCode??'unexpected-or-ambiguous-test-outcome';j.failure=failure;save();}
  finally{
   probePermit=false;settingPermit=undefined;
   try{
    if(!offOwned&&j.settingsAcknowledgements.some(x=>x.enabled===false)){
     const reconciled=master();
     if(reconciled.suspended&&reconciled.revision===start.revision+1){offOwned=reconciled;j.reconciledOwnedOff=reconciled;save();}
     else check(!reconciled.suspended&&reconciled.revision===start.revision,'ambiguous-master-update-stop');
    }
    if(offOwned){
    // A timed-out Process invocation can live80s; hold OFF until its hard execution bound plus margin.
    if(unresolvedUntil>Date.now()){note('waiting-for-unknown-invocation-hard-bound');await delay(unresolvedUntil-Date.now());}
    const current=master();check(JSON.stringify(current)===JSON.stringify(offOwned),'off-ownership-lost-stop-no-override');
    phase='restore-authorized';await toggle(true);const restored=master();check(!restored.suspended&&restored.revision===offOwned.revision+1,'master-on-restoration-unconfirmed');
    j.masterRestored=restored;j.restoredAt=new Date().toISOString();j.offWindowMs=Date.now()-offStartedAt;offOwned=undefined;save();check(j.offWindowMs<=120000,'off-window-exceeded');
    if(!failure)j.navigatorAfter=await navInvoke(restored);
   }}finally{await restoreChecker();}
  }
  if(!failure){
   j.processAfter=await processStatus();check(j.processAfter.access==='student'&&j.processAfter.aiEnabled===true,'process-on-status-unexpected');
   j.settingsAfter=await settings();check(j.settingsAfter.status===200&&!j.settingsAfter.aiPaused&&j.settingsAfter.registrationOpen===adm.registrationOpen,'administrator-restored-settings-mismatch');
   j.after=snapshot();check(JSON.stringify(j.after)===JSON.stringify(j.before),'spending-or-request-state-drift');
   j.protectedAfter=protectedConfiguration();check(JSON.stringify(j.protectedAfter)===JSON.stringify(j.protectedBefore),'protected-configuration-changed');
  }
  phase=failure?'stopped':'complete';j.phase=phase;j.result=failure?'failed':'passed';save();return {run,result:j.result,masterRestored:j.masterRestored,offWindowMs:j.offWindowMs,paidCalls:0};
 }
 async function close(){check(!offOwned,'cannot-close-while-test-owns-off');await restoreChecker();await browser.close();closed=true;return {closed};}
 return {status,openAdmin,runWindow,close,journalPath:journal};
}
