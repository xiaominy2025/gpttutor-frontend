import {it,expect} from 'vitest';
import {emailPlatform} from '../../server/platform/release-b-app.mjs';
function store(){const m=new Map();return {get:async k=>m.get(k),create:async(k,v)=>{if(m.has(k))throw Error();m.set(k,{...v,version:1});},replace:async(k,n,v)=>{if(m.get(k)?.version!==n)return false;m.set(k,{...v,version:n+1});return true;},remove:async(k,n)=>{if(m.get(k)?.version!==n)return false;return m.delete(k);}};}
const origin='https://www.engentlabs.com';
const event=(path,body,jar='',method='POST',from=origin)=>({rawPath:'/api/platform/'+path,headers:{origin:from,'content-type':'application/json',cookie:jar},body:JSON.stringify(body),requestContext:{http:{method}}});
const cookie=r=>r.cookies[0].split(';')[0];
it('leaves Release A the default-safe fallback and new routes off',async()=>{let calls=0;const app=emailPlatform({enabled:false,fallback:async()=>{calls++;return {statusCode:299};}});expect((await app(event('session',{},'','GET'))).statusCode).toBe(299);expect((await app(event('email/start',{}))).statusCode).toBe(410);expect(calls).toBe(1);});
it('pre-auth binds code submission and prevents successful-request replay',async()=>{const calls=[],app=emailPlatform({store:store(),origin,treeOrigin:'https://decisiontree.engentlabs.com',enabled:true,now:()=>1000,fallback:async()=>({statusCode:200}),invoke:async(a,v)=>{calls.push([a,v]);return a==='start'?{email:v.email,challenge:'x'.repeat(43)}:{lease:'y'.repeat(43),sub:'fixture',expiresAt:2000};}});
 const b=await app(event('email/bootstrap',{},'','GET')),csrf=JSON.parse(b.body).csrf,jar=cookie(b);
 expect((await app(event('email/start',{email:'fixture@example.test',csrf},jar,'POST','https://evil.test'))).statusCode).toBe(403);
 expect((await app(event('email/start',{email:'fixture@example.test',csrf:'wrong'},jar))).statusCode).toBe(401);
 expect((await app(event('email/start',{email:'fixture@example.test',csrf},jar))).statusCode).toBe(200);
 const r=await app(event('email/finish',{code:'123456',csrf},jar));expect(r.statusCode).toBe(200);expect(r.body).not.toMatch(/lease|challenge|token|123456/);expect((await app(event('email/finish',{code:'123456',csrf},jar))).statusCode).toBe(401);expect(calls.filter(x=>x[0]==='finish')).toHaveLength(1);
});
it('B enabled never resurrects a legacy A cookie when its B wrapper is absent',async()=>{let legacy=0;const app=emailPlatform({enabled:true,origin,treeOrigin:'https://decisiontree.engentlabs.com',store:store(),fallback:async()=>{legacy++;return {statusCode:200,body:JSON.stringify({signedIn:true})};}});const r=await app(event('session',{},'__Host-engent-platform=old-oauth','GET'));expect(JSON.parse(r.body).signedIn).toBe(false);expect(legacy).toBe(0);expect((await app(event('login',{},'__Host-engent-platform=old-oauth','GET'))).statusCode).toBe(405);});
it('pending verified sign-in exposes no protected session or coach request before handoff activation',async()=>{let advanced=0;const app=emailPlatform({enabled:true,origin,treeOrigin:'https://decisiontree.engentlabs.com',store:store(),now:()=>1000,fallback:async()=>({statusCode:200}),invoke:async(a,v)=>{if(a==='start')return {email:v.email,challenge:'x'.repeat(43)};if(a==='finish')return {lease:'y'.repeat(43),sub:'fixture',expiresAt:2000,pending:true};if(a==='session')return {sub:'fixture',active:false,pending:true};advanced++;return {};}});const b=await app(event('email/bootstrap',{},'','GET')),csrf=JSON.parse(b.body).csrf,jar=cookie(b);await app(event('email/start',{email:'fixture@example.test',csrf},jar));const r=await app(event('email/finish',{code:'123456',csrf},jar)),authCookie=cookie(r);expect(JSON.parse(r.body)).toEqual({signedIn:false,needsHandoff:true});const state=await app(event('session',{},authCookie,'GET'));expect(JSON.parse(state.body)).toMatchObject({signedIn:false,pendingSignIn:true});expect((await app(event('email/advanced-request',{reason:'why'},authCookie))).statusCode).toBe(401);expect(advanced).toBe(0);});
it('Explore logout retains a TTL-bound retry mapping when a response is lost after commit',async()=>{
 const state=store();let revoked=false,lose=true;
 const app=emailPlatform({store:state,origin,treeOrigin:'https://tree.test',enabled:true,now:()=>1000,fallback:async()=>({statusCode:200}),invoke:async(a,v)=>{
 if(a==='start')return {email:v.email,challenge:'x'.repeat(43)};
 if(a==='finish')return {lease:'y'.repeat(43),sub:'fixture',expiresAt:2000};
 if(v.action==='read'){if(revoked)throw Object.assign(Error(),{status:401});return {active:true,sub:'fixture'};}
 revoked=true;if(lose){lose=false;throw Object.assign(Error('lost response'),{status:503});}return {ok:true,scope:'participating-browser'};
 }});
 const b=await app(event('email/bootstrap',{},'','GET')),csrf=JSON.parse(b.body).csrf,jar=cookie(b);await app(event('email/start',{email:'fixture@example.test',csrf},jar));
 const finish=await app(event('email/finish',{code:'123456',csrf},jar)),auth=cookie(finish);
 expect((await app(event('logout',{},auth))).statusCode).toBe(503);
 expect(JSON.parse((await app(event('session',{},auth,'GET'))).body).signedIn).toBe(false);
 expect(JSON.parse((await app(event('logout',{},auth))).body)).toMatchObject({ok:true,scope:'participating-browser'});
 expect(JSON.parse((await app(event('logout',{},auth))).body)).toMatchObject({ok:true,scope:'participating-browser'});
 expect(JSON.parse((await app(event('logout',{}))).body)).toMatchObject({ok:true,scope:'participating-browser'});
});
it('legacy retirement failure or abandoned pending sign-in never exposes authenticated B access',async()=>{
 for(const mode of ['retirement-timeout','wrapper-failure','abandoned']){
 const state=store(),create=state.create;let newLease=false,legacyRetired=false;
 state.create=async(k,v)=>{if(mode==='wrapper-failure'&&v.kind==='session')throw Error('storage unavailable');return create(k,v);};
 const app=emailPlatform({store:state,origin,treeOrigin:'https://tree.test',enabled:true,now:()=>1000,fallback:async()=>{legacyRetired=true;if(mode==='retirement-timeout')throw Error('lost response');return {statusCode:200};},invoke:async(a,v)=>{
 if(a==='start')return {email:v.email,challenge:'x'.repeat(43)};
 if(a==='finish'){newLease=true;return {lease:'y'.repeat(43),sub:'fixture',expiresAt:2000};}
 return {sub:'fixture',active:false,pending:true};
 }});
 const b=await app(event('email/bootstrap',{},'','GET')),csrf=JSON.parse(b.body).csrf,jar=cookie(b);await app(event('email/start',{email:'fixture@example.test',csrf},jar));
 const r=await app(event('email/finish',{code:'123456',csrf},jar+'; __Host-engent-platform=legacy'));
 expect(newLease).toBe(true);expect(legacyRetired).toBe(true);
 expect(r.statusCode).toBe(mode==='abandoned'?200:503);
 const s=await app(event('session',{},mode==='abandoned'?cookie(r):'__Host-engent-platform=legacy','GET'));
 expect(JSON.parse(s.body).signedIn).toBe(false);
 }
});
