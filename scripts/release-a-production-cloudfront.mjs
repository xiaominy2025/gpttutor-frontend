// OFFLINE ONLY. Produces a complete proposed config; never invokes AWS.
import {readFile,writeFile} from 'node:fs/promises';
export function productionEdgeProposal(document,{commit,mode='preview'}){
 if(!/^[a-f0-9]{40}$/.test(commit)||!['preview','publish'].includes(mode))throw Error('Exact source commit and preview/publish mode required');
 const c=structuredClone(document.DistributionConfig);
 if(!document.ETag||!c||!c.Aliases?.Items?.includes('www.engentlabs.com')||!c.Aliases.Items.includes('engentlabs.com'))throw Error('Expected current website config and ETag');
 if(c.DefaultCacheBehavior.TargetOriginId!=='S3-engentlabs-frontend'||c.DefaultCacheBehavior.FunctionAssociations?.Quantity)throw Error('Default origin/function drift');
 if(c.Origins.Items.some(x=>x.Id.startsWith('engent-release-a'))||c.CacheBehaviors.Items.some(x=>['/api/platform/*','/explore','/explore/*','/engent-release-a/*'].includes(x.PathPattern)))throw Error('Existing Release A routing requires explicit reconciliation');
 const s3=c.Origins.Items.find(x=>x.Id==='S3-engentlabs-frontend');
 if(s3?.DomainName!=='engentlabs-frontend.s3.amazonaws.com'||s3.OriginPath!=='')throw Error('Website source origin drift');
 const fn={Quantity:1,Items:[{EventType:'viewer-request',FunctionARN:'arn:aws:cloudfront::771049112957:function/engent-release-a-prod-explore'}]};
 const origin=structuredClone(s3);origin.Id='engent-release-a-web';origin.OriginPath='/releases/engent-release-a/'+commit;
 c.Origins.Items.push(origin,{Id:'engent-release-a-api',DomainName:'eoszayfkqd.execute-api.us-east-1.amazonaws.com',OriginPath:'',CustomHeaders:{Quantity:0},ConnectionAttempts:3,ConnectionTimeout:10,OriginShield:{Enabled:false},OriginAccessControlId:'',CustomOriginConfig:{HTTPPort:80,HTTPSPort:443,OriginProtocolPolicy:'https-only',OriginSslProtocols:{Quantity:1,Items:['TLSv1.2']},OriginReadTimeout:30,OriginKeepaliveTimeout:5}});
 c.Origins.Quantity=c.Origins.Items.length;
 const web=path=>({...structuredClone(c.DefaultCacheBehavior),PathPattern:path,TargetOriginId:origin.Id,FunctionAssociations:structuredClone(fn)});
 const api={...structuredClone(c.DefaultCacheBehavior),FieldLevelEncryptionId:c.DefaultCacheBehavior.FieldLevelEncryptionId??'',TrustedSigners:{Enabled:false,Quantity:0},TrustedKeyGroups:{Enabled:false,Quantity:0},GrpcConfig:{Enabled:false},PathPattern:'/api/platform/*',TargetOriginId:'engent-release-a-api',ViewerProtocolPolicy:'https-only',AllowedMethods:{Quantity:7,Items:['GET','HEAD','OPTIONS','PUT','POST','PATCH','DELETE'],CachedMethods:{Quantity:2,Items:['GET','HEAD']}},Compress:true,SmoothStreaming:false,CachePolicyId:'4135ea2d-6df8-44a3-9df3-4b5a84be39ad',OriginRequestPolicyId:'b689b0a8-53d0-40ab-baf2-68738e2966ac',FunctionAssociations:structuredClone(fn),LambdaFunctionAssociations:{Quantity:0}};
 c.CacheBehaviors.Items.unshift(api,web('/explore'),web('/explore/*'),web('/engent-release-a/*'));c.CacheBehaviors.Quantity=c.CacheBehaviors.Items.length;
 if(mode==='publish'){c.DefaultCacheBehavior.TargetOriginId=origin.Id;c.DefaultCacheBehavior.FunctionAssociations=structuredClone(fn);}
 return {baselineETag:document.ETag,mode,commit,config:c};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/release-a-production-cloudfront.mjs')){
 const [before,commit,mode,output]=process.argv.slice(2);if(!output)throw Error('Supply saved config, commit, mode and local output');
 const result=productionEdgeProposal(JSON.parse((await readFile(before,'utf8')).replace(/^\uFEFF/,'')),{commit,mode});
 await writeFile(output,JSON.stringify(result,null,2));console.log('Offline distribution proposal saved; not applied. Use config with freshly verified If-Match after approval.');
}
