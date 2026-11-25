import {it,expect,vi} from 'vitest';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from '../../server/platform/navigator-quota-runtime.mjs';
import {createAiLightEntry} from '../../server/platform/ai-light-entry.mjs';
const origin='https://d6owpirihdsus.cloudfront.net';
function fixture({aiEnabled=true}={}){
 const claims=new Set();let on=true,brokenFinish=false,ambiguous=false;
 const controls={acquire:vi.fn(async()=>({id:'fixture'})),finish:vi.fn(async()=>{if(brokenFinish)throw Error('lostACK');})};
 const generate=vi.fn(async()=>{if(ambiguous)throw Error('timeout');return{output:[{content:[{type:'output_text',text:JSON.stringify({kind:'guide',reply:'Clarify what this decision should accomplish.',followUps:[{dimension:'objectives',question:'How can I clarify objectives?'}]})}]}]};});
 const app=anonymousNavigator({origin,enabled:true,aiEnabled,signingSecret:async()=>'fixture-secret-for-quota-session-123',credential:async()=>'fixture-server-key',controls,generate,
  conversationStore:{replace:async id=>{if(claims.has(id))return false;claims.add(id);return true;},remove:async id=>claims.delete(id)},master:{assertEnabled:async()=>{if(!on)throw Error('masterOFF');}}});
 const request=async(path,body,cookies=[],headers={origin})=>{const r=await app({rawPath:path,headers,cookies,requestContext:{http:{method:'POST',sourceIp:'192.0.2.1'}},body:JSON.stringify(body)});return{...r,json:JSON.parse(r.body)};};
 const cookie=async()=>(await request(NAVIGATOR_SESSION_PATH,{})).cookies[0].split(';')[0];
 const turn=(c,x={message:'How should I think about capacity?',history:[]})=>request(NAVIGATOR_PATH,x,[c]);
 return{request,cookie,turn,controls,generate,off:()=>on=false,breakFinish:()=>brokenFinish=true,ambiguous:()=>ambiguous=true};
}
it('returns valid coaching without prices, monetary controls or required usage telemetry',async()=>{
 const f=fixture(),r=await f.turn(await f.cookie());expect(r.statusCode).toBe(200);expect(r.json.continuation).toBeTypeOf('string');expect(f.controls.acquire).toHaveBeenCalledOnce();expect(f.controls.finish).toHaveBeenCalledOnce();expect(f.generate).toHaveBeenCalledOnce();
});
it('refuses duplicate/foreign proof and masterOFF before provider dispatch',async()=>{
 const f=fixture(),c=await f.cookie();expect((await f.request(NAVIGATOR_PATH,{message:'x',history:[]},[c,c])).statusCode).toBe(401);
 expect((await f.request(NAVIGATOR_PATH,{},[c],{origin:'https://evil.example'})).statusCode).toBe(403);f.off();expect((await f.turn(c)).statusCode).toBe(503);expect(f.generate).not.toHaveBeenCalled();
});
it('does not reject a valid reply on a completion ACK failure, retaining a bounded lock',async()=>{
 const f=fixture();f.breakFinish();expect((await f.turn(await f.cookie())).statusCode).toBe(200);expect(f.generate).toHaveBeenCalledOnce();
});
it('never retries ambiguous provider outcomes or releases their concurrency early',async()=>{
 const f=fixture();f.ambiguous();expect((await f.turn(await f.cookie())).statusCode).toBe(503);expect(f.generate).toHaveBeenCalledOnce();expect(f.controls.finish).not.toHaveBeenCalled();
});
it('preserves signed continuation and one-shot follow-up replay protection',async()=>{
 const f=fixture(),c=await f.cookie(),r=await f.turn(c),x={message:'How can I clarify objectives?',dimension:'objectives',history:[{role:'user',text:'How should I think about capacity?'},{role:'assistant',text:r.json.reply}],continuation:r.json.continuation};
 expect((await f.turn(c,x)).statusCode).toBe(200);expect((await f.turn(c,x)).statusCode).toBe(409);expect(f.generate).toHaveBeenCalledTimes(2);
});
it('entry rejects wrong environment and gateway before constructing any dependency',async()=>{
 vi.stubEnv('STAGE','alpha');vi.stubEnv('NAVIGATOR_ENABLED','true');const e={rawPath:NAVIGATOR_PATH,routeKey:'POST '+NAVIGATOR_PATH,requestContext:{apiId:'eoszayfkqd',stage:'$default',http:{method:'POST'}}};expect((await createAiLightEntry('alpha')(e)).statusCode).toBe(503);expect((await createAiLightEntry('prod')(e)).statusCode).toBe(503);vi.unstubAllEnvs();
});
it('Navigator-only AI OFF retains Guest proof bootstrap for Scenario without model dispatch',async()=>{
 const f=fixture({aiEnabled:false}),c=await f.cookie();expect(c).toContain('__Host-engent-navigator=');expect((await f.turn(c)).statusCode).toBe(503);expect(f.generate).not.toHaveBeenCalled();expect(f.controls.acquire).not.toHaveBeenCalled();
});
