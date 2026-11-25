import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url)),fn='decisionnavigator-alpha-api',j=JSON.parse(readFileSync(dir+'/installed-journal.json'));
function aws(service,op,input){try{const s=execFileSync('aws',[service,op,'--cli-input-json',JSON.stringify(input),'--region','us-east-1','--output','json','--no-cli-pager'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,env:{...process.env,AWS_MAX_ATTEMPTS:'1'}});return s.trim()?JSON.parse(s):{};}catch{throw Error('AWS operation failed/uncertain; reconcile without retry');}}
assert(!j.pending);assert(j.active);assert.equal(j.version,'4');
const current=aws('lambda','get-alias',{FunctionName:fn,Name:'live'});assert.deepEqual(current,j.active);
const rollback=aws('lambda','get-function-configuration',{FunctionName:fn,Qualifier:'3'});assert.equal(rollback.CodeSha256,j.before.latest.hash);assert.equal(rollback.State,'Active');
const before=j.before.protected.aliases,observed={};
// Other Coaches are independently deployable. Inventory them without making
// unrelated future releases a reason to block this alias-only rollback.
for(const name of Object.keys(before)){const a=aws('lambda','get-alias',{FunctionName:name,Name:'live'});observed[name]={version:a.FunctionVersion,revision:a.RevisionId};}
const master=aws('dynamodb','get-item',{TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',Key:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'}},ConsistentRead:true,ProjectionExpression:'suspended,revision'}).Item;
// Scenario owner must stop dispatch before removing its admission dependency.
// OFF1 may have a newer CAS revision after a legitimate independent rollback.
const scenario=aws('lambda','get-alias',{FunctionName:'scenario-alpha-api',Name:'live'});assert.equal(scenario.FunctionVersion,'1');
const checked={at:new Date().toISOString(),passed:true,readOnly:true,current,rollback:{version:'3',codeSha256:rollback.CodeSha256},master,protectedAliases:observed,scenarioOff:{version:scenario.FunctionVersion,revision:scenario.RevisionId}};
writeFileSync(dir+'/rollback-check.json',JSON.stringify(checked,null,2));
const args=process.argv.slice(2);assert(args.length===0||(args.length===1&&['--check','--execute'].includes(args[0])));
if(args[0]==='--execute'){
 assert(!j.rollback);j.pending='RollbackAlias';writeFileSync(dir+'/installed-journal.json',JSON.stringify(j,null,2));
 j.rollback=aws('lambda','update-alias',{FunctionName:fn,Name:'live',FunctionVersion:'3',RevisionId:current.RevisionId});delete j.pending;writeFileSync(dir+'/installed-journal.json',JSON.stringify(j,null,2));
 console.log(JSON.stringify({restoredVersion:j.rollback.FunctionVersion,revision:j.rollback.RevisionId}));
}else console.log(JSON.stringify({rollbackCheck:'passed',writes:0,masterOn:master?.suspended?.BOOL===false,scenarioOff:true,protectedAliasesUnchanged:JSON.stringify(observed)===JSON.stringify(before)}));
