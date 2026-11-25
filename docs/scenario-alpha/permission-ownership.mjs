import assert from 'node:assert/strict';
export function ownedPermissionRevision(r,before,startedAt){
 const target='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:live';
 const expectedBase='arn:aws:execute-api:us-east-1:771049112957:8qmgd1ghdi/$default/POST/';
 assert.equal(r.resources.length,3);
 assert(r.resources.every(x=>x.ResourceStatus==='CREATE_COMPLETE'&&x.StackName==='engent-scenario-alpha-admission'));
 assert.deepEqual(r.resources.map(x=>x.LogicalResourceId).sort(),['ScenarioAdmissionCallerPolicy','ScenarioAdmissionPermission','ScenarioAdmissionRoute']);
 const sid=r.resources.find(x=>x.LogicalResourceId==='ScenarioAdmissionPermission').PhysicalResourceId;
 assert.equal(r.events.length,1);const e=r.events[0];
 assert.equal(e.event,'AddPermission20150331v2');assert.equal(e.error,undefined);
 assert.equal(e.invokedBy,'cloudformation.amazonaws.com');assert.equal(e.principal,'arn:aws:iam::771049112957:user/engentlabs-cli');
 assert(Date.parse(e.at)>=Math.floor(startedAt/1000)*1000);
 assert.deepEqual(e.request,{functionName:target,statementId:sid,principal:'apigateway.amazonaws.com',sourceArn:expectedBase+'internal/coaches/scenario/ai',sourceAccount:'771049112957'});
 const permission=(Sid,path,account=false)=>({Sid,Effect:'Allow',Principal:{Service:'apigateway.amazonaws.com'},Action:'lambda:InvokeFunction',Resource:target,
  Condition:{...(account?{StringEquals:{'AWS:SourceAccount':'771049112957'}}:{}),ArnLike:{'AWS:SourceArn':expectedBase+path}}});
 const expected=[permission('decisionnavigator-alpha-NavigatorSessionPermission-1u78kZC7w6Xm','api/platform/navigator/session'),
  permission('decisionnavigator-alpha-NavigatorTurnPermission-MMqG6xHBt1R9','api/platform/navigator'),permission(sid,'internal/coaches/scenario/ai',true)];
 assert.deepEqual(r.policy.statements,expected);assert.deepEqual(JSON.parse(e.response.statement),expected[2]);
 const {RevisionId,...a}=r.current,{RevisionId:prior,...b}=before;assert.deepEqual(a,b);
 assert.notEqual(RevisionId,prior);assert.equal(RevisionId,r.policy.revision);
 return RevisionId;
}
