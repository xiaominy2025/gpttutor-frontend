import {describe,expect,it,vi} from 'vitest';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from '../../server/platform/navigator-runtime.mjs';
import {createPaidAiMasterGate} from '../../server/shared/paid-ai-master.mjs';
import {dynamoStore} from '../../server/platform/store.mjs';
import {handlerEntry} from '../../server/platform/navigator-alpha-entry.mjs';

const origin='https://d6owpirihdsus.cloudfront.net';
const message='How should I think about expanding capacity?';
function fixture({readState=async()=>({suspended:false,revision:9}),timeoutMs,enabled=true}={}) {
 const claims=new Set();
 const controls={admit:vi.fn(async()=>({reservation:900})),settle:vi.fn(async()=>{})};
 const read=vi.fn(readState);
 const signingSecret=vi.fn(async()=>'fixture-secret-for-navigator-testing');
 const credential=vi.fn(async()=>'fixture-model-key');
 const generate=vi.fn(async()=>({
  usage:{input_tokens:100,output_tokens:30},
  output:[{content:[{type:'output_text',text:JSON.stringify({
   kind:'guide',reply:'Clarify what adding capacity would accomplish.',
   followUps:[{dimension:'objectives',question:'How can I clarify my goals?'}],exploredDimension:null
  })}]}]
 }));
 const conversationStore={
  replace:vi.fn(async id=>{if(claims.has(id))return false;claims.add(id);return true;}),
  remove:vi.fn(async id=>claims.delete(id))
 };
 const app=anonymousNavigator({origin,enabled,signingSecret,credential,controls,generate,conversationStore,
  master:createPaidAiMasterGate({readState:read,timeoutMs}),price:{model:'gpt-6-luna',input:.125,output:.5}});
 const request=async(path,body,cookies=[],headers={origin})=>{
  const response=await app({rawPath:path,headers,cookies,requestContext:{http:{method:'POST',sourceIp:'192.0.2.1'}},body:JSON.stringify(body)});
  return {...response,json:JSON.parse(response.body)};
 };
 const bootstrap=async(cookies)=>request(NAVIGATOR_SESSION_PATH,{},cookies);
 const turn=(cookie,input={message,history:[]})=>request(NAVIGATOR_PATH,input,cookie?[cookie]:[]);
 return {request,bootstrap,turn,read,credential,signingSecret,generate,controls,conversationStore};
}
const cookieValue=response=>response.cookies[0].split(';')[0];

describe('standalone anonymous Navigator',()=>{
 it('issues and reuses a scoped cookie without account, budget, or provider access',async()=>{
  const f=fixture();
  const first=await f.bootstrap(['__Host-engent-email=irrelevant']);
  expect(first).toMatchObject({statusCode:200,json:{ready:true}});
  expect(first.cookies[0]).toMatch(/__Host-engent-navigator=.*Path=\/;.*Secure;.*HttpOnly/);
  expect(await f.bootstrap([cookieValue(first)])).toMatchObject({statusCode:200,cookies:[]});
  expect(f.credential).not.toHaveBeenCalled();
  expect(f.read).not.toHaveBeenCalled();
  expect(f.controls.admit).not.toHaveBeenCalled();
  expect(f.generate).not.toHaveBeenCalled();
  expect((await f.request(NAVIGATOR_SESSION_PATH,{},[],{origin:'https://unrelated.example'})).statusCode).toBe(403);
 });
 it('requires the Navigator cookie and rejects forged values and foreign continuations',async()=>{
  const f=fixture();
  expect((await f.turn()).statusCode).toBe(401);
  const firstCookie=cookieValue(await f.bootstrap());
  const secondCookie=cookieValue(await f.bootstrap());
  const forged=firstCookie.replace(/\.[A-Za-z0-9_-]{43}$/,'.'+'A'.repeat(43));
  expect((await f.turn(forged)).statusCode).toBe(401);
  const first=await f.turn(firstCookie);
  const history=[{role:'user',text:message},{role:'assistant',text:first.json.reply}];
  expect((await f.turn(secondCookie,{message,history,continuation:first.json.continuation})).statusCode).toBe(400);
  expect(f.generate).toHaveBeenCalledTimes(1);
  expect(f.controls.admit.mock.calls[0][2]).toBe(true);
 });
 it('keeps the four-turn protocol, follow-up integrity and replay protection',async()=>{
  const f=fixture();
  const cookie=cookieValue(await f.bootstrap());
  const history=[];
  let continuation;
  for(let i=0;i<4;i++){
   const pick=i===1?{message:'How can I clarify my goals?',dimension:'objectives'}:{message};
   const input={history,continuation,...pick};
   const turn=await f.turn(cookie,input);
   expect(turn.statusCode).toBe(200);
   if(i===1) expect((await f.turn(cookie,input)).statusCode).toBe(409);
   history.push({role:'user',text:pick.message},{role:'assistant',text:turn.json.reply});
   continuation=turn.json.continuation;
   expect(turn.json.done).toBe(i===3);
  }
  expect(continuation).toBeNull();
  expect(f.generate).toHaveBeenCalledTimes(4);
  expect(f.read).toHaveBeenCalledTimes(4);
  expect(f.controls.settle.mock.calls.every(([,cost])=>cost===28)).toBe(true);
  const reservations=f.generate.mock.calls.map(([,request],index)=>{
   expect(request).toMatchObject({model:'gpt-6-luna',service_tier:'default',max_output_tokens:1500,store:false});
   const bytes=Buffer.byteLength(JSON.stringify(request),'utf8');
   expect(bytes).toBeLessThanOrEqual(12000);
   const reserved=f.controls.admit.mock.calls[index][3];
   expect(reserved).toBe(Math.ceil((bytes+1024)*.125+1500*.50));
   return reserved;
  });
  expect(reservations.reduce((sum,value)=>sum+value,0)).toBeLessThanOrEqual(9512);
 });
 it.each([
  ['paused',async()=>({suspended:true,revision:9}),undefined],
  ['missing',async()=>undefined,undefined],
  ['malformed',async()=>({suspended:false,revision:0}),undefined],
  ['read exception',async()=>{throw Error('read failure');},undefined],
  ['timed out',()=>new Promise(()=>{}),5]
 ])('fails closed on a %s master and settles known zero provider spend',async(_label,readState,timeoutMs)=>{
  const f=fixture({readState,timeoutMs});
  const cookie=cookieValue(await f.bootstrap());
  expect((await f.turn(cookie)).statusCode).toBe(503);
  expect(f.generate).not.toHaveBeenCalled();
  expect(f.controls.settle).toHaveBeenCalledWith({reservation:900},0);
 });
 it('keeps the Alpha entry default off and rejects the wrong API Gateway route',async()=>{
  vi.stubEnv('STAGE','alpha');
  vi.stubEnv('NAVIGATOR_ENABLED','false');
  const event={rawPath:NAVIGATOR_PATH,routeKey:'POST '+NAVIGATOR_PATH,requestContext:{apiId:'8qmgd1ghdi',stage:'$default'}};
  try {
   expect((await handlerEntry(event)).statusCode).toBe(503);
   vi.stubEnv('NAVIGATOR_ENABLED','true');
   expect((await handlerEntry({...event,routeKey:'ANY /api/platform/{proxy+}'})).statusCode).toBe(503);
   vi.stubEnv('STAGE','prod');
   expect((await handlerEntry(event)).statusCode).toBe(503);
  } finally {vi.unstubAllEnvs();}
 });
});

it('uses the composite key for reads, replay claims and transactional accounting',async()=>{
 const db={send:vi.fn(async()=>({}))};
 const store=dynamoStore(db,'fixture-table',id=>({pk:'NAVIGATOR#'+id,sk:'STATE'}));
 await store.get('BUDGET#2026-11');
 await store.replace('TURN#hash',0,{expiresAt:1700000000});
 await store.transaction([{id:'BUDGET#2026-11',value:{reserved:900}}]);
 await store.remove('TURN#hash',1);
 const commands=db.send.mock.calls.map(([command])=>command.input);
 expect(commands[0].Key).toEqual({pk:'NAVIGATOR#BUDGET#2026-11',sk:'STATE'});
 expect(commands[1].Item).toMatchObject({pk:'NAVIGATOR#TURN#hash',sk:'STATE',expiresAt:1700000000,version:1});
 expect(commands[2].TransactItems[0].Put.Item).toMatchObject({pk:'NAVIGATOR#BUDGET#2026-11',sk:'STATE',reserved:900});
 expect(commands[3].Key).toEqual({pk:'NAVIGATOR#TURN#hash',sk:'STATE'});
});

describe('anonymous continuation dispatch boundary',()=>{
 async function followUp() {
  const f=fixture();
  const cookie=cookieValue(await f.bootstrap());
  const first=await f.turn(cookie);
  expect(first.statusCode).toBe(200);
  return {f,cookie,input:{message,continuation:first.json.continuation,
   history:[{role:'user',text:message},{role:'assistant',text:first.json.reply}]}};
 }
 it.each([
  ['unknown provider outcome',f=>f.generate.mockRejectedValueOnce(Error('provider transport failed')),true],
  ['invalid response',f=>f.generate.mockResolvedValueOnce({
   usage:{input_tokens:100,output_tokens:30},
   output:[{content:[{type:'output_text',text:'invalid JSON'}]}]
  }),false],
  ['unverifiable usage',f=>f.generate.mockResolvedValueOnce({output:[]}),true],
  ['post-dispatch accounting failure',f=>f.controls.settle.mockRejectedValueOnce(Error('write failed')),false],
 ])('keeps the signed turn consumed after %s',async(_label,fail,uncertain)=>{
  const {f,cookie,input}=await followUp();
  fail(f);
  expect((await f.turn(cookie,input)).statusCode).toBe(503);
  expect(f.controls.settle.mock.calls.at(-1)).toEqual(uncertain?[{reservation:900},0,true]:[{reservation:900},28]);
  expect((await f.turn(cookie,input)).statusCode).toBe(409);
  expect(f.generate).toHaveBeenCalledTimes(2);
  expect(f.conversationStore.remove).not.toHaveBeenCalled();
 });
 it.each([
  ['credential',f=>f.credential.mockRejectedValueOnce(Error('credential unavailable'))],
  ['budget admission',f=>f.controls.admit.mockRejectedValueOnce(Error('admission denied'))],
  ['master paused',f=>f.read.mockResolvedValueOnce({suspended:true,revision:10})],
 ])('permits a retry after a pre-dispatch %s denial',async(_label,deny)=>{
  const {f,cookie,input}=await followUp();
  deny(f);
  expect((await f.turn(cookie,input)).statusCode).toBe(503);
  expect(f.generate).toHaveBeenCalledTimes(1);
  expect(f.conversationStore.remove).toHaveBeenCalledTimes(1);
  expect((await f.turn(cookie,input)).statusCode).toBe(200);
  expect(f.generate).toHaveBeenCalledTimes(2);
 });
});

it('reserves against UTF-8 bytes rather than JavaScript character count',async()=>{
 const f=fixture();
 const cookie=cookieValue(await f.bootstrap());
 expect((await f.turn(cookie,{message:'決定'.repeat(900),history:[]})).statusCode).toBe(200);
 const request=JSON.stringify(f.generate.mock.calls[0][1]);
 const bytes=Buffer.byteLength(request,'utf8');
 expect(bytes).toBeGreaterThan(request.length);
 expect(f.controls.admit.mock.calls[0][3]).toBe(Math.ceil((bytes+1024)*.125+1500*.50));
});
