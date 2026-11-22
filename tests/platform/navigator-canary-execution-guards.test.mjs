import {describe,it,expect,vi} from 'vitest';
import {acknowledgedInstallRevision,assertOwnedPrivateRevision,observeTerminalLambdaResponse} from '../../scripts/navigator-canary-execution-guards.mjs';
const before='11111111-1111-1111-1111-111111111111',owned='22222222-2222-2222-2222-222222222222',other='33333333-3333-3333-3333-333333333333';
describe('private canary ownership',()=>{
 it('requires an acknowledged new revision and exact code hash',()=>{
  expect(acknowledgedInstallRevision({CodeSha256:'hash',RevisionId:owned},'hash',before)).toBe(owned);
  for(const ack of [null,{CodeSha256:'wrong',RevisionId:owned},{CodeSha256:'hash',RevisionId:before},{CodeSha256:'hash'}])expect(()=>acknowledgedInstallRevision(ack,'hash',before)).toThrow();
 });
 it('rejects matching code with changed or unacknowledged revision',()=>{
  expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:owned},'hash',owned)).not.toThrow();
  for(const revision of [other,undefined])expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:revision},'hash',owned)).toThrow();
  expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:owned},'hash',undefined)).toThrow();
 });
});
describe('terminal Lambda acknowledgement',()=>{
 it('clears uncertainty only after reading the complete payload',async()=>{
  const terminal=vi.fn(),json=vi.fn(async()=>{expect(terminal).not.toHaveBeenCalled();return {status:200};});
  const response=observeTerminalLambdaResponse({status:200,headers:new Headers({'x-amz-executed-version':'$LATEST'}),json},terminal);
  expect(terminal).not.toHaveBeenCalled();await expect(response.json()).resolves.toEqual({status:200});expect(terminal).toHaveBeenCalledTimes(1);
 });
 it.each(['truncated','wrong-version','function-error','http-error'])('retains uncertainty for %s',async mode=>{
  const terminal=vi.fn(),headers=new Headers({'x-amz-executed-version':mode==='wrong-version'?'1':'$LATEST'});
  if(mode==='function-error')headers.set('x-amz-function-error','Unhandled');
  const response=observeTerminalLambdaResponse({status:mode==='http-error'?502:200,headers,json:async()=>{throw Error('truncated');}},terminal);
  await expect(response.json()).rejects.toThrow();expect(terminal).not.toHaveBeenCalled();
 });
});

import {completedDeployment,runtimeConfigurationHash} from '../../scripts/navigator-canary-execution-guards.mjs';
const functionArn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api',principal='arn:aws:iam::771049112957:user/engentlabs-cli';
const startedAt=Date.UTC(2026,10,22,3,10),modified=new Date(startedAt).toISOString();
function deploymentFixture({sameRevision=false,reads,events,acknowledgement}={}){
 let time=startedAt+1000;
 const ack={FunctionArn:functionArn,Version:'$LATEST',RevisionId:owned,CodeSha256:'hash',LastModified:modified,State:'Active',LastUpdateStatus:'InProgress',
  Role:'role',Runtime:'nodejs22.x',Handler:'index.handlerEntry',Timeout:29,MemorySize:256,Environment:{Variables:{STAGE:'alpha',NAVIGATOR_ENABLED:'false'}}};
 const ready={...ack,RevisionId:sameRevision?owned:other,LastUpdateStatus:'Successful'};
 const event={at:modified,event:'UpdateFunctionCode20150331v2',eventId:'44444444-4444-4444-4444-444444444444',principal,functionArn,
  priorRevision:before,publish:false,acknowledgedRevision:owned,hash:'hash'};
 const readConfiguration=vi.fn(async qualified=>({...ready,FunctionArn:functionArn+(qualified?':$LATEST':'')}));
 if(reads)for(const r of reads)readConfiguration.mockImplementationOnce(async()=>({...ready,...r}));
 const readWriteEvents=vi.fn(async()=>events??[event]);
 const options={acknowledgement:acknowledgement===undefined?ack:acknowledgement,priorRevision:before,expectedHash:'hash',configurationHash:runtimeConfigurationHash(ack),functionArn,principal,startedAt,
  readConfiguration,readWriteEvents,now:()=>time,sleep:async ms=>{time+=ms;},timeoutMs:60000,pollMs:15000};
 return {options,ready,event,readConfiguration,readWriteEvents};
}
describe('acknowledged versus completed deployment revisions',()=>{
 it.each([false,true])('accepts audited stable completion (same acknowledgement revision: %s)',async sameRevision=>{
  const f=deploymentFixture({sameRevision});const result=await completedDeployment(f.options);
  expect(result).toMatchObject({acknowledgedRevision:owned,readyRevision:sameRevision?owned:other,hash:'hash',cloudTrailEventId:f.event.eventId});
  expect(f.readConfiguration.mock.calls.map(x=>x[0])).toEqual([true,false,true]);
  expect(()=>assertOwnedPrivateRevision(f.ready,'hash',result.readyRevision)).not.toThrow();
  expect(()=>assertOwnedPrivateRevision({...f.ready,RevisionId:before},'hash',result.readyRevision)).toThrow();
 });
 it('allows InProgress read polling and delayed audit delivery without another write',async()=>{
  const f=deploymentFixture({reads:[{RevisionId:owned,LastUpdateStatus:'InProgress'}]});
  f.readWriteEvents.mockResolvedValueOnce([]);
  await expect(completedDeployment(f.options)).resolves.toMatchObject({readyRevision:other});
  expect(f.readWriteEvents).toHaveBeenCalledTimes(2);
 });
 it.each(['Failed','InProgress'])('rejects failed or never-completed %s updates',async status=>{
  const f=deploymentFixture();f.readConfiguration.mockResolvedValue({...f.ready,LastUpdateStatus:status});
  await expect(completedDeployment(f.options)).rejects.toThrow();expect(f.readWriteEvents).not.toHaveBeenCalled();
 });
 it('refuses a lost install acknowledgement even when ready code matches',async()=>{
  const f=deploymentFixture({acknowledgement:null});await expect(completedDeployment(f.options)).rejects.toThrow('not acknowledged');
  expect(f.readConfiguration).not.toHaveBeenCalled();
 });
 it.each(['Role','Runtime','Handler','Timeout','MemorySize','Environment','Layers','Architectures','LoggingConfig','VpcConfig'])('rejects %s configuration drift',async field=>{
  const f=deploymentFixture();f.readConfiguration.mockResolvedValue({...f.ready,[field]:'changed'});
  await expect(completedDeployment(f.options)).rejects.toThrow('drift');
 });
 it.each(['CodeSha256','LastModified','FunctionArn','Version'])('rejects ready %s drift',async field=>{
  const f=deploymentFixture();f.readConfiguration.mockResolvedValue({...f.ready,[field]:'changed'});
  await expect(completedDeployment(f.options)).rejects.toThrow('drift');
 });
 it('rejects unstable qualified/unqualified ready reads',async()=>{
  const f=deploymentFixture({reads:[{}, {RevisionId:owned}]});await expect(completedDeployment(f.options)).rejects.toThrow('unstable');
 });
 it('rejects a changed ready revision after CloudTrail lookup',async()=>{
  const f=deploymentFixture({reads:[{},{},{RevisionId:owned}]});await expect(completedDeployment(f.options)).rejects.toThrow('drift');
 });
 it('never adopts another completed revision while audit delivery is pending',async()=>{
  const f=deploymentFixture({reads:[{},{},{RevisionId:owned}]});f.readWriteEvents.mockResolvedValueOnce([]);
  await expect(completedDeployment(f.options)).rejects.toThrow('drift');
 });
 it('rejects concurrent writes even with identical hash and configuration',async()=>{
  const f=deploymentFixture();f.readWriteEvents.mockResolvedValue([f.event,{...f.event,eventId:'55555555-5555-5555-5555-555555555555'}]);
  await expect(completedDeployment(f.options)).rejects.toThrow('Concurrent');
 });
 it.each(['principal','functionArn','priorRevision','publish','acknowledgedRevision','hash','at','event','error'])('requires exact CloudTrail %s ownership',async field=>{
  const f=deploymentFixture();f.readWriteEvents.mockResolvedValue([{...f.event,[field]:'wrong'}]);
  await expect(completedDeployment(f.options)).rejects.toThrow('ownership');
 });
 it('fails closed on audit timeout',async()=>{
  const f=deploymentFixture({events:[]});await expect(completedDeployment(f.options)).rejects.toThrow('timed out');
 });
 it('fails closed on incomplete/unreadable audit lookup',async()=>{
  const f=deploymentFixture();f.readWriteEvents.mockRejectedValue(Error('lookup unavailable'));
  await expect(completedDeployment(f.options)).rejects.toThrow('unavailable');
 });
 it('uses the same verified lifecycle for restoration with a different completed revision',async()=>{
  const f=deploymentFixture();f.options.expectedHash='original';f.options.acknowledgement.CodeSha256='original';
  f.readConfiguration.mockResolvedValue({...f.ready,CodeSha256:'original'});f.readWriteEvents.mockResolvedValue([{...f.event,hash:'original'}]);
  await expect(completedDeployment(f.options)).resolves.toMatchObject({acknowledgedRevision:owned,readyRevision:other,hash:'original'});
 });
});

import {deploymentWriteEvents} from '../../scripts/navigator-canary-execution-guards.mjs';
function auditRecord(event,identifier,resources=[]){return {Resources:resources,CloudTrailEvent:JSON.stringify({eventSource:'lambda.amazonaws.com',awsRegion:'us-east-1',recipientAccountId:'771049112957',
 eventTime:event.at,eventName:event.event,eventID:event.eventId,userIdentity:{arn:event.principal},requestParameters:{functionName:identifier,revisionId:event.priorRevision,publish:false},
 responseElements:{revisionId:event.acknowledgedRevision,codeSha256:event.hash}})};}
describe('CloudTrail exact function write matching',()=>{
 it.each(['decisionnavigator-alpha-api','decisionnavigator-alpha-api:$LATEST','decisionnavigator-alpha-api:live','771049112957:function:decisionnavigator-alpha-api',
  '771049112957:function:decisionnavigator-alpha-api:$LATEST',functionArn,functionArn+':$LATEST'])('includes concurrent write identified by %s',async identifier=>{
  const f=deploymentFixture(),second={...f.event,eventId:'55555555-5555-5555-5555-555555555555'};
  const events=deploymentWriteEvents([auditRecord(f.event,functionArn),auditRecord(second,identifier)],functionArn);
  expect(events).toHaveLength(2);f.readWriteEvents.mockResolvedValue(events);
  await expect(completedDeployment(f.options)).rejects.toThrow('Concurrent');
 });
 it('uses lookup resource metadata even when request target is omitted',async()=>{
  const f=deploymentFixture();const record=auditRecord(f.event,undefined,[{ResourceType:'AWS::Lambda::Function',ResourceName:'decisionnavigator-alpha-api:$LATEST'}]);
  expect(deploymentWriteEvents([record],functionArn)).toHaveLength(1);
 });
 it('uses event resource metadata for resource-oriented writes',()=>{
  const f=deploymentFixture(),record=auditRecord(f.event,undefined);const e=JSON.parse(record.CloudTrailEvent);e.resources=[{ARN:functionArn+':live'}];record.CloudTrailEvent=JSON.stringify(e);
  expect(deploymentWriteEvents([record],functionArn)).toHaveLength(1);
 });
 it('does not accept a different account, region or similarly named function',()=>{
  const f=deploymentFixture();const records=['decisionnavigator-alpha-api-other','000000000000:function:decisionnavigator-alpha-api',functionArn.replace('us-east-1','us-west-2')].map(x=>auditRecord(f.event,x));
  expect(deploymentWriteEvents(records,functionArn)).toEqual([]);
 });
 it('fails closed on malformed audit data',()=>{expect(()=>deploymentWriteEvents([{CloudTrailEvent:'not JSON'}],functionArn)).toThrow();});
});

describe('flag-only configuration deployment uses the same ownership lifecycle',()=>{
 it.each([false,true])('verifies the configuration event and completed revision (same=%s)',async sameRevision=>{
  const f=deploymentFixture({sameRevision});f.options.operation='configuration';
  f.readWriteEvents.mockResolvedValue([{...f.event,event:'UpdateFunctionConfiguration20150331v2',publish:undefined}]);
  await expect(completedDeployment(f.options)).resolves.toMatchObject({acknowledgedRevision:owned,readyRevision:sameRevision?owned:other});
 });
 it('rejects a code event when configuration ownership is required',async()=>{
  const f=deploymentFixture();f.options.operation='configuration';await expect(completedDeployment(f.options)).rejects.toThrow('ownership');
 });
 it('does not authorize any other mutation type',async()=>{
  const f=deploymentFixture();f.options.operation='unreviewed';await expect(completedDeployment(f.options)).rejects.toThrow('Unreviewed');expect(f.readConfiguration).not.toHaveBeenCalled();
 });
});
