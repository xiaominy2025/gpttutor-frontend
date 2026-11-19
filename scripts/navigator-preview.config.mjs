import {defineConfig, mergeConfig} from 'vite';
import base from '../vite.config.js';
import {platformApp} from '../server/platform/app.mjs';

const origin='http://127.0.0.1:5173';
const claims=new Set();
const app=platformApp({
 origin,treeOrigin:'https://decisiontree.engentlabs.com',enabled:true,navigator:true,
 oauth:{session:async()=>null},
 credentials:async()=>({key:'mock-preview',ipSecret:'local-preview-fixture'}),
 price:{model:'gpt-6-luna',input:0.1,output:0.5},
 controls:{admit:async()=>({}),settle:async()=>{}},
 conversationStore:{
  replace:async id=>{if(claims.has(id))return false;claims.add(id);return true;},
  remove:async id=>claims.delete(id)
 },
 generate:async (_key,request)=>{
  const turn=(request.input.length+1)/2;
  const reply=[
   'A second shift could improve delivery reliability, but it commits staff hours before you know whether extra capacity is the bottleneck. The trade-off depends on whether late orders are occasional or routine.\n\nWhich outcome matters most if you have to make a trade-off?',
   'Delivery reliability is clearer as the priority. A seasonal increase and a persistent bottleneck point to different ways of comparing capacity. Temporary staffing could offer flexibility, while a permanent shift offers consistency.\n\nThe judgment is how much uncertainty about future demand you can tolerate before committing.',
   'The decision balances reliable deliveries, staffing commitments, and uncertainty about how long the demand will last. Your judgment depends on how costly delays are and how much capacity you can change later. The choice remains yours and can be reconsidered as demand becomes clearer.'
  ][turn-1];
  return {usage:{input_tokens:0,output_tokens:0},output:[{content:[{type:'output_text',
   text:JSON.stringify({kind:'guide',reply,exploredDimension:null,followUps:turn===1?[
    {dimension:'objectives',question:'How can I tell whether delivery is my primary goal?'},
    {dimension:'analysis',question:'How can I examine what is causing late orders?'},
    {dimension:'judgment',question:'How can I decide how much uncertainty I can accept?'}
   ]:turn===2?[{dimension:'analysis',question:'How can I test whether demand is seasonal?'}]:[]})}]}]};
 }
});

export default mergeConfig(base,defineConfig({
 define:{'import.meta.env.VITE_SHARED_AUTH_ENABLED':JSON.stringify('true')},
 server:{strictPort:true},
 plugins:[{
  name:'navigator-mock-preview',
  configureServer(server){
   server.middlewares.use(async (req,res,next)=>{
    if(!['/api/platform/session','/api/platform/navigator'].includes(req.url))return next();
    const chunks=[];
    let size=0;
    for await(const chunk of req){
     size+=chunk.length;
     if(size>50000){res.writeHead(413);res.end();return;}
     chunks.push(chunk);
    }
    const result=await app({rawPath:req.url,headers:req.headers,body:Buffer.concat(chunks).toString(),
     requestContext:{http:{method:req.method,sourceIp:'127.0.0.1'}}});
    res.writeHead(result.statusCode,{...result.headers,...(result.cookies.length?{'Set-Cookie':result.cookies}:{})});
    res.end(result.body);
   });
  }
 }]
}));
