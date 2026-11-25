import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {completedDeployment,deploymentWriteEvents,runtimeConfigurationHash} from '../../scripts/navigator-canary-execution-guards.mjs';
const root='.artifacts/scenario-alpha-admission',fn='decisionnavigator-alpha-api',arn='arn:aws:lambda:us-east-1:771049112957:function:'+fn;
const principal='arn:aws:iam::771049112957:user/engentlabs-cli';
const source='ff7931c7f2045deffdff545fce1376ba96d21d12',baselineHash='HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=';
const sha=b=>createHash('sha256').update(b).digest('hex');
function aws(service,op,input={},extra=[]){try{const s=execFileSync('aws',[service,op,'--cli-input-json',JSON.stringify(input),...extra,'--region','us-east-1','--output','json','--no-cli-pager'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:8000000,env:{...process.env,AWS_MAX_ATTEMPTS:'1'}});return s.trim()?JSON.parse(s):{};}catch{throw Error('AWS failed/uncertain: '+service+'/'+op+'; reconcile, do not retry writes.');}}
const latest=()=>aws('lambda','get-function-configuration',{FunctionName:fn});
const alias=()=>aws('lambda','get-alias',{FunctionName:fn,Name:'live'});
const save=j=>writeFileSync(root+'/journal.json',JSON.stringify(j,null,2));
function protectedState(){
 const m=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'suspended,revision'}).Item;
 assert.equal(m?.suspended?.BOOL,false);assert.equal(m?.revision?.N,'11');
 return {master:m,aliases:Object.fromEntries(['engent-platform-alpha-api','decisiontree-alpha-staging-api','decisionprocess-alpha-api','forecasting-alpha-api','decisionnavigator-prod-api','forecasting-prod-api','decisionprocess-prod-api','decisiontree-prod-api','engent-platform-prod-api'].map(name=>{
  const a=aws('lambda','get-alias',{FunctionName:name,Name:'live'});return [name,{version:a.FunctionVersion,revision:a.RevisionId}];
 }))};
}
function baseline(){
 assert.equal(aws('sts','get-caller-identity').Arn,principal);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source);
 assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
 const a=alias(),c=latest();assert.equal(a.FunctionVersion,'3');assert.deepEqual(a.RoutingConfig?.AdditionalVersionWeights??{},{});
 assert.equal(c.CodeSha256,baselineHash);assert.equal(c.Role,'arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime');
 assert.equal(c.State,'Active');assert.equal(c.LastUpdateStatus,'Successful');assert.equal(c.Handler,'index.handlerEntry');
 assert.equal(c.Runtime,'nodejs22.x');assert.equal(c.MemorySize,256);assert.equal(c.Timeout,29);
 assert.deepEqual(c.Environment.Variables,{NAVIGATOR_ENABLED:'true',STAGE:'alpha'});
 assert.equal(aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'3'}).CodeSha256,baselineHash);
 const integration=aws('apigatewayv2','get-integration',{ApiId:'8qmgd1ghdi',IntegrationId:'5wsf6z0'});
 assert.equal(integration.IntegrationUri,arn+':live');
 const routes=aws('apigatewayv2','get-routes',{ApiId:'8qmgd1ghdi'}).Items;
 assert(!routes.some(x=>x.RouteKey==='POST /internal/coaches/scenario/ai'));
 const template=readFileSync('infra/scenario-alpha/admission.template.json');
 const zip=readFileSync(root+'/adapter.zip');
 return {source,at:new Date().toISOString(),alias:a,latest:{revision:c.RevisionId,configurationHash:runtimeConfigurationHash(c),hash:c.CodeSha256},
  templateSha:sha(template),zipSha:sha(zip),zipBase64Sha:createHash('sha256').update(zip).digest('base64'),protected:protectedState()};
}
const mode=process.argv[2];
if(mode==='prepare'){
 assert(!existsSync(root+'/plan.json'));const p=baseline();writeFileSync(root+'/plan.json',JSON.stringify(p,null,2));console.log(JSON.stringify(p));
}else if(mode==='install-code'){
 assert(!existsSync(root+'/journal.json'));const p=JSON.parse(readFileSync(root+'/plan.json'));
 const current=baseline();assert.deepEqual(current.alias,p.alias);assert.deepEqual(current.latest,p.latest);assert.equal(current.zipSha,p.zipSha);assert.equal(current.templateSha,p.templateSha);assert.deepEqual(current.protected,p.protected);
 const j={source,pending:'UpdateFunctionCode',before:p,startedAt:Date.now()};save(j);
 const ack=aws('lambda','update-function-code',{FunctionName:fn,RevisionId:p.latest.revision,Publish:false},['--zip-file','fileb://'+root+'/adapter.zip']);
 j.acknowledgedRevision=ack.RevisionId;save(j);
 j.completed=await completedDeployment({acknowledgement:ack,priorRevision:p.latest.revision,expectedHash:p.zipBase64Sha,configurationHash:p.latest.configurationHash,
  functionArn:arn,principal,startedAt:j.startedAt,readConfiguration:async()=>latest(),
  readWriteEvents:async(start,end)=>deploymentWriteEvents(aws('cloudtrail','lookup-events',{LookupAttributes:[{AttributeKey:'ResourceName',AttributeValue:fn}],StartTime:new Date(start).toISOString(),EndTime:new Date(end).toISOString(),MaxResults:50}).Events,arn)
    .filter(x=>Date.parse(x.at)>=Math.floor(start/1000)*1000&&['UpdateFunctionCode20150331v2','UpdateFunctionConfiguration20150331v2'].includes(x.event)),sleep,pollMs:10000,timeoutMs:600000});
 j.pending='PublishVersion';save(j);
 const v=aws('lambda','publish-version',{FunctionName:fn,CodeSha256:p.zipBase64Sha,RevisionId:j.completed.readyRevision,Description:'Scenario Alpha private admission '+source});
 j.version=v.Version;delete j.pending;save(j);console.log(JSON.stringify({publishedVersion:j.version,aliasUnchanged:alias().FunctionVersion}));
}else if(mode==='activate'){
 const j=JSON.parse(readFileSync(root+'/journal.json')),p=j.before;assert(!j.pending);assert(j.version);
 assert.deepEqual(protectedState(),p.protected);assert.deepEqual(alias(),p.alias);
 const v=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:j.version});assert.equal(v.CodeSha256,p.zipBase64Sha);assert.equal(runtimeConfigurationHash(v),p.latest.configurationHash);
 const route=aws('apigatewayv2','get-routes',{ApiId:'8qmgd1ghdi'}).Items.find(x=>x.RouteKey==='POST /internal/coaches/scenario/ai');
 assert.equal(route.AuthorizationType,'AWS_IAM');assert.equal(route.Target,'integrations/5wsf6z0');
 j.pending='UpdateAlias';save(j);
 j.active=aws('lambda','update-alias',{FunctionName:fn,Name:'live',FunctionVersion:j.version,RevisionId:p.alias.RevisionId});delete j.pending;save(j);console.log(JSON.stringify(j.active));
}else throw Error('Expected prepare/install-code/activate');
