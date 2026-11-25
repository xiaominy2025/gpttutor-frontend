import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import {cookie, digest, PlatformError} from './oauth.mjs';
import {readConversation, makeContinuation, navigatorRequest, readNavigatorReply, maxTurns, maxReplyLength, maxMessageLength, maxRequestBytes} from './navigator.mjs';

export const NAVIGATOR_PATH='/api/platform/navigator';
export const NAVIGATOR_SESSION_PATH=NAVIGATOR_PATH+'/session';
const cookieName='__Host-engent-navigator';
const lifetime=86400;
const reply=(statusCode,body,cookies=[])=>({statusCode,cookies,headers:{
 'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
},body:JSON.stringify(body)});

export function anonymousNavigator({origin, enabled=false, aiEnabled=true, signingSecret, credential, model='gpt-6-luna', controls, conversationStore, master, generate, now=Date.now}) {
 const sign=(value,secret)=>createHmac('sha256',secret).update('navigator-session#'+value).digest();
 function readIdentity(value,secret) {
  const match=/^([A-Za-z0-9_-]{43})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(value??'');
  if(!match||Number(match[2])<=Math.floor(now()/1000))return null;
  return timingSafeEqual(Buffer.from(match[3],'base64url'),sign(match[1]+'.'+match[2],secret))?match[1]:null;
 }
 return async event=>{
  try {
   if(!enabled || ![NAVIGATOR_SESSION_PATH,NAVIGATOR_PATH].includes(event.rawPath))return reply(404,{error:'Navigator is unavailable.'});
   if(event.requestContext?.http?.method!=='POST')return reply(405,{error:'Use POST.'});
   if(event.headers?.origin!==origin)return reply(403,{error:'Origin not allowed.'});
   const matches=(event.cookies??[event.headers?.cookie??'']).join(';').split(';')
    .map(value=>value.trim()).filter(value=>value.startsWith(cookieName+'='));
   if(matches.length>1)return reply(401,{error:'Open Navigator again to renew the session.'});
   const anonymous=matches[0]?.slice(cookieName.length+1);
   if(event.rawPath===NAVIGATOR_PATH&&!anonymous)return reply(401,{error:'Open Navigator again to start an anonymous session.'});
   const ipSecret=await signingSecret();
   if(typeof ipSecret!=='string'||ipSecret.length<32)throw new PlatformError(503,'Navigator configuration unavailable.');
   if(event.rawPath===NAVIGATOR_SESSION_PATH){
    if(readIdentity(anonymous,ipSecret))return reply(200,{ready:true});
    const value=randomBytes(32).toString('base64url')+'.'+(Math.floor(now()/1000)+lifetime);
    return reply(200,{ready:true},[cookie(cookieName,value+'.'+sign(value,ipSecret).toString('base64url'),lifetime)]);
   }
   if(!aiEnabled)return reply(503,{error:'Navigator AI is temporarily unavailable.'});
   const raw=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';
   if(Buffer.byteLength(raw)>maxRequestBytes) return reply(413,{error:'Message is too large.'});
   let input;
   try { input=JSON.parse(raw); } catch { return reply(400,{error:'Invalid message.'}); }
   if(!input || typeof input.message!=='string'||!input.message.trim()||input.message.length>maxMessageLength ||
      !Array.isArray(input.history)||input.history.length>maxTurns*2||input.history.length%2!==0 ||
      input.history.some((row,index)=>!row||row.role!==(index%2?'assistant':'user')||
        typeof row.text!=='string'||row.text.length>(index%2?maxReplyLength:maxMessageLength))) {
    return reply(400,{error:'Use a message up to 2,000 characters and a valid conversation.'});
   }
   const identity=readIdentity(anonymous,ipSecret);
   if(!identity) return reply(401,{error:'Open Navigator again to start an anonymous session.'});
   const actor=digest('navigator#'+identity);
   const ip=event.requestContext?.http?.sourceIp;
   if(!isIP(ip??'')) throw new PlatformError(503,'Navigator is unavailable.');
   const ipHash=createHmac('sha256',ipSecret).update(ip).digest('hex');
   const {history,dimension}=input;
   const followUps=readConversation(input,ipSecret,actor);
   if(dimension!=null&&!followUps.some(item=>item.dimension===dimension&&item.question===input.message)) {
    return reply(400,{error:'This follow-up is no longer available.'});
   }
   const request={...navigatorRequest(model,history,input.message,followUps,dimension),service_tier:'default'};
   if(model!=='gpt-6-luna')throw new PlatformError(503,'Navigator configuration unavailable.');
   const claim=input.continuation && 'NAVIGATOR#TURN#'+digest(input.continuation);
   if(claim && !await conversationStore.replace(claim,0,{expiresAt:Math.ceil(Number(input.continuation.split('.')[0])/1000)})) {
    throw new PlatformError(409,'This turn was already submitted. Start a new decision if needed.');
   }
   let dispatchStarted=false;
   try {
    const key=await credential();
    const lease=await controls.acquire(actor,ipHash,true);
    try { await master.assertEnabled(); }
    catch {
     await controls.finish(lease);
     throw new PlatformError(503,'Navigator AI is temporarily unavailable.');
    }
    let response;
    dispatchStarted=true;
    try { response=await generate(key,request); }
    catch { throw new PlatformError(503,'Navigator could not respond. Please try later.'); }
    // A failed completion write retains only a bounded lock; never reject a valid
    // reply because optional telemetry or a release acknowledgement is missing.
    try{await controls.finish(lease);}catch{console.warn('{"event":"navigator_lock_release_unconfirmed"}');}
    const result=readNavigatorReply(response,history,followUps,dimension);
    const nextHistory=[...history,{role:'user',text:input.message},{role:'assistant',text:result.reply}];
    return reply(200,{...result,continuation:result.done?null:makeContinuation(ipSecret,actor,nextHistory,result.followUps)});
   } catch(error) {
    // A request may have reached the provider even when transport or accounting fails.
    if(claim && !dispatchStarted) await conversationStore.remove(claim,1);
    throw error;
   }
  } catch(error) {
   const result=reply(error instanceof PlatformError?error.status:503,{error:error instanceof PlatformError?error.message:'Navigator is temporarily unavailable.',...(error.code?{code:error.code}:{}),...(Number.isSafeInteger(error.retryAfter)?{retryAfter:error.retryAfter}:{})});
   if(Number.isSafeInteger(error.retryAfter))result.headers['Retry-After']=String(error.retryAfter);
   return result;
  }
 };
}
