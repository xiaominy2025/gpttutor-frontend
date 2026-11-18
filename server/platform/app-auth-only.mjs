// Release A only. No guest budget, Navigator, AI generation or credentials path.
import {PlatformError} from './oauth.mjs';

const prefix='/api/platform';
const cookiesOf=event=>Object.fromEntries((event.cookies??[event.headers?.cookie??'']).join(';').split(';').map(part=>part.trim().split('=')).filter(pair=>pair.length===2));
const reply=(statusCode,body,cookies=[])=>({statusCode,cookies,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
const redirect=(url,cookies=[])=>({...reply(303,{},cookies),headers:{'Cache-Control':'no-store',Location:url}});
const catalog=['Decision Process Coach','Forecasting Coach','Scenario Analysis Coach','Decision Tree Coach','Simulation Coach','Optimization Coach'];
export function authOnlyApp({oauth,entitlements,origin,treeOrigin,enabled=false}) {
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
    return reply(200,{signedIn:!!session,role:account?'student':'guest',
     entitlements:account?{tree:{advanced:account.treeAdvanced===true}}:{},
     navigator:false,treeLoginUrl:session?treeOrigin+'/api/shared/login':undefined});
   }
   return reply(410,{error:'Feature unavailable.'});
  } catch(error) {
   return reply(error instanceof PlatformError?error.status:503,{error:error instanceof PlatformError?error.message:'Service temporarily unavailable.'});
  }
 };
}
