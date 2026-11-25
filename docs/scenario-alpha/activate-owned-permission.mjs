import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {ownedPermissionRevision} from './permission-ownership.mjs';
import {runtimeConfigurationHash} from '../../scripts/navigator-canary-execution-guards.mjs';
const dir='.artifacts/scenario-alpha-admission',fn='decisionnavigator-alpha-api';
const j=JSON.parse(readFileSync(dir+'/journal.json')),r=JSON.parse(readFileSync(dir+'/permission-reconciliation.json'));
const revision=ownedPermissionRevision(r,j.before.alias,j.startedAt);
function aws(service,op,input){try{const s=execFileSync('aws',[service,op,'--cli-input-json',JSON.stringify(input),'--region','us-east-1','--output','json','--no-cli-pager'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,env:{...process.env,AWS_MAX_ATTEMPTS:'1'}});return s.trim()?JSON.parse(s):{};}catch{throw Error('AWS operation failed/uncertain; do not retry '+op);}}
const save=()=>writeFileSync(dir+'/journal.json',JSON.stringify(j,null,2));
assert(!j.pending);assert(!j.active);assert.equal(j.version,'4');assert(j.completed.cloudTrailEventId);
const live=aws('lambda','get-alias',{FunctionName:fn,Name:'live'});assert.deepEqual(live,r.current);
const policy=aws('lambda','get-policy',{FunctionName:fn,Qualifier:'live'});assert.equal(policy.RevisionId,revision);assert.deepEqual(JSON.parse(policy.Policy).Statement,r.policy.statements);
const retained=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'3'});assert.equal(retained.CodeSha256,j.before.latest.hash);
const candidate=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:j.version});assert.equal(candidate.CodeSha256,j.before.zipBase64Sha);assert.equal(runtimeConfigurationHash(candidate),j.before.latest.configurationHash);
for(const [name,before] of Object.entries(j.before.protected.aliases)){
 const a=aws('lambda','get-alias',{FunctionName:name,Name:'live'});assert.deepEqual({version:a.FunctionVersion,revision:a.RevisionId},before);
}
const master=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'suspended,revision'}).Item;assert.deepEqual(master,j.before.protected.master);
const route=aws('apigatewayv2','get-route',{ApiId:'8qmgd1ghdi',RouteId:r.resources.find(x=>x.LogicalResourceId==='ScenarioAdmissionRoute').PhysicalResourceId});
assert.equal(route.AuthorizationType,'AWS_IAM');assert.equal(route.Target,'integrations/5wsf6z0');assert.equal(route.RouteKey,'POST /internal/coaches/scenario/ai');
j.permissionRevision={from:j.before.alias.RevisionId,to:revision,cloudTrailEventId:r.events[0].id};j.pending='UpdateAlias';save();
j.active=aws('lambda','update-alias',{FunctionName:fn,Name:'live',FunctionVersion:j.version,RevisionId:revision});delete j.pending;save();
assert.equal(j.active.FunctionVersion,'4');console.log(JSON.stringify(j.active));
