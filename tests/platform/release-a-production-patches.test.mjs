import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';
import {preSignupPoolProposal,treeBoundaryProposal,treeEnvironmentProposal} from '../../scripts/release-a-production-patches.mjs';
it('changes only PreSignUp while preserving every mutable original pool field',()=>{
 const before={Id:'us-east-1_Ilf34btQ0',AdminCreateUserConfig:{AllowAdminCreateUserOnly:false},LambdaConfig:{},MfaConfiguration:'OFF',UserPoolTags:{Application:'decisiontree-prod'},EmailConfiguration:{SourceArn:'fixture-ses'},Policies:{SignInPolicy:{AllowedFirstAuthFactors:['PASSWORD','EMAIL_OTP']}},EstimatedNumberOfUsers:99};
 const keys=['UserPoolId','AdminCreateUserConfig','LambdaConfig','MfaConfiguration','UserPoolTags','EmailConfiguration','Policies'];
 const result=preSignupPoolProposal(before,keys);expect(result.AdminCreateUserConfig.AllowAdminCreateUserOnly).toBe(false);expect(result.EmailConfiguration).toEqual(before.EmailConfiguration);expect(result.Policies).toEqual(before.Policies);expect(result.UserPoolTags).toEqual(before.UserPoolTags);expect(result.EstimatedNumberOfUsers).toBeUndefined();expect(before.LambdaConfig).toEqual({});
 expect(()=>preSignupPoolProposal({...before,LambdaConfig:{PreSignUp:'unexpected'}},keys)).toThrow();
});
it('appends only the reviewed shared-session deletion grant and preserves original policy',()=>{
 const delta=JSON.parse(readFileSync('infra/release-a-production/tree-boundary-delta.json','utf8'));const before={Version:'2012-10-17',Statement:[{Effect:'Allow',Action:'dynamodb:GetItem',Resource:'fixture'}]};
 const after=treeBoundaryProposal(before,delta);expect(after.Statement.slice(0,-1)).toEqual(before.Statement);expect(after.Statement.at(-1)).toEqual(delta.Statement[0]);expect(before.Statement).toHaveLength(1);
 expect(()=>treeBoundaryProposal(before,{...delta,Statement:[{...delta.Statement[0],Action:'dynamodb:*'}]})).toThrow();
});
it('adds five production auth keys without altering original credentials, limits or origins',()=>{
 const before={APP_ORIGIN:'https://decisiontree.engentlabs.com',COGNITO_POOL_ID:'us-east-1_Ilf34btQ0',ALPHA_TABLE:'decisiontree-prod-data',PROJECT_BUCKET:'decisiontree-prod-snapshots-771049112957-us-east-1',AI_CREDENTIALS_PARAMETER_NAME:'/decisiontree-prod/ai-credentials',AI_DAILY_MICROS:'2000000',AI_TOTAL_MICROS:'20000000'};
 const after=treeEnvironmentProposal(before,{treeClient:'allocatedtree',platformClient:'allocatedplatform'});for(const [key,value]of Object.entries(before))expect(after[key]).toBe(value);expect(after.SHARED_AUTH_ENABLED).toBe('false');expect(Object.keys(after)).toHaveLength(Object.keys(before).length+5);
 expect(()=>treeEnvironmentProposal({...before,ALPHA_TABLE:'alpha'},{treeClient:'allocatedtree',platformClient:'allocatedplatform'})).toThrow();
});
