import {it,expect,vi} from 'vitest';
import {authOnlyApp} from '../../server/platform/app-auth-only.mjs';
const origin='https://www.engentlabs.com',treeOrigin='https://decisiontree.engentlabs.com';
const event=(method,path,extra={})=>({requestContext:{http:{method}},rawPath:'/api/platform/'+path,headers:{origin},...extra});
it('uses verified entitlements for shared launch and rejects identity mismatches',async()=>{
 const oauth={session:async()=>({sub:'fixture',token:'fixture-token'})};
 const entitlements=vi.fn(async()=>({sub:'fixture',enabled:true,treeAdvanced:true}));
 const app=authOnlyApp({oauth,entitlements,origin,treeOrigin,enabled:true});
 const result=await app(event('GET','session'));
 expect(result.statusCode).toBe(200);expect(JSON.parse(result.body)).toMatchObject({signedIn:true,navigator:false,entitlements:{tree:{advanced:true}},treeLoginUrl:treeOrigin+'/api/shared/login'});
 entitlements.mockResolvedValueOnce({sub:'different',enabled:true,treeAdvanced:true});
 expect((await app(event('GET','session'))).statusCode).toBe(401);
});
it('has no AI path and enforces disabled-first and exact-origin logout',async()=>{
 const oauth={session:async()=>null,logout:vi.fn(async()=>({url:'fixture',cookie:'fixture'}))};
 const app=authOnlyApp({oauth,entitlements:vi.fn(),origin,treeOrigin,enabled:true});
 expect((await app(event('POST','navigator'))).statusCode).toBe(410);
 expect((await app(event('POST','logout',{headers:{origin:'https://foreign.example.test'}}))).statusCode).toBe(401);
 expect(oauth.logout).not.toHaveBeenCalled();
 expect((await authOnlyApp({oauth,origin,treeOrigin})(event('GET','login'))).statusCode).toBe(410);
});
it('consumes callbacks through OAuth verification and provides a safe failure',async()=>{
 const oauth={complete:vi.fn(async()=>{throw Error('private-token');}),session:async()=>null};
 const response=await authOnlyApp({oauth,origin,treeOrigin,enabled:true})(event('GET','callback',{rawQueryString:'code=fixture&state=fixture'}));
 expect(response.statusCode).toBe(503);expect(response.body).not.toContain('private-token');expect(response.headers['Cache-Control']).toBe('no-store');
});
it('keeps no-store and no-referrer headers on OAuth redirects',async()=>{const app=authOnlyApp({enabled:true,origin,treeOrigin,oauth:{login:async()=>({url:'https://fixture-login.example.test/',cookie:'fixture-cookie'})}});const r=await app(event('GET','login'));expect(r.statusCode).toBe(303);expect(r.headers['Cache-Control']).toBe('no-store');expect(r.headers['Referrer-Policy']).toBe('no-referrer');expect(r.headers['X-Content-Type-Options']).toBe('nosniff');});
