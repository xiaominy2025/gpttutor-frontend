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
  const clarify=request.input.length===1;
  const reply=clarify?'What outcome matters most if you have to make a trade-off?':
   'Compare two feasible options against that priority. Write down one fact you can check this week that could change which option you prefer.';
  return {usage:{input_tokens:0,output_tokens:0},output:[{content:[{type:'output_text',
   text:JSON.stringify({kind:clarify?'clarify':'guide',reply})}]}]};
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
