import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {parse} from 'yaml';
import {productionEdgeProposal} from '../../scripts/release-a-production-cloudfront.mjs';
const base=()=>({ETag:'fixture-etag',DistributionConfig:{Aliases:{Items:['engentlabs.com','www.engentlabs.com']},Origins:{Quantity:1,Items:[{Id:'S3-engentlabs-frontend',DomainName:'engentlabs-frontend.s3.amazonaws.com',OriginPath:'',OriginAccessControlId:'existing-oac'}]},DefaultCacheBehavior:{TargetOriginId:'S3-engentlabs-frontend',FunctionAssociations:{Quantity:0},CachePolicyId:'existing-policy'},CacheBehaviors:{Quantity:1,Items:[{PathPattern:'/test/*',TargetOriginId:'legacy-origin'}]},CustomErrorResponses:{Quantity:1,Items:[{ErrorCode:403,ResponsePagePath:'/index.html'}]},ViewerCertificate:{ACMCertificateArn:'existing-certificate'}}});
it('prepares isolated preview and final publication preserving legacy routes, TLS and error handling',()=>{
 const before=base(),commit='a'.repeat(40),preview=productionEdgeProposal(before,{commit});
 expect(preview.config.DefaultCacheBehavior).toEqual(before.DistributionConfig.DefaultCacheBehavior);
 expect(preview.config.CacheBehaviors.Items.at(-1)).toEqual(before.DistributionConfig.CacheBehaviors.Items[0]);
 for(const name of ['CustomErrorResponses','ViewerCertificate','Aliases'])expect(preview.config[name]).toEqual(before.DistributionConfig[name]);
 expect(before.DistributionConfig.Origins.Quantity).toBe(1);
 const published=productionEdgeProposal(before,{commit,mode:'publish'});
 expect(published.config.DefaultCacheBehavior.TargetOriginId).toBe('engent-release-a-web');
 expect(published.config.Origins.Items.find(o=>o.Id==='engent-release-a-web').OriginAccessControlId).toBe('existing-oac');
 const api=published.config.CacheBehaviors.Items[0];expect(api.CachePolicyId).toBe('4135ea2d-6df8-44a3-9df3-4b5a84be39ad');
 expect(()=>productionEdgeProposal({ETag:'new',DistributionConfig:published.config},{commit})).toThrow();
});
it('canonicalizes only the fixed website host and maps Explore/assets without dropping encoded queries',()=>{
 const template=parse(readFileSync('infra/release-a-production/template.yaml','utf8'),{customTags:['!Ref','!GetAtt','!Sub'].map(tag=>({tag,resolve:value=>value}))});
 const handler=runInNewContext(template.Resources.ExploreRewrite.Properties.FunctionCode+';handler;');
 const request={method:'GET',uri:'/explore',headers:{host:{value:'engentlabs.com'}},querystring:{next:{value:'%2Fexplore'},a:{multiValue:[{value:'1'},{value:'2'}]}}};
 const redirect=handler({request});expect(redirect.headers.location.value).toBe('https://www.engentlabs.com/explore?next=%2Fexplore&a=1&a=2');expect(redirect.headers['cache-control'].value).toBe('no-store');
 expect(handler({request:{...request,method:'POST'}}).statusCode).toBe(403);
 const www={...request,headers:{host:{value:'www.engentlabs.com'}}};expect(handler({request:www}).uri).toBe('/index.html');
 expect(handler({request:{...www,uri:'/engent-release-a/assets/file.js'}}).uri).toBe('/assets/file.js');
 expect(handler({request:{...www,uri:'/api/platform/callback'}}).uri).toBe('/api/platform/callback');
});

it('supplies complete API behavior and origin fields required by CloudFront update',()=>{
 const preview=productionEdgeProposal(base(),{commit:'a'.repeat(40)});
 const api=preview.config.CacheBehaviors.Items[0];expect(api.FieldLevelEncryptionId).toBe('');expect(api.TrustedSigners).toEqual({Enabled:false,Quantity:0});expect(api.TrustedKeyGroups).toEqual({Enabled:false,Quantity:0});expect(api.GrpcConfig).toEqual({Enabled:false});
 const origin=preview.config.Origins.Items.find(o=>o.Id==='engent-release-a-api');expect(origin.ConnectionAttempts).toBe(3);expect(origin.ConnectionTimeout).toBe(10);expect(origin.OriginShield).toEqual({Enabled:false});expect(origin.OriginAccessControlId).toBe('');
});
