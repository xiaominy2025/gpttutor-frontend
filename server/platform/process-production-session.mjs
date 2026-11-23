// Production Release A compatibility RPC; no new login, identity store or Tree change.
import {digest,PlatformError} from './oauth.mjs';
export const PROCESS_PRODUCTION_SESSION_PATH='/internal/coaches/process/session';
const response=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
export function processProductionSession({oauth,store,entitlements,now=()=>Math.floor(Date.now()/1000)}){
 return async event=>{
  const c=event.requestContext,iam=c?.authorizer?.iam;
  if(event.version!=='2.0'||event.rawPath!==PROCESS_PRODUCTION_SESSION_PATH||event.routeKey!=='POST '+PROCESS_PRODUCTION_SESSION_PATH||c?.http?.method!=='POST'||c.apiId!=='eoszayfkqd'||c.stage!=='$default'||iam?.accountId!=='771049112957'||!/^arn:aws:sts::771049112957:assumed-role\/decisionprocess-prod-runtime\/[A-Za-z0-9_+=,.@-]{2,64}$/.test(iam?.userArn??''))return response(403,{error:'Caller not authorized.'});
  try{
   const types=Object.entries(event.headers??{}).filter(([k])=>k.toLowerCase()==='content-type');
   if(types.length!==1||types[0][1].split(';')[0].trim()!=='application/json')return response(400,{error:'Invalid session request.'});
   if(typeof event.body!=='string'||event.body.length>(event.isBase64Encoded?1536:1024))return response(413,{error:'Invalid request size.'});
   const raw=event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body;
   if(Buffer.byteLength(raw)>1024)return response(413,{error:'Invalid request size.'});
   const match=/^\s*\{\s*"sessionId"\s*:\s*"([A-Za-z0-9_-]{43})"\s*\}\s*$/.exec(raw);
   if(!match)return response(400,{error:'Invalid session request.'});
   const id=match[1],session=await oauth.session({'__Host-engent-platform':id});
   if(!session||session.id!==id||typeof session.sub!=='string'||!session.sub||session.sub.length>256||typeof session.token!=='string')return response(401,{active:false});
   const member=await entitlements(session.token);
   if(member.sub!==session.sub||member.enabled!==true||member.aiEnabled!==true)return response(401,{active:false});
   // Fresh read AFTER membership verification: logout/deletion cannot be masked by cached identity.
   const parent=await store.get('SESSION#'+digest(id));
   if(!parent||parent.sub!==session.sub||parent.accessToken!==session.token||!Number.isSafeInteger(parent.expiresAt)||parent.expiresAt<=now())return response(401,{active:false});
   return response(200,{active:true,subject:session.sub,expiresAt:Math.min(parent.expiresAt,now()+60),audience:'process-prod',role:'student'});
  }catch(error){return error instanceof PlatformError&&[401,403].includes(error.status)?response(401,{active:false}):response(503,{error:'Session authority unavailable.'});}
 };
}
