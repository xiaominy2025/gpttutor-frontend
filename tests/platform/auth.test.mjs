// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {createOAuth,PlatformError,digest} from '../../server/platform/oauth.mjs';
import {navigatorControls} from '../../server/platform/budget.mjs';
import {platformApp} from '../../server/platform/app.mjs';

function memory() {
 const rows=new Map();
 return {
  async get(id){return structuredClone(rows.get(id));},
  async create(id,value){if(rows.has(id))throw Error('Conflict');rows.set(id,{...structuredClone(value),version:1});},
  async replace(id,version,value){if(rows.get(id)?.version!==version)return false;rows.set(id,{...structuredClone(value),version:version+1});return true;},
  async remove(id,version){if(version && rows.get(id)?.version!==version)return false;rows.delete(id);return true;},
  async transaction(updates){
   if(updates.some(row=>(rows.get(row.id)?.version??0)!==(row.previous?.version??0)))return false;
   updates.forEach(row=>rows.set(row.id,{...structuredClone(row.value),version:(row.previous?.version??0)+1}));return true;
  }
 };
}
it('binds OAuth state to a host cookie, validates nonce, and consumes the transaction once',async()=>{
 const store=memory();let params;
 const provider={authorize:p=>(params=p,'https://login.example/authorize'),exchange:async()=>({access_token:'access',refresh_token:'refresh',expires_in:900}),
  identity:async(_t,nonce)=>{expect(nonce).toBe(params.nonce);return {sub:'existing-sub'};},access:async()=>({sub:'existing-sub'}),
  revoke:async()=>{},logout:uri=>uri};
 const auth=createOAuth({store,provider,origin:'https://www.engentlabs.com',prefix:'/api/platform'});
 const start=await auth.login(),binding=start.cookie.split(';')[0].split('=')[1];
 expect(start.cookie).toContain('SameSite=Lax');
 expect(start.cookie).not.toContain('Domain=');
 await expect(auth.complete(new URLSearchParams({state:params.state,code:'code'}),{'__Host-engent-oauth':'wrong'})).rejects.toThrow();
 const result=await auth.complete(new URLSearchParams({state:params.state,code:'code'}),{'__Host-engent-oauth':binding});
 expect(result.cookies[1]).toContain('SameSite=Strict');
 await expect(auth.complete(new URLSearchParams({state:params.state,code:'code'}),{'__Host-engent-oauth':binding})).rejects.toThrow();
 expect((await auth.session({'__Host-engent-platform':result.id})).sub).toBe('existing-sub');
 await auth.logout({'__Host-engent-platform':result.id});
 await expect(auth.session({'__Host-engent-platform':result.id})).rejects.toThrow();
});
it('does not recreate a session when logout races token refresh',async()=>{
 const store=memory();let time=0,release;
 const wait=new Promise(resolve=>release=resolve);
 const provider={authorize:p=>'https://login',exchange:async()=>({access_token:'a',refresh_token:'r',expires_in:900}),identity:async()=>({sub:'u'}),
 access:async()=>({sub:'u'}),refresh:async()=>{await wait;return {access_token:'b',expires_in:900};},revoke:async()=>{},logout:()=>'/explore'};
 const auth=createOAuth({store,provider,origin:'https://www.engentlabs.com',prefix:'/api/platform',now:()=>time});
 const id='x'.repeat(43);
 await store.create('SESSION#'+digest(id),{sub:'u',accessToken:'a',refreshToken:'r',renewAt:1,expiresAt:9999});
 time=2;
 const refreshing=auth.session({'__Host-engent-platform':id});
 await new Promise(resolve=>setImmediate(resolve));
 await auth.logout({'__Host-engent-platform':id});
 release();
 await expect(refreshing).rejects.toThrow();
});
it('reserves atomically across concurrent requests and charges uncertain calls to their admission month',async()=>{
 const store=memory();let time=Date.parse('2026-11-30T23:59:59Z');
 const controls=navigatorControls(store,{now:()=>time});
 const calls=await Promise.allSettled(Array.from({length:10},(_,i)=>controls.admit('guest'+i,'ip'+i,true,4000000)));
 const leases=calls.filter(call=>call.status==='fulfilled').map(call=>call.value);
 expect(leases).toHaveLength(2);
 time=Date.parse('2026-12-01T00:00:01Z');
 await Promise.all(leases.map(lease=>controls.settle(lease,0,true)));
 const month=await store.get('BUDGET#2026-11');
 expect(month.spent).toBe(8000000);expect(month.reserved).toBe(0);
 expect(await store.get('BUDGET#2026-12')).toBeUndefined();
 await controls.settle(leases[0],0,true);
 expect((await store.get('BUDGET#2026-11')).spent).toBe(8000000);
});
it('enforces guest daily and IP allowances and conservatively retains crashed reservations',async()=>{
 const store=memory();let time=Date.parse('2026-11-18T12:00:00Z');const controls=navigatorControls(store,{now:()=>time});
 for(let i=0;i<20;i++) {const lease=await controls.admit('one','ip',true,100);await controls.settle(lease,10);time+=61000;}
 await expect(controls.admit('one','ip',true,100)).rejects.toThrow();
 for(let i=0;i<80;i++){const lease=await controls.admit('other'+i,'ip',true,100);await controls.settle(lease,10);time+=61000;}
 await expect(controls.admit('another','ip',true,100)).rejects.toThrow();
});
it('denies foreign origins and suspended accounts before paid generation',async()=>{
 let generated=0;
 const app=platformApp({enabled:true,navigator:true,origin:'https://www.engentlabs.com',
 oauth:{session:async()=>({sub:'u',token:'t'})},entitlements:async()=>({sub:'u',enabled:false}),generate:()=>generated++});
 const event={rawPath:'/api/platform/navigator',headers:{origin:'https://evil.example'},requestContext:{http:{method:'POST'}}};
 expect((await app(event)).statusCode).toBe(401);
 event.headers.origin='https://www.engentlabs.com';
 expect((await app(event)).statusCode).toBe(401);expect(generated).toBe(0);
});
it('fails closed on state storage failures',async()=>{
 const controls=navigatorControls({get:async()=>{throw new PlatformError(503,'Storage unavailable.');}});
 await expect(controls.admit('a','ip',true,100)).rejects.toThrow();
});
