import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {parse} from 'yaml';
const source=readFileSync('infra/release-a-production/template.yaml','utf8');
const t=parse(source,{customTags:['!Ref','!GetAtt','!Sub'].map(tag=>({tag,resolve:value=>value}))});
it('starts disabled on existing production resources with no user pool, table or Navigator creation',()=>{
 expect(t.Parameters.EnableAuth.Default).toBe('false');
 expect(Object.values(t.Resources).filter(r=>['AWS::Cognito::UserPool','AWS::DynamoDB::Table','AWS::ApiGatewayV2::Api','AWS::SSM::Parameter'].includes(r.Type))).toHaveLength(0);
 expect(t.Resources.Api.Properties.Environment.Variables.NAVIGATOR_ENABLED).toBe('false');
 expect(t.Resources.PlatformClient.Properties.UserPoolId).toBe('us-east-1_Ilf34btQ0');
 expect(t.Resources.EntitlementsRoute.Properties.AuthorizationType).toBe('AWS_IAM');
});
it('matches the platform role and boundary while bounding table partitions and the signed route',()=>{
 const role=t.Resources.Runtime.Properties.Policies[0].PolicyDocument;
 expect(role).toEqual(t.Resources.RuntimeBoundary.Properties.PolicyDocument);
 expect(role.Statement[0].Condition.Null['dynamodb:LeadingKeys']).toBe('false');
 expect(role.Statement[0].Condition['ForAllValues:StringLike']['dynamodb:LeadingKeys']).toEqual(['PLATFORM#*']);
 expect(role.Statement[2].Resource).toBe('arn:aws:execute-api:us-east-1:771049112957:eoszayfkqd/$default/POST/internal/platform/entitlements');
 const delta=JSON.parse(readFileSync('infra/release-a-production/tree-boundary-delta.json','utf8'));
 expect(t.Resources.TreeSessionDeletion.Properties.PolicyDocument).toEqual(delta);
});
