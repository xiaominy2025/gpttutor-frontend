import {createHash, randomBytes} from 'node:crypto';

export const digest = value => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
export class PlatformError extends Error {
 constructor(status, message) { super(message); this.status = status; }
}
export const denied = () => new PlatformError(401, 'Sign in again to continue.');
export const cookie = (name, value, seconds, sameSite = 'Strict') =>
 `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=${sameSite}; Max-Age=${seconds}`;

export function createOAuth({store, provider, origin, prefix, logoutPath = '/explore', sessionName = '__Host-engent-platform', transactionName = '__Host-engent-oauth', now = () => Math.floor(Date.now()/1000)}) {
 const transactionCookie = transactionName;
 const sessionCookie = sessionName;
 const key = id => 'SESSION#'+digest(id);
 const callback = origin+prefix+'/callback';
 async function login() {
  const state=random(), nonce=random(), verifier=random(), binding=random();
  await store.create('OAUTH#'+digest(state), {binding:digest(binding),nonce,verifier,expiresAt:now()+300});
  const url=provider.authorize({state,nonce,challenge:createHash('sha256').update(verifier).digest('base64url'),callback});
  return {url,cookie:cookie(transactionCookie,binding,300,'Lax')};
 }
 async function complete(query, cookies) {
  const state=query.get('state'), code=query.get('code');
  if (!state || !code || !cookies[transactionCookie]) throw denied();
  const transaction=await store.get('OAUTH#'+digest(state));
  if (!transaction || transaction.expiresAt<=now() || transaction.binding!==digest(cookies[transactionCookie])) throw denied();
  if (!await store.remove('OAUTH#'+digest(state),transaction.version)) throw denied();
  const tokens=await provider.exchange({code,verifier:transaction.verifier,callback});
  const principal=await provider.identity(tokens,transaction.nonce);
  if (!tokens.refresh_token) throw new PlatformError(503,'Sign-in could not be completed.');
  const id=random();
  await store.create(key(id),{sub:principal.sub,accessToken:tokens.access_token,refreshToken:tokens.refresh_token,
   renewAt:now()+tokens.expires_in-60,expiresAt:now()+30*86400});
  return {id,principal,tokens,cookies:[cookie(transactionCookie,'',0,'Lax'),cookie(sessionCookie,id,30*86400)]};
 }
 async function session(cookies) {
  const id=cookies[sessionCookie];
  if (!id) return null;
  const address=key(id);
  let current=await store.get(address);
  if (!current || current.expiresAt<=now()) throw denied();
  if (current.renewAt<=now()) {
   const tokens=await provider.refresh(current.refreshToken);
   const identity=await provider.access(tokens.access_token);
   if (identity.sub!==current.sub) throw denied();
   const updated={...current,accessToken:tokens.access_token,refreshToken:tokens.refresh_token??current.refreshToken,
    renewAt:now()+tokens.expires_in-60};
   if (await store.replace(address,current.version,updated)) current=updated;
   else {
    const latest=await store.get(address);
    if(!latest||latest.expiresAt<=now())throw denied();
    current=latest;
   }
  }
  const principal=await provider.access(current.accessToken);
  if (principal.sub!==current.sub || current.expiresAt<=now()) throw denied();
  // Re-read so a concurrent logout cannot restore or continue a revoked session.
  if (!await store.get(address)) throw denied();
  return {id,sub:current.sub,token:current.accessToken};
 }
 async function logout(cookies) {
  const id=cookies[sessionCookie];
  if (id) {
   const current=await store.get(key(id));
   if (current) {
    await store.remove(key(id)); // Local revocation must succeed before claiming sign-out.
    try { await provider.revoke(current.refreshToken); }
    catch { /* Local session is revoked even during a provider outage. */ }
   }
  }
  return {url:provider.logout(origin+logoutPath),cookie:cookie(sessionCookie,'',0)};
 }
 return {login,complete,session,logout};
}
