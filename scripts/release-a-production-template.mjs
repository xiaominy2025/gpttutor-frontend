// Pure local packaging/review helpers. This module never calls AWS.
import {readFile,writeFile} from 'node:fs/promises';
import {parse} from 'yaml';
const tags=[{tag:'!Ref',resolve:value=>({Ref:value})},{tag:'!GetAtt',resolve:value=>({'Fn::GetAtt':value.split('.')})},{tag:'!Sub',resolve:value=>({'Fn::Sub':value})}];
export const parseProductionTemplate=source=>parse(source,{customTags:tags});
export function packagedProductionTemplate(source,{commit,zipSha256,objectVersion,enabled=false}){
 if(!/^[a-f0-9]{40}$/.test(commit??'')||!/^[a-f0-9]{64}$/.test(zipSha256??'')||!objectVersion||/REQUIRED|PLACEHOLDER/.test(objectVersion)||typeof enabled!=='boolean')throw Error('Pinned clean source, ZIP hash and real S3 VersionId required');
 const t=parseProductionTemplate(source),flag=String(enabled),p=t.Resources.Api.Properties;
 if(Object.keys(t.Resources).length!==15||p.FunctionName!=='engent-platform-prod-api'||p.Environment.Variables.STAGE!=='prod')throw Error('Production template drift');
 const r=t.Resources,e=p.Environment.Variables;
 if([r.Domain,r.PlatformClient,r.TreeClient].some(x=>x.Properties.UserPoolId!=='us-east-1_Ilf34btQ0')||e.STATE_TABLE!=='decisiontree-prod-data'||e.APP_ORIGIN!=='https://www.engentlabs.com'||e.TREE_ORIGIN!=='https://decisiontree.engentlabs.com'||[r.Integration,r.Route,r.EntitlementsRoute].some(x=>x.Properties.ApiId!=='eoszayfkqd')||r.EntitlementsRoute.Properties.Target!=='integrations/9gaznns'||r.Runtime.Properties.RoleName!=='engent-platform-prod-runtime'||r.Runtime.Properties.Policies[0].PolicyDocument.Statement[0].Resource!=='arn:aws:dynamodb:us-east-1:771049112957:table/decisiontree-prod-data')throw Error('Exact production resource targets required');
 p.CodeUri={Bucket:'decisiontree-prod-artifacts-771049112957-us-east-1',Key:'engent-release-a-prod/platform/'+commit+'/'+zipSha256+'.zip',Version:objectVersion};
 // SAM compares unresolved !Ref values; parameter-only changes can leave live on the old version.
 // A literal change in each packaged template forces a new immutable version for activation/disable.
 p.Environment.Variables.SHARED_AUTH_ENABLED=flag;
 p.VersionDeletionPolicy='Retain';
 t.Parameters.EnableAuth={Type:'String',Default:flag,AllowedValues:[flag],Description:'Must match the literal, reviewed phase template; parameter-only activation is prohibited.'};
 return t;
}
export function reviewAuthChanges(changes,{phase='create',retainedVersionIds=[]}={}){
 const c=changes.map(x=>x.ResourceChange??x),base=new Set(['Domain','PlatformClient','TreeClient','PlatformBranding','TreeBranding','Logs','RuntimeBoundary','Runtime','Api','Integration','Route','Invocation','EntitlementsRoute','TreeSessionDeletion','ExploreRewrite']);
 const expected={Domain:'AWS::Cognito::UserPoolDomain',PlatformClient:'AWS::Cognito::UserPoolClient',TreeClient:'AWS::Cognito::UserPoolClient',PlatformBranding:'AWS::Cognito::ManagedLoginBranding',TreeBranding:'AWS::Cognito::ManagedLoginBranding',Logs:'AWS::Logs::LogGroup',RuntimeBoundary:'AWS::IAM::ManagedPolicy',Runtime:'AWS::IAM::Role',Api:'AWS::Lambda::Function',Integration:'AWS::ApiGatewayV2::Integration',Route:'AWS::ApiGatewayV2::Route',Invocation:'AWS::Lambda::Permission',EntitlementsRoute:'AWS::ApiGatewayV2::Route',TreeSessionDeletion:'AWS::IAM::Policy',ExploreRewrite:'AWS::CloudFront::Function'};
 if(!c.length)throw Error('Actual change list required');
 for(const r of c){
  const version=/^ApiVersion[a-zA-Z0-9]+$/.test(r.LogicalResourceId)&&r.ResourceType==='AWS::Lambda::Version';
  const alias=r.LogicalResourceId==='ApiAliaslive'&&r.ResourceType==='AWS::Lambda::Alias';
  if(!base.has(r.LogicalResourceId)&&!version&&!alias)throw Error('Unreviewed logical resource');
  if(base.has(r.LogicalResourceId)&&r.ResourceType!==expected[r.LogicalResourceId])throw Error('Unreviewed resource type');
  if(r.Replacement==='True'||r.Replacement==='Conditional')throw Error('Resource replacement prohibited');
  if(phase==='create'){
   if(r.Action!=='Add')throw Error('Initial auth change set must be Add-only');
  }else if(phase==='activate'||phase==='disable'){
   if(version){if(!['Add','Remove'].includes(r.Action))throw Error('Immutable version must be added/retained, not modified');if(r.Action==='Remove'&&!retainedVersionIds.includes(r.LogicalResourceId))throw Error('Processed-template Retain proof required for old version');}
   else if(!((r.LogicalResourceId==='Api'||alias)&&r.Action==='Modify'&&r.Replacement==='False'))throw Error('Activation may modify only the function and live alias');
  }else throw Error('Unknown phase');
 }
 if(phase==='create'){
  for(const id of base)if(!c.some(x=>x.LogicalResourceId===id))throw Error('Missing initial resource');
  if(c.length!==17||c.filter(x=>x.ResourceType==='AWS::Lambda::Version').length!==1||!c.some(x=>x.LogicalResourceId==='ApiAliaslive'))throw Error('Expected 15 declared + version/alias, 17 total');
 }
 return {phase,count:c.length,replacements:0,reviewed:true};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/release-a-production-template.mjs')){
 const [commit,zipSha256,objectVersion,phase,output]=process.argv.slice(2);
 if(!output||!['disabled','enabled'].includes(phase))throw Error('Supply commit, ZIP SHA256, actual VersionId, disabled|enabled, local output');
 const t=packagedProductionTemplate(await readFile('infra/release-a-production/template.yaml','utf8'),{commit,zipSha256,objectVersion,enabled:phase==='enabled'});
 await writeFile(output,JSON.stringify(t,null,2));console.log('Pinned local phase template written. No AWS upload/change set/deployment.');
}
