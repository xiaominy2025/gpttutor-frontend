// Read-only IAM custom-policy simulation. Does not create or change any role.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import yaml from'js-yaml';
const schema=yaml.DEFAULT_SCHEMA.extend(['!Ref','!Sub','!GetAtt'].map(tag=>new yaml.Type(tag,{kind:'scalar',construct:x=>x})));
const template=readFileSync('infra/navigator-alpha/proposal.yaml','utf8'),doc=yaml.load(template,{schema}),policy=doc.Resources.RuntimeRole.Properties.Policies[0].PolicyDocument;
const table='arn:aws:dynamodb:us-east-1:771049112957:table/decisiontree-alpha-staging-Data-JH4B4OFXWER5',ssm='arn:aws:ssm:us-east-1:771049112957:parameter/';
const context=(key,attributes)=>[{ContextKeyName:'dynamodb:LeadingKeys',ContextKeyValues:[key],ContextKeyType:'stringList'},...(attributes?[{ContextKeyName:'dynamodb:Attributes',ContextKeyValues:attributes,ContextKeyType:'stringList'}]:[])];
const cases=[
 ['navigator-read','dynamodb:GetItem',table,context('NAVIGATOR#BUDGET#2026-11'),'allowed'],
 ['navigator-write','dynamodb:PutItem',table,context('NAVIGATOR#BUDGET#2026-11'),'allowed'],
 ['navigator-replay-delete','dynamodb:DeleteItem',table,context('NAVIGATOR#TURN#fixture'),'allowed'],
 ['deny-session-write','dynamodb:PutItem',table,context('PLATFORM#EMAIL#fixture'),'implicitDeny'],
 ['deny-project-read','dynamodb:GetItem',table,context('PROJECT#fixture'),'implicitDeny'],
 ['master-projected-read','dynamodb:GetItem',table,context('AI#CONFIG',['pk','sk','suspended','revision']),'allowed'],
 ['deny-master-unprojected-read','dynamodb:GetItem',table,context('AI#CONFIG'),'implicitDeny'],
 ['deny-master-extra-attribute','dynamodb:GetItem',table,context('AI#CONFIG',['pk','sk','suspended','revision','other']),'implicitDeny'],
 ['deny-master-write','dynamodb:PutItem',table,context('AI#CONFIG'),'implicitDeny'],
 ['deny-scan','dynamodb:Scan',table,[],'implicitDeny'],
 ['dedicated-openai','ssm:GetParameter',ssm+'decisionnavigator-alpha/openai-api-key',[],'allowed'],
 ['dedicated-signing','ssm:GetParameter',ssm+'decisionnavigator-alpha/hmac-secret',[],'allowed'],
 ['deny-process-key','ssm:GetParameter',ssm+'decisionprocess-alpha/openai-api-key',[],'implicitDeny'],
 ['deny-production-key','ssm:GetParameter',ssm+'decisionnavigator-prod/openai-api-key',[],'implicitDeny']
];
const dir='.artifacts/navigator-alpha-integration';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/runtime-policy.json',JSON.stringify(policy,null,2));
const results=[];
for(const[label,action,resource,ContextEntries,expected]of cases){const input={PolicyInputList:[JSON.stringify(policy)],ActionNames:[action],ResourceArns:[resource],ContextEntries};const r=JSON.parse(execFileSync('aws',['iam','simulate-custom-policy','--cli-input-json',JSON.stringify(input),'--profile','default','--region','us-east-1','--output','json','--no-cli-pager'],{encoding:'utf8',env:{...process.env,AWS_MAX_ATTEMPTS:'1'}}));const actual=r.EvaluationResults[0].EvalDecision;results.push({label,action,resource,expected,actual,passed:expected===actual});}
const passed=results.every(x=>x.passed);writeFileSync(dir+'/iam-simulation.json',JSON.stringify({passed,customPolicyOnly:true,effectiveRoleExists:false,kmsAccessVerified:false,templateSha256:createHash('sha256').update(template).digest('hex'),results},null,2));if(!passed)throw Error('IAM proposal simulation failed');console.log(JSON.stringify({passed,cases:results.length,effectiveRoleVerified:false}));
