import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';
import {packagedProductionTemplate,parseProductionTemplate,reviewAuthChanges} from '../../scripts/release-a-production-template.mjs';
const source=readFileSync('infra/release-a-production/template.yaml','utf8');
const pin={commit:'a'.repeat(40),zipSha256:'b'.repeat(64),objectVersion:'fixture-actual-version'};
it('pins S3 object version and literal activation so SAM sees a template change',()=>{
 const disabled=packagedProductionTemplate(source,pin),enabled=packagedProductionTemplate(source,{...pin,enabled:true});
 expect(disabled.Resources.Api.Properties.Environment.Variables.SHARED_AUTH_ENABLED).toBe('false');
 expect(enabled.Resources.Api.Properties.Environment.Variables.SHARED_AUTH_ENABLED).toBe('true');
 expect(enabled.Parameters.EnableAuth.AllowedValues).toEqual(['true']);
 expect(enabled.Resources.Api.Properties.CodeUri).toEqual({Bucket:'decisiontree-prod-artifacts-771049112957-us-east-1',Key:'engent-release-a-prod/platform/'+pin.commit+'/'+pin.zipSha256+'.zip',Version:pin.objectVersion});
 expect(enabled.Resources.Api.Properties.VersionDeletionPolicy).toBe('Retain');
 expect(enabled.Resources.Api.Properties.Role).toEqual({'Fn::GetAtt':['Runtime','Arn']});
 expect(()=>packagedProductionTemplate(source,{...pin,objectVersion:'REQUIRED_AFTER_UPLOAD'})).toThrow();
 expect(()=>packagedProductionTemplate(source.replace('STATE_TABLE: decisiontree-prod-data','STATE_TABLE: alpha-table'),pin)).toThrow('production resource');
});
it('requires the exact initial transformed resource inventory and rejects replacements/removal',()=>{
 const t=parseProductionTemplate(source),changes=Object.entries(t.Resources).map(([LogicalResourceId,r])=>({LogicalResourceId,ResourceType:r.Type==='AWS::Serverless::Function'?'AWS::Lambda::Function':r.Type,Action:'Add'}));
 changes.push({LogicalResourceId:'ApiVersion123abc',ResourceType:'AWS::Lambda::Version',Action:'Add'},{LogicalResourceId:'ApiAliaslive',ResourceType:'AWS::Lambda::Alias',Action:'Add'});
 expect(reviewAuthChanges(changes)).toMatchObject({count:17,replacements:0});
 expect(()=>reviewAuthChanges(changes.slice(1))).toThrow();
 expect(()=>reviewAuthChanges(changes.map(x=>x.LogicalResourceId==='Api'?{...x,Replacement:'Conditional'}:x))).toThrow();
 expect(()=>reviewAuthChanges(changes.map(x=>x.LogicalResourceId==='Logs'?{...x,ResourceType:'AWS::DynamoDB::Table'}:x))).toThrow('resource type');
 expect(()=>reviewAuthChanges([...changes,{LogicalResourceId:'ExtraTable',ResourceType:'AWS::DynamoDB::Table',Action:'Add'}])).toThrow();
});
it('bounds activate/disable to function, alias and immutable version churn',()=>{
 const changes=[{LogicalResourceId:'Api',ResourceType:'AWS::Lambda::Function',Action:'Modify',Replacement:'False'},{LogicalResourceId:'ApiAliaslive',ResourceType:'AWS::Lambda::Alias',Action:'Modify',Replacement:'False'},{LogicalResourceId:'ApiVersionOld',ResourceType:'AWS::Lambda::Version',Action:'Remove'},{LogicalResourceId:'ApiVersionNew',ResourceType:'AWS::Lambda::Version',Action:'Add'}];
 expect(()=>reviewAuthChanges(changes,{phase:'activate'})).toThrow('Retain proof');
 expect(reviewAuthChanges(changes,{phase:'activate',retainedVersionIds:['ApiVersionOld']}).reviewed).toBe(true);
 expect(()=>reviewAuthChanges([...changes,{LogicalResourceId:'PlatformClient',ResourceType:'AWS::Cognito::UserPoolClient',Action:'Modify',Replacement:'False'}],{phase:'activate'})).toThrow();
});
