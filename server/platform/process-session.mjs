// Alpha-only RPC: trust only API Gateway AWS_IAM context, never caller headers.
import {createHash} from 'node:crypto';
export const PROCESS_SESSION_PATH='/internal/coaches/process/session';
const opaque=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const reply=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'},body:JSON.stringify(body)});
export function processSession({store,invoke,enabled=false,now=()=>Math.floor(Date.now()/1000)}){
 return async e=>{
  if(!enabled)return reply(503,{error:'Process session verification unavailable.'});
  const c=e.requestContext,iam=c?.authorizer?.iam;
  if(e.rawPath!==PROCESS_SESSION_PATH||c?.http?.method!=='POST'||c.apiId!=='8qmgd1ghdi'||c.stage!=='$default'||iam?.accountId!=='771049112957'||!/^arn:aws:sts::771049112957:assumed-role\/decisionprocess-alpha-runtime\/[A-Za-z0-9_+=,.@-]{2,64}$/.test(iam?.userArn??''))return reply(403,{error:'Caller not authorized.'});
  try{
   const raw=e.isBase64Encoded?Buffer.from(e.body??'','base64').toString('utf8'):e.body??'';
   if(Buffer.byteLength(raw)>1024)return reply(413,{error:'Request too large.'});
   if(e.headers?.['content-type']?.split(';')[0]!=='application/json')return reply(400,{error:'Invalid session request.'});
   let v;try{v=JSON.parse(raw);}catch{return reply(400,{error:'Invalid session request.'});}
   if(!v||Array.isArray(v)||Object.keys(v).join(',')!=='sessionId'||!opaque(v.sessionId))return reply(400,{error:'Invalid session request.'});
   const w=await store.get('EMAIL#'+createHash('sha256').update(v.sessionId).digest('hex'));
   if(!w||w.kind!=='session'||!opaque(w.lease)||!Number.isSafeInteger(w.expiresAt)||w.expiresAt<=now())return reply(401,{active:false});
   const a=await invoke('session',{lease:w.lease,action:'read'});
   if(a.active!==true||a.pending===true||typeof a.sub!=='string'||!a.sub||a.sub.length>256||a.sub!==w.sub)return reply(401,{active:false});
   if(!Number.isSafeInteger(a.expiresAt)||a.expiresAt<=now())return reply(503,{error:'Session authority unavailable.'});
   return reply(200,{active:true,subject:a.sub,expiresAt:Math.min(w.expiresAt,a.expiresAt),audience:'process-alpha'});
  }catch(err){return [401,403].includes(err.status)?reply(err.status,{active:false}):reply(503,{error:'Session authority unavailable.'});}
 };
}
