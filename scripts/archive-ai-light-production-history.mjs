import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='.artifacts/ai-light-quota',receipt=root+'/production-history-receipt.json';
assert(!existsSync(receipt),'Reconcile existing archive receipt; never overwrite');
const j=JSON.parse(readFileSync(root+'/production-execution.json')),forecast=JSON.parse(readFileSync(root+'/forecasting-production.json'));
assert(j.bridgeActive&&forecast.promoted&&forecast.probePassed);
function aws(s,o,i,extra=[]){return JSON.parse(execFileSync('aws',[s,o,'--cli-input-json',JSON.stringify(i),...extra,'--region','us-east-1','--output','json','--no-cli-pager'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:16000000,env:{...process.env,AWS_MAX_ATTEMPTS:'1'}}));}
for(const[name,expected]of [['decisionnavigator-prod-api',j.activeAlias.FunctionVersion],['scenario-prod-api','1'],['forecasting-prod-api',forecast.active.FunctionVersion]])assert.equal(aws('lambda','get-alias',{FunctionName:name,Name:'live'}).FunctionVersion,expected);
const bucket='decisiontree-prod-artifacts-771049112957-us-east-1';assert.equal(aws('s3api','get-bucket-versioning',{Bucket:bucket}).Status,'Enabled');assert(Object.values(aws('s3api','get-public-access-block',{Bucket:bucket}).PublicAccessBlockConfiguration).every(x=>x===true));
const table='decisiontree-prod-data',rows=[];let last,pages=0;
do{
 assert(++pages<=100,'Stop oversized history scan');
 const r=aws('dynamodb','scan',{TableName:table,ConsistentRead:true,FilterExpression:'#sk=:state AND (begins_with(#pk,:budget) OR begins_with(#pk,:scenario) OR begins_with(#pk,:canary) OR begins_with(#pk,:pilot) OR #pk=:fore OR #pk=:verify)',ExpressionAttributeNames:{'#pk':'pk','#sk':'sk'},ExpressionAttributeValues:{':state':{S:'STATE'},':budget':{S:'NAVIGATOR#BUDGET#'},':scenario':{S:'NAVIGATOR#SCENARIO#REQUEST#'},':canary':{S:'NAVIGATOR#CANARY#'},':pilot':{S:'FORECASTING#PILOT#'},':fore':{S:'FORECASTING#PROD'},':verify':{S:'FORECASTING#PROD#VERIFY'}},...(last?{ExclusiveStartKey:last}:{})});
 rows.push(...r.Items);last=r.LastEvaluatedKey;
}while(last);
assert(rows.length>0);
function privateOnly(x){if(!x||typeof x!=='object')return;for(const[k,v]of Object.entries(x)){assert(!/password|cookie|secret|credential|api.?key|accessToken|refreshToken|email|narrative|workbook|prompt/i.test(k),'Unexpected nonhistorical content');if(k==='state'&&v?.S){try{privateOnly(JSON.parse(v.S));}catch(e){if(e.code==='ERR_ASSERTION')throw e;}}privateOnly(v);}}
rows.forEach(privateOnly);
const body=Buffer.from(JSON.stringify({environment:'production',capturedAt:new Date().toISOString(),purpose:'Historical snapshot; no active Navigator/Forecasting money dependency; Scenario v1 diagnostic compatibility retained',table,rows}));
const sha256=createHash('sha256').update(body).digest('hex'),path=root+'/private-history-production.json',key='releases/ai-light-history/20261125/'+sha256+'.json';writeFileSync(path,body);
writeFileSync(receipt,JSON.stringify({state:'pending',bucket,key,sha256,records:rows.length,bytes:body.length},null,2));
const put=aws('s3api','put-object',{Bucket:bucket,Key:key,IfNoneMatch:'*',ExpectedBucketOwner:'771049112957',ServerSideEncryption:'AES256',ContentType:'application/json',Metadata:{sha256,purpose:'historical-only'}},['--body',path]);
const head=aws('s3api','head-object',{Bucket:bucket,Key:key,ExpectedBucketOwner:'771049112957'});assert.equal(head.VersionId,put.VersionId);assert.equal(head.Metadata.sha256,sha256);
const result={state:'archived',environment:'production',bucket,key,version:put.VersionId,sha256,records:rows.length,bytes:body.length,applicationWrites:0,historyModified:false};writeFileSync(receipt,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
