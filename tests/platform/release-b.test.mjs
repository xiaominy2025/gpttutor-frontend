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
