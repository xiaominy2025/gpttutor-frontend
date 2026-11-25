import {createHmac,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import {digest,PlatformError} from './oauth.mjs';
const path='/internal/coaches/scenario/ai';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const bindings={alpha:{origin:'https://d6owpirihdsus.cloudfront.net',api:'8qmgd1ghdi'},prod:{origin:'https://www.engentlabs.com',api:'eoszayfkqd'}};
const send=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
export function scenarioQuotaAdmission(environment,{signingSecret,store,controls,master,now=Date.now}){
 const b=bindings[environment];if(!b)throw Error('Unknown environment');
 const caller=new RegExp('^arn:aws:sts::771049112957:assumed-role/scenario-'+environment+'-runtime/[^/]+$');
 async function identity(input){
  if(input.origin!==b.origin||!isIP(input.sourceIp??''))throw new PlatformError(403,'Invalid Scenario request provenance.');
  if(typeof input.cookie!=='string'||input.cookie.length>8192)throw new PlatformError(401,'Guest proof is required.');
  const tokens=input.cookie.split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-engent-navigator='));
  if(tokens.length!==1)throw new PlatformError(401,'Guest proof is required.');
  const m=/^([A-Za-z0-9_-]{43})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(tokens[0].slice('__Host-engent-navigator='.length));
  if(!m||Number(m[2])<=Math.floor(now()/1000))throw new PlatformError(401,'Guest proof expired or invalid.');
  const secret=await signingSecret();if(typeof secret!=='string'||secret.length<32)throw Error('Proof unavailable');
  const actual=Buffer.from(m[3],'base64url'),expected=createHmac('sha256',secret).update('navigator-session#'+m[1]+'.'+m[2]).digest();
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new PlatformError(401,'Guest proof expired or invalid.');
  return{actor:digest('navigator#'+m[1]),ip:createHmac('sha256',secret).update(input.sourceIp).digest('hex')};
 }
 return async event=>{
  try{
   if(event.requestContext?.apiId!==b.api||event.requestContext?.stage!=='$default'||event.rawPath!==path||event.routeKey!=='POST '+path||event.requestContext?.http?.method!=='POST'||!caller.test(event.requestContext?.authorizer?.iam?.userArn??''))return send(403,{error:'Scenario runtime required.'});
   const raw=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';
   if(typeof raw!=='string'||Buffer.byteLength(raw)>16384)throw new PlatformError(413,'Admission request too large.');
   let x;try{x=JSON.parse(raw);}catch{throw new PlatformError(400,'Invalid admission request.');}
   if(!x||Array.isArray(x)||x.contractVersion!==2)throw new PlatformError(400,'Unsupported access contract.');
   const fields={master:[],verify:['origin','cookie','sourceIp'],acquire:['origin','cookie','sourceIp','requestId','model','requestBytes','maxOutputTokens'],dispatch:['leaseId'],finish:['leaseId','outcome']}[x.operation];
   if(!fields||Object.keys(x).some(k=>!['contractVersion','operation',...fields].includes(k)))throw new PlatformError(400,'Invalid access fields.');
   if(x.operation==='master'){await master.assertEnabled();return send(200,{enabled:true});}
   if(x.operation==='verify'){await identity(x);await master.assertEnabled();return send(200,{verified:true,coach:'scenario',environment});}
   if(x.operation==='acquire'){
    const {actor,ip}=await identity(x);
    if(!uuid.test(x.requestId??'')||x.model!=='gpt-6-luna'||!Number.isSafeInteger(x.requestBytes)||x.requestBytes<1||x.requestBytes>24576||x.maxOutputTokens!==640)throw new PlatformError(400,'Invalid Scenario request bounds.');
    await master.assertEnabled();
    const id='ACCESS#SCENARIO#'+x.requestId;
    await controls.acquire(actor,ip,true,{id,value:{state:'admitted',coach:'scenario',environment,dispatchBefore:now()+15000,expiresAt:Math.ceil(now()/1000)+2*86400}});
    return send(200,{admitted:true,leaseId:x.requestId,coach:'scenario',environment,noRetry:true});
   }
   if(!uuid.test(x.leaseId??''))throw new PlatformError(400,'Invalid access token.');
   const id='ACCESS#SCENARIO#'+x.leaseId,row=await store.get(id);
   if(row?.coach!=='scenario'||row.environment!==environment||!['admitted','dispatched'].includes(row.state))throw new PlatformError(409,'Access token expired or already used.');
   if(x.operation==='dispatch'){
    if(row.state!=='admitted'||row.dispatchBefore<=now()||row.lease?.expires<=now())throw new PlatformError(409,'Dispatch expired or already authorized.');
    await master.assertEnabled();
    if(!await store.replace(id,row.version,{...row,state:'dispatched'}))throw new PlatformError(409,'Dispatch already authorized.');
    return send(200,{allowed:true,noRetry:true});
   }
   if(!['completed','not_dispatched','uncertain'].includes(x.outcome)||
      (x.outcome==='not_dispatched'?row.state!=='admitted':row.state!=='dispatched'))throw new PlatformError(409,'Invalid completion state.');
   const value={...row,state:x.outcome};
   if(x.outcome==='uncertain'){
    if(!await store.replace(id,row.version,value))throw new PlatformError(409,'Completion already recorded.');
   }else await controls.finish(row.lease,{id,previous:row,value});
   return send(200,{finished:true});
  }catch(e){const result=send(e instanceof PlatformError?e.status:503,{error:e instanceof PlatformError?e.message:'Scenario access controls are unavailable.',...(e.code?{code:e.code}:{}),...(Number.isSafeInteger(e.retryAfter)?{retryAfter:e.retryAfter}:{})});if(Number.isSafeInteger(e.retryAfter))result.headers['Retry-After']=String(e.retryAfter);return result;}
 };
}
