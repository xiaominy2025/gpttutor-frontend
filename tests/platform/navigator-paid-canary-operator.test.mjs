import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach,expect,it,vi} from 'vitest';
import {createNavigatorCanaryOperator} from '../../scripts/navigator-paid-canary-operator.mjs';
import {canarySource} from '../../server/platform/navigator-paid-guard.mjs';

const epoch=Date.UTC(2026,10,21,12);
const manifest={source:canarySource,approval:'operator-fixture-only',startsAt:epoch,endsAt:epoch+3600000};
const artifactSha256='a'.repeat(64),publicCodeSha256=Buffer.from('b'.repeat(64),'hex').toString('base64');
const latestRevision='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',aliasRevision='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const target='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api';
const role='arn:aws:iam::771049112957:role/decisionnavigator-alpha-runtime';
const alias={AliasArn:target+':live',FunctionVersion:'1',RevisionId:aliasRevision};
const cookie='__Host-engent-navigator='+'a'.repeat(43)+'.'+'1'.repeat(10)+'.'+'n'.repeat(43);
const continuation='1'.repeat(13)+'.'+'a'.repeat(24)+'.'+'b'.repeat(64);
const privateReply='do not serialize conversation to operator evidence';
const receipt=step=>String(step).repeat(43);
const dirs=[];
afterEach(()=>{for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true});});
function config(version){
 return {Version:version,FunctionArn:target+':'+version,Role:role,Runtime:'nodejs22.x',Handler:'index.handlerEntry',
  Timeout:29,State:'Active',LastUpdateStatus:'Successful',RevisionId:latestRevision,
  CodeSha256:version==='1'?publicCodeSha256:Buffer.from(artifactSha256,'hex').toString('base64'),
  Environment:{Variables:{STAGE:'alpha',NAVIGATOR_ENABLED:'false'}}};
}
function http(value,{status=200,headers={}}={}){
 return {status,headers:new Map(Object.entries(headers)),json:async()=>value};
}
function fixture({drift,failInvokeAt,finalBalance=112}={}){
 const directory=mkdtempSync(join(tmpdir(),'navigator-operator-'));
 dirs.push(directory);
 let monotonic=0,turns=0;
 const sent=[],reads=[];
 const sleep=vi.fn(async ms=>{monotonic+=ms;});
 const fetchOnce=vi.fn(async(url,options)=>{
  const address=new URL(url),path=address.pathname;
  expect(options.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
  expect(options.redirect).toBe('error');
  expect(options.signal.aborted).toBe(false);
  if(address.hostname==='ssm.us-east-1.amazonaws.com'){
   expect(options.headers['x-amz-target']).toBe('AmazonSSM.DescribeParameters');
   expect(JSON.parse(options.body)).toEqual({ParameterFilters:[{Key:'Name',Option:'Equals',Values:['/decisionnavigator-alpha/openai-api-key']}]});
   return http({Parameters:[{Name:'/decisionnavigator-alpha/openai-api-key',Type:'SecureString',Tier:'Standard',Version:drift==='credential'?4:3}]});
  }
  if(address.hostname==='dynamodb.us-east-1.amazonaws.com'){
   const body=JSON.parse(options.body);
   expect(options.headers['x-amz-target']).toBe('DynamoDB_20120810.GetItem');
   expect(body.ConsistentRead).toBe(true);
   const key=body.Key.pk.S;
   reads.push(key);
   if(key==='AI#CONFIG')return http({Item:{pk:{S:'AI#CONFIG'},sk:{S:'STATE'},suspended:{BOOL:drift==='off'},
    revision:{N:drift==='master'?'12':'11'}}});
   if(key==='NAVIGATOR#CANARY#ALPHA-INITIAL')return http(turns===4?{Item:{phase:{S:'complete'},spent:{N:'112'},hold:{N:'0'},nextStep:{N:'5'}}}:{});
   expect(key).toBe('NAVIGATOR#BUDGET#2026-11');
   return http(turns===4?{Item:{spent:{N:String(finalBalance)},reserved:{N:'0'}}}:{});
  }
  expect(address.hostname).toBe('lambda.us-east-1.amazonaws.com');
  expect(decodeURI(path)).toContain(target);
  if(path.endsWith('/aliases/live'))return http(drift==='alias'?{...alias,RoutingConfig:{AdditionalVersionWeights:{2:.01}}}:alias);
  if(path.endsWith('/configuration')){
   const configResult=config(address.searchParams.get('Qualifier'));
   if(drift==='code'&&configResult.Version==='$LATEST')configResult.CodeSha256=publicCodeSha256;
   if(drift==='public'&&configResult.Version==='1')configResult.Environment.Variables.NAVIGATOR_ENABLED='true';
   if(drift==='revision'&&configResult.Version==='$LATEST')configResult.RevisionId=aliasRevision;
   return http(configResult);
  }
  expect(address.searchParams.get('Qualifier')).toBe('$LATEST');
  expect(options.headers['x-amz-invocation-type']).toBe('RequestResponse');
  expect(options.headers['x-amz-log-type']).toBe('None');
  const event=JSON.parse(options.body);
  expect(readFileSync(operator.filename,'utf8').trim().split('\n').map(JSON.parse).at(-1)).toEqual({event:'pending',step:event.step});
  sent.push(event);
  if(event.step===failInvokeAt)throw Error('network failure with a private payload');
  if(event.step===0)return http({status:200,cookie},{headers:{'x-amz-executed-version':'$LATEST'}});
  turns++;
  return http({status:200,canary:{state:turns===4?'complete':'ready',spentMicros:turns*28,
   usage:{step:turns,inputs:100,outputs:30,cost:28,bytes:1000,requestHash:'f'.repeat(64),withinBounds:true},
   ...(turns<4?{receipt:receipt(turns)}:{})},result:{reply:privateReply,followUps:[],done:turns===4,
    continuation:turns===4?null:continuation}},
  {headers:{'x-amz-executed-version':drift==='executed-version'?'1':'$LATEST'}});
 });
 const operator=createNavigatorCanaryOperator({directory,manifest,artifactSha256,publicCodeSha256,latestRevision,aliasRevision,
  masterRevision:11,credentials:{accessKeyId:'AKIDEXAMPLE',secretAccessKey:'fixture-only'},fetchOnce,now:()=>epoch,
  monotonic:()=>monotonic,sleep});
 return {operator,sent,reads,sleep};
}
it('signs each direct fetch, preflights each invoke, paces turns, and reconciles sanitized evidence',async()=>{
 const f=fixture();
 const result=await f.operator.run();
 expect(result).toMatchObject({status:'reconciled',requests:4,spentMicros:112});
 expect(f.sent.map(event=>event.step)).toEqual([0,1,2,3,4]);
 expect(f.reads.filter(key=>key==='AI#CONFIG')).toHaveLength(6);
 expect(f.sleep).toHaveBeenCalledExactlyOnceWith(61000);
 expect(f.sent[4]).toMatchObject({cookie,continuation,receipt:receipt(3)});
 expect(f.sent[4].history.at(-1)).toEqual({role:'assistant',text:privateReply});
 for(const secret of [cookie,privateReply,continuation,receipt(3)]){
  expect(JSON.stringify(result)).not.toContain(secret);
  expect(readFileSync(f.operator.filename,'utf8')).not.toContain(secret);
 }
 await expect(f.operator.run()).rejects.toThrow('already started');
});
it.each(['code','revision','alias','public','master','off','credential'])('blocks before any invocation on %s drift',async drift=>{
 const f=fixture({drift});
 await expect(f.operator.run()).rejects.toThrow('Do not retry');
 expect(f.sent).toHaveLength(0);
});
it.each(['lost-response','executed-version','reconciliation'])('never sends another step after %s failure',async mode=>{
 const f=fixture(mode==='lost-response'?{failInvokeAt:2}:mode==='executed-version'?{drift:mode}:{finalBalance:113});
 await expect(f.operator.run()).rejects.toThrow('Do not retry');
 expect(f.sent.map(event=>event.step)).toEqual(mode==='lost-response'?[0,1,2]:mode==='executed-version'?[0,1]:[0,1,2,3,4]);
 await expect(f.operator.run()).rejects.toThrow('already started');
});
