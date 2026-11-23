import {createHash,randomBytes} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex'),random=()=>randomBytes(32).toString('base64url'),opaque=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const cookie=(n,v,t)=>n+'='+v+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+t;
const sessionName='__Host-engent-email',txName='__Host-engent-email-tx';
const error=(status=401)=>Object.assign(Error('Email sign-in unavailable.'),{status});
const response=(statusCode,body,cookies=[])=>({statusCode,cookies,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'},body:JSON.stringify(body)});
function cookies(e){const a=(e.cookies??[e.headers?.cookie??'']).join(';').split(';').map(x=>x.trim()).filter(Boolean).map(x=>x.split('='));if(a.some(x=>x.length!==2)||new Set(a.map(x=>x[0])).size!==a.length)throw error();return Object.fromEntries(a);}
function body(e,fields,form=false){const raw=e.isBase64Encoded?Buffer.from(e.body??'','base64').toString():e.body??'';if(Buffer.byteLength(raw)>8192)throw error(413);if(e.headers?.['content-type']?.split(';')[0]!== (form?'application/x-www-form-urlencoded':'application/json'))throw error(400);let v;try{if(form){const a=[...new URLSearchParams(raw)];if(new Set(a.map(x=>x[0])).size!==a.length)throw Error();v=Object.fromEntries(a);}else v=JSON.parse(raw);}catch{throw error(400);}if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!==[...fields].sort().join(','))throw error(400);return v;}
function form(url,data){const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),nonce=random();return {statusCode:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'strict-origin','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; form-action 'self' ${new URL(url).origin}; base-uri 'none'; frame-ancestors 'none'`},body:`<!doctype html><title>Continuing sign-in</title><form method="post" action="${esc(url)}">${Object.entries(data).map(([k,v])=>`<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}<button>Continue</button></form><script nonce="${nonce}">document.forms[0].submit()</script>`};}
export function emailPlatform({store,invoke,origin,treeOrigin,fallback,enabled=false,processEnabled=false,now=()=>Math.floor(Date.now()/1000)}){
 const key=id=>'EMAIL#'+hash(id);
 return async e=>{const p=e.rawPath??'',method=e.requestContext?.http?.method,isNew=p.startsWith('/api/platform/email/');
 if(!enabled)return isNew?response(410,{}):fallback(e);
 try{
 const c=cookies(e),sid=c[sessionName];
 // Original A is reachable only with the B feature OFF.
 // B enabled never falls through to a legacy OAuth session, even after B cookies are cleared.
 if(!isNew&&!sid&&p==='/api/platform/session'&&method==='GET')return response(200,{signedIn:false});
 const wrapper=opaque(sid)?await store.get(key(sid)):null;
 const live=wrapper&&wrapper.expiresAt>now()?wrapper:null;
 const session=async(allowPending=false)=>{if(!live||live.kind!=='session')throw error();const a=await invoke('session',{lease:live.lease,action:'read'});if(a.active!==true&&!(allowPending&&a.pending===true))throw error();return a;};
 if(p==='/api/platform/email/bootstrap'&&method==='GET'){
  const intent=e.queryStringParameters?.return;
  if(intent!==undefined&&(!processEnabled||intent!=='process'||!['https://d6owpirihdsus.cloudfront.net','https://www.engentlabs.com'].includes(origin)))throw error(400);
  const id=random(),csrf=random();await store.create(key(id),{csrf,expiresAt:now()+600,kind:'preauth',...(intent==='process'?{processReturnUntil:now()+600}:{})});return response(200,{csrf},[cookie(txName,id,600)]);
 }
 const fromTree=p==='/api/platform/email/authorize';
 if(method!=='POST'&&p!=='/api/platform/session')throw error(405);
 if(method==='POST'&&e.headers?.origin!==(fromTree?treeOrigin:origin))throw error(403);
 if(p==='/api/platform/email/start'){
  const v=body(e,['email','csrf']),id=c[txName],t=opaque(id)?await store.get(key(id)):null;
  if(!t||t.kind!=='preauth'||t.expiresAt<=now()||!opaque(v.csrf)||v.csrf!==t.csrf||t.started)throw error();
  // Consume the pre-auth transition before sending mail; retries require an explicit new bootstrap.
  if(!await store.replace(key(id),t.version,{...t,started:true}))throw error();
  const result=await invoke('start',{email:v.email});
  const current=await store.get(key(id));if(!current||!await store.replace(key(id),current.version,{...current,email:result.email,challenge:result.challenge}))throw error();
  return response(200,{codeSent:true});
 }
 if(p==='/api/platform/email/finish'){
  const v=body(e,['code','csrf']),id=c[txName],t=opaque(id)?await store.get(key(id)):null;
  if(!t?.challenge||t.expiresAt<=now()||v.csrf!==t.csrf||!opaque(v.csrf)||! /^\d{6,8}$/.test(v.code))throw error();
  if(!await store.remove(key(id),t.version))throw error();
  const result=await invoke('finish',{email:t.email,challenge:t.challenge,code:v.code});if(!opaque(result.lease)||!result.sub||!Number.isSafeInteger(result.expiresAt)||result.expiresAt<=now())throw error(503);
  if(c['__Host-engent-platform']){const retired=await fallback({...e,rawPath:'/api/platform/logout',body:'{}'});if(retired.statusCode!==200)throw error(503);}
  const id2=random();await store.create(key(id2),{kind:'session',lease:result.lease,sub:result.sub,expiresAt:result.expiresAt,...(processEnabled&&t.processReturnUntil>now()?{processReturnUntil:t.processReturnUntil}:{})});
  return response(200,{signedIn:false,needsHandoff:true},[cookie(sessionName,id2,result.expiresAt-now()),cookie(txName,'',0),cookie('__Host-engent-platform','',0)]);
 }
 if(p==='/api/platform/session'&&method==='GET'){
  let a;try{a=await session(true);}catch(err){if(err.status!==401&&err.status!==403)throw err;return response(200,{signedIn:false},[cookie(sessionName,'',0)]);}
  if(a.sub!==live.sub)throw error();if(a.pending)return response(200,{signedIn:false,pendingSignIn:true,role:'guest'});return response(200,{signedIn:true,role:'student',emailBridge:true,entitlements:{tree:{advanced:a.advanced===true,requestStatus:a.requestStatus}},treeLaunchUrl:treeOrigin+'/api/shared/email/login',...(processEnabled&&live.processReturnUntil>now()?{processReturnAvailable:true}:{})});
 }
 if(p==='/api/platform/email/return'){
  if(!processEnabled||!['https://d6owpirihdsus.cloudfront.net','https://www.engentlabs.com'].includes(origin))throw error(410);
  body(e,[]);const a=await session();if(a.sub!==live.sub||!(live.processReturnUntil>now()))throw error();
  const {processReturnUntil,...rest}=live;
  if(!await store.replace(key(sid),live.version,rest))throw error(409);
  return response(200,{destination:'/process/'});
 }
 if(p==='/api/platform/email/authorize'){
  const v=body(e,['state','challenge'],true),a=await session(true);if(a.sub!==live.sub)throw error();
  const result=await invoke('handoff',{lease:live.lease,...v});if(!opaque(result.state)||!opaque(result.code))throw error(503);return form(treeOrigin+'/api/shared/email/callback',result);
 }
 if(p==='/api/platform/email/advanced-request'){
  const v=body(e,['reason']);const a=await session();if(a.sub!==live.sub)throw error();return response(200,await invoke('advanced-request',{lease:live.lease,reason:v.reason}));
 }
 if(p==='/api/platform/logout'||p==='/api/platform/email/cancel'){
  body(e,[]);let scope=p.endsWith('/cancel')?'pending-signin-cancelled':'participating-browser';if(live){const result=await invoke('session',{lease:live.lease,action:p.endsWith('/cancel')?'cancel':'logout'});scope=result.scope;/* Keep the TTL-bound wrapper mapping for retry after a lost response. Root/lease revocation prevents reuse; cookie is cleared below. */}return response(200,{ok:true,scope},[cookie(sessionName,'',0),cookie('__Host-engent-platform','',0)]);
 }
 return response(404,{});
 }catch(err){if(p==='/api/platform/email/authorize')return {statusCode:err.status===503?503:401,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"},body:'<!doctype html><title>Engent Labs sign-in</title><h1>Sign-in could not finish</h1><p>The secure browser confirmation expired or is unavailable. Return to Engent Labs to finish sign-in or explicitly request a new code. No new code has been sent automatically.</p><a href="/explore?entry=email">Return to Engent Labs</a>'};return response([400,401,403,409,410,413,429,503,405].includes(err.status)?err.status:503,{error:err.status===429?'Too many attempts. Try again later.':err.status===409?'Account conflict. Sign out of the other account before retrying.':'Email sign-in unavailable.'});}
 };
}
