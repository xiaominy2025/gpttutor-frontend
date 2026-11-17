// Edit a saved configuration locally; never invokes AWS.
import {readFileSync,writeFileSync} from 'node:fs';
const [input,release,output,treeRelease]=process.argv.slice(2);
if(!input||!/^[a-f0-9]{40}$/.test(release??'')||!output||!/^[a-f0-9]{40}$/.test(treeRelease??''))throw Error('Pass saved config, exact platform commit, output and exact Tree commit.');
const saved=JSON.parse(readFileSync(input,'utf8')),config=structuredClone(saved.Config??saved.DistributionConfig);
if(config.Origins.Items.find(x=>x.Id==='engent-release-a-alpha'))throw Error('Overlay already exists; review instead of overwriting.');
if(!config.Origins.Items.some(x=>x.Id==='frontend'&&x.DomainName==='decisiontree-alpha-staging-frontend-vnhhrwadnpad.s3.us-east-1.amazonaws.com')||config.Aliases.Quantity!==0)throw Error('Existing Alpha configuration required.');
const origin=structuredClone(config.Origins.Items.find(x=>x.Id==='frontend'));
origin.Id='engent-release-a-alpha';origin.OriginPath='/releases/engent-release-a/'+release;config.Origins.Items.push(origin);config.Origins.Quantity++;
config.Origins.Items.find(x=>x.Id==='frontend').OriginPath='/releases/'+treeRelease;
const behavior=structuredClone(config.DefaultCacheBehavior);
behavior.TargetOriginId=origin.Id;behavior.CachePolicyId='4135ea2d-6df8-44a3-9df3-4b5a84be39ad';
behavior.FunctionAssociations={Quantity:1,Items:[{EventType:'viewer-request',FunctionARN:'arn:aws:cloudfront::771049112957:function/engent-release-a-alpha-explore'}]};
for(const path of ['/explore','/explore/*','/engent-alpha/*']){
 if(config.CacheBehaviors.Items.some(x=>x.PathPattern===path))throw Error('Existing route collision.');
 config.CacheBehaviors.Items.unshift({...structuredClone(behavior),PathPattern:path});config.CacheBehaviors.Quantity++;
}
writeFileSync(output,JSON.stringify(config,null,2)+'\n');console.log('Local Alpha overlay and pinned Tree frontend prefix prepared. Existing default behavior, API and aliases retained.');
