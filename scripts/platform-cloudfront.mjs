import {readFile,writeFile} from 'node:fs/promises';
const [path,apiId,output]=process.argv.slice(2);
if(!/^[a-z0-9]+$/.test(apiId??'')||!output) throw Error('Supply a saved distribution config, proposed platform API ID, and output path.');
const document=JSON.parse(await readFile(path,'utf8'));
const config=structuredClone(document.DistributionConfig??document);
if(config.CacheBehaviors.Items.some(item=>item.PathPattern==='/api/platform/*')) throw Error('Platform behavior already exists. Review it explicitly.');
const originId='engent-platform';
if(config.Origins.Items.some(item=>item.Id===originId)) throw Error('Origin already exists.');
config.Origins.Items.push({Id:originId,DomainName:apiId+'.execute-api.us-east-1.amazonaws.com',
 CustomOriginConfig:{HTTPPort:80,HTTPSPort:443,OriginProtocolPolicy:'https-only',OriginSslProtocols:{Quantity:1,Items:['TLSv1.2']},OriginReadTimeout:30,OriginKeepaliveTimeout:5}});
config.Origins.Quantity=config.Origins.Items.length;
config.CacheBehaviors.Items.unshift({PathPattern:'/api/platform/*',TargetOriginId:originId,ViewerProtocolPolicy:'https-only',
 AllowedMethods:{Quantity:7,Items:['GET','HEAD','OPTIONS','PUT','POST','PATCH','DELETE'],CachedMethods:{Quantity:2,Items:['GET','HEAD']}},
 Compress:true,CachePolicyId:'4135ea2d-6df8-44a3-9df3-4b5a84be39ad',OriginRequestPolicyId:'b689b0a8-53d0-40ab-baf2-68738e2966ac',
 SmoothStreaming:false});
config.CacheBehaviors.Quantity=config.CacheBehaviors.Items.length;
await writeFile(output,JSON.stringify(config,null,2));
console.log('Saved additive CloudFront proposal locally. Review ETag and complete diff before execution.');
