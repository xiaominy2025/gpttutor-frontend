import {createHmac, randomBytes} from 'node:crypto';
import {cookie, digest, PlatformError} from './oauth.mjs';

import {readConversation, makeContinuation, navigatorRequest, readNavigatorReply, maxTurns, maxOutputTokens} from './navigator.mjs';

const prefix='/api/platform';
const cookiesOf=event=>Object.fromEntries((event.cookies??[event.headers?.cookie??'']).join(';').split(';').map(part=>part.trim().split('=')).filter(pair=>pair.length===2));
const reply=(statusCode,body,cookies=[])=>({statusCode,cookies,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
const redirect=(url,cookies=[])=>({...reply(303,{},cookies),headers:{'Cache-Control':'no-store',Location:url}});
export function platformApp({oauth,entitlements,credentials,controls,generate,origin,treeOrigin,enabled=false,navigator=false,price,conversationStore}) {
 async function member(session) {
  const result=await entitlements(session.token);
  if(result.sub!==session.sub || result.enabled!==true) throw new PlatformError(401,'Account access is suspended.');
  return result;
 }
 return async event=>{
  try {
   if(!enabled) return reply(410,{error:'Feature unavailable.'});
   const method=event.requestContext?.http?.method;
   const path=event.rawPath;
   if(!path?.startsWith(prefix+'/')) return reply(410,{error:'Not found.'});
   if(!['GET','HEAD'].includes(method) && event.headers?.origin!==origin) return reply(401,{error:'Origin not allowed.'});
   const cookies=cookiesOf(event);
   if(path===prefix+'/login' && method==='GET') {
    const start=await oauth.login();return redirect(start.url,[start.cookie]);
   }
   if(path===prefix+'/callback' && method==='GET') {
    const result=await oauth.complete(new URLSearchParams(event.rawQueryString),cookies);
    // Validate and provision through the authoritative directory before enabling platform access.
    try { await member({sub:result.principal.sub,token:result.tokens.access_token}); }
    catch(error) {
     await oauth.logout({'__Host-engent-platform':result.id});
     throw error;
    }
    return redirect(origin+'/explore',result.cookies);
   }
   if(path===prefix+'/logout' && method==='POST') {
    const result=await oauth.logout(cookies);
    return reply(200,{logoutUrl:result.url},[result.cookie]);
   }
   const session=await oauth.session(cookies);
   const account=session?await member(session):null;
   if(path===prefix+'/session' && method==='GET') {
    const anonymous=cookies['__Host-engent-guest'];
    const guest=typeof anonymous==='string'&&/^[A-Za-z0-9_-]{43}$/.test(anonymous)?anonymous:randomBytes(32).toString('base64url');
    return reply(200,{signedIn:!!session,role:account?'student':'guest',
     entitlements:account?{tree:{advanced:account.treeAdvanced===true}}:{},
     navigator,treeLoginUrl:session?treeOrigin+'/api/shared/login':undefined},[cookie('__Host-engent-guest',guest,86400)]);
   }
   if(path!==prefix+'/navigator' || method!=='POST' || !navigator) return reply(410,{error:'Feature unavailable.'});
   const raw=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';
   if(Buffer.byteLength(raw)>50000) return reply(413,{error:'Message is too large.'});
   let input;
   try { input=JSON.parse(raw); } catch { return reply(400,{error:'Invalid message.'}); }
   if(!input || typeof input.message!=='string'||!input.message.trim()||input.message.length>2000 ||
      !Array.isArray(input.history)||input.history.length>maxTurns*2||input.history.length%2!==0 ||
      input.history.some((row,index)=>!row||row.role!==(index%2?'assistant':'user')||
        typeof row.text!=='string'||row.text.length>(index%2?1000:2000))) {
    return reply(400,{error:'Use a message up to 2,000 characters and a valid conversation.'});
   }
   const secret=await credentials();
   const anonymous=cookies['__Host-engent-guest'];
   if(!session && !/^[A-Za-z0-9_-]{43}$/.test(anonymous??'')) return reply(401,{error:'Open Explore before using Navigator.'});
   const actor=digest(session?'account#'+session.sub:'guest#'+anonymous);
   const ip=event.requestContext?.http?.sourceIp;
   if(!ip) throw new PlatformError(503,'Navigator is unavailable.');
   const ipHash=createHmac('sha256',secret.ipSecret).update(ip).digest('hex');
   const {history,dimension}=input;
   const followUps=readConversation(input,secret.ipSecret,actor);
   if(dimension!=null&&!followUps.some(item=>item.dimension===dimension&&item.question===input.message)) {
    return reply(400,{error:'This follow-up is no longer available.'});
   }
   const request=navigatorRequest(price.model,history,input.message,followUps,dimension);
   if(!/^[a-z0-9][a-z0-9.-]+$/.test(price.model??'')||![price.input,price.output].every(value=>Number.isFinite(value)&&value>0)) throw new PlatformError(503,'Navigator pricing unavailable.');
   const bytes=Buffer.byteLength(JSON.stringify(request));
   // UTF-8 byte count plus framing is a conservative token ceiling for this bounded request.
   const reservation=Math.ceil((bytes+1024)*price.input+maxOutputTokens*price.output);
   const claim=input.continuation && 'NAVIGATOR#TURN#'+digest(input.continuation);
   if(claim && !await conversationStore.replace(claim,0,{expiresAt:Math.ceil(Number(input.continuation.split('.')[0])/1000)})) {
    throw new PlatformError(409,'This turn was already submitted. Start a new decision if needed.');
   }
   try {
    const lease=await controls.admit(actor,ipHash,!session,reservation);
    let response;
    try { response=await generate(secret.key,request); }
    catch { await controls.settle(lease,0,true);throw new PlatformError(503,'Navigator could not respond. Please try later.'); }
    const usage=response.usage;
    if(!usage || ![usage.input_tokens,usage.output_tokens].every(Number.isSafeInteger) ||
       usage.input_tokens<0||usage.output_tokens<0) {
     await controls.settle(lease,0,true);throw new PlatformError(503,'Navigator usage unavailable.');
    }
    await controls.settle(lease,Math.ceil(usage.input_tokens*price.input+usage.output_tokens*price.output));
    const result=readNavigatorReply(response,history,followUps,dimension);
    const nextHistory=[...history,{role:'user',text:input.message},{role:'assistant',text:result.reply}];
    return reply(200,{...result,continuation:result.done?null:makeContinuation(secret.ipSecret,actor,nextHistory,result.followUps)});
   } catch(error) {
    if(claim) await conversationStore.remove(claim,1);
    throw error;
   }
  } catch(error) {
   return reply(error instanceof PlatformError?error.status:503,{error:error instanceof PlatformError?error.message:'Service temporarily unavailable.'});
  }
 };
}
