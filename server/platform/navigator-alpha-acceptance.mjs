import {createHash,createHmac,randomUUID} from 'node:crypto';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-runtime.mjs';
import {navigatorControls,pilot} from './budget.mjs';
import {dynamoStore} from './store.mjs';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';

const region='us-east-1', account='771049112957';
const origin='https://d6owpirihdsus.cloudfront.net';
const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5';
const suites=['protocol','limits','master-and-outcomes'];
const input='How can I think about a capacity decision?';
const guidance='Clarify the objective before comparing alternatives.';
const objective='How can I clarify what matters most?';
const ip='192.0.2.1';

function check(condition,label) {
 if(!condition)throw Error('CHECK:'+label);
}
function status(response,expected,label) {check(response.statusCode===expected,label);}

export async function runNavigatorAcceptance(suite,{makeStore,signingSecret,readMaster}){
 if(!suites.includes(suite))throw Error('Unknown acceptance suite');
 const run=randomUUID();
 const makeScenario=(name,{readState=readMaster,timeoutMs,unknown=false}={})=>{
  const store=makeStore('NAVIGATOR#acceptance#'+run+'#'+name+'#');
  const clock=new Date();
  clock.setUTCHours(12,0,0,0);
  let time=clock.getTime(),calls=0,masterReads=0;
  const now=()=>time;
  const master=createPaidAiMasterGate({timeoutMs,readState:async options=>{masterReads++;return readState(options);}});
  const controls=navigatorControls(store,{now});
  const app=anonymousNavigator({enabled:true,origin,now,signingSecret,
   credential:async()=> 'provider-blocked-test-credential',master,controls,conversationStore:store,
   price:{model:'gpt-6-luna',input:.125,output:.5},generate:async()=>{
    calls++;
    if(unknown&&calls===2)throw Error('Synthetic unknown provider outcome');
    return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{type:'output_text',text:JSON.stringify({
     kind:'guide',reply:guidance,followUps:[{dimension:'objectives',question:objective}],exploredDimension:null
    })}]}]};
   }});
  const request=(path,body={},cookie,{sourceIp=ip,requestOrigin=origin,method='POST'}={})=>app({
   rawPath:path,headers:{origin:requestOrigin},cookies:cookie?[cookie]:[],
   requestContext:{http:{method,sourceIp}},body:JSON.stringify(body)
  });
  async function boot(cookie) {
   const result=await request(NAVIGATOR_SESSION_PATH,{},cookie);
   status(result,200,'bootstrap');
   check(JSON.parse(result.body).ready===true,'bootstrap-ready');
   return result;
  }
  async function newCookie() {
   const result=await boot();
   check(/; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=86400$/.test(result.cookies[0]),'cookie-flags');
   return result.cookies[0].split(';')[0];
  }
  const turn=(cookie,body={message:input,history:[]},options)=>request(NAVIGATOR_PATH,body,cookie,options);
  const advance=()=>{time+=60000;};
  const budgetKey=()=> 'BUDGET#'+new Date(now()).toISOString().slice(0,7);
  async function start(cookie) {
   const first=await turn(cookie);
   status(first,200,'first-turn');
   return {message:objective,dimension:'objectives',history:[{role:'user',text:input},{role:'assistant',text:guidance}],
    continuation:JSON.parse(first.body).continuation};
  }
  return {store,controls,request,boot,newCookie,turn,start,advance,budgetKey,calls:()=>calls,masterReads:()=>masterReads};
 };
 if(suite==='protocol'){
  const s=makeScenario('protocol');
  status(await s.request(NAVIGATOR_SESSION_PATH,{},null,{requestOrigin:'https://example.invalid'}),403,'wrong-origin');
  status(await s.request(NAVIGATOR_SESSION_PATH,{},null,{method:'GET'}),405,'wrong-method');
  status(await s.request('/api/platform/not-navigator'),404,'wrong-route');
  status(await s.turn(),401,'missing-cookie');
  const cookie=await s.newCookie(),other=await s.newCookie();
  check((await s.boot(cookie)).cookies.length===0,'reuse-cookie');
  const forged=cookie.replace(/\.[A-Za-z0-9_-]{43}$/,'.'+'A'.repeat(43));
  status(await s.turn(forged),401,'forged-cookie');
  const next=await s.start(cookie);
  status(await s.turn(other,next),400,'wrong-caller');
  const tampered={...next,history:[next.history[0],{role:'assistant',text:'Changed guidance'}]};
  status(await s.turn(cookie,tampered),400,'modified-history');
  let response=await s.turn(cookie,next);
  status(response,200,'round-two');
  status(await s.turn(cookie,next),409,'replay');
  const history=[...next.history,{role:'user',text:objective},{role:'assistant',text:guidance}];
  s.advance();
  for(let round=3;round<=4;round++){
   response=await s.turn(cookie,{message:input,history,continuation:JSON.parse(response.body).continuation});
   status(response,200,'round-'+round);
   history.push({role:'user',text:input},{role:'assistant',text:guidance});
  }
  const final=JSON.parse(response.body);
  check(final.done&&final.continuation===null&&final.followUps.length===0,'four-turn-closure');
  check(s.calls()===4&&s.masterReads()===4,'master-per-turn');
  check((await s.store.get(s.budgetKey())).spent===112,'known-usage-settlement');
 }
 if(suite==='limits'){
  const visitor=makeScenario('visitor');
  const cookie=await visitor.newCookie();
  for(let n=0;n<pilot.guestDaily;n++){
   if(n>0&&n%pilot.guestMinute===0){
    status(await visitor.turn(cookie),429,'per-minute-denial');
    visitor.advance();
   }
   status(await visitor.turn(cookie),200,'within-visitor-limit');
  }
  visitor.advance();
  status(await visitor.turn(cookie),429,'per-visitor-daily-denial');
  check(visitor.calls()===pilot.guestDaily,'visitor-limit-provider-block');

  const address=makeScenario('ip');
  const cutoff=Date.now();
  const secret=await signingSecret();
  const id=createHmac('sha256',secret).update(ip).digest('hex');
  const day=new Date(cutoff).toISOString().slice(0,10);
  check(await address.store.replace('IP#'+id+'#'+day,0,{daily:pilot.ipDaily}),'seed-ip-row');
  const addressCookie=await address.newCookie();
  status(await address.turn(addressCookie),429,'ip-limit');
  status(await address.turn(addressCookie,undefined,{sourceIp:'192.0.2.2'}),200,'different-ip');
  check(address.calls()===1,'ip-limit-provider-block');

  const budget=makeScenario('budget');
  check(await budget.store.replace(budget.budgetKey(),0,{spent:pilot.monthlyMicros-1,reserved:0,leases:{},alerted:100}),
   'seed-budget-row');
  status(await budget.turn(await budget.newCookie()),429,'monthly-cap');
  check(budget.calls()===0&&(await budget.store.get(budget.budgetKey())).spent===pilot.monthlyMicros-1,'budget-preserved');

  const concurrent=makeScenario('concurrency');
  const heldCookie=await concurrent.newCookie();
  const identity=heldCookie.split('=')[1].split('.')[0];
  const heldActor=createHash('sha256').update('navigator#'+identity).digest('hex');
  const first=await concurrent.controls.admit(heldActor,'synthetic-ip-1',true,900);
  status(await concurrent.turn(heldCookie),429,'visitor-concurrency');
  const second=await concurrent.controls.admit('synthetic-visitor-2','synthetic-ip-2',true,900);
  status(await concurrent.turn(await concurrent.newCookie()),429,'global-concurrency');
  check(concurrent.calls()===0,'concurrency-provider-block');
  await concurrent.controls.settle(first,0);
  await concurrent.controls.settle(second,0);
  check((await concurrent.store.get(concurrent.budgetKey())).reserved===0,'released-concurrency-reservations');
 }
 if(suite==='master-and-outcomes'){
  for(const [label,readState] of [
   ['off',async()=>({suspended:true,revision:1})],['missing',async()=>null],
   ['invalid',async()=>({suspended:false,revision:0})],['failure',async()=>{throw Error('Synthetic failure');}],
   ['timeout',()=>new Promise(()=>{})]
  ]){
   const s=makeScenario(label,{readState,timeoutMs:20});
   status(await s.turn(await s.newCookie()),503,'master-'+label);
   const budget=await s.store.get(s.budgetKey());
   check(s.calls()===0&&s.masterReads()===1&&budget.spent===0&&budget.reserved===0,'master-no-dispatch-'+label);
  }
  const s=makeScenario('unknown',{unknown:true});
  const cookie=await s.newCookie();
  const next=await s.start(cookie);
  const before=await s.store.get(s.budgetKey());
  status(await s.turn(cookie,next),503,'unknown-provider-outcome');
  const after=await s.store.get(s.budgetKey());
  check(after.spent>before.spent&&after.reserved===0,'unknown-outcome-conservative-charge');
  status(await s.turn(cookie,next),409,'unknown-outcome-replay');
  check(s.calls()===2&&s.masterReads()===2,'unknown-outcome-no-redispatch');
 }
 return {suite,passed:true,providerTransport:'absent',canonicalWrites:false};
}

export async function handlerEntry(event,context) {
 const arn='arn:aws:lambda:'+region+':'+account+':function:decisionnavigator-alpha-api';
 const directLatest=context?.functionVersion==='$LATEST'&&
  [arn,arn+':$LATEST'].includes(context.invokedFunctionArn);
 if(process.env.STAGE!=='alpha'||process.env.NAVIGATOR_ENABLED!=='false'||!directLatest||
    !event||Object.keys(event).length!==1||!suites.includes(event.suite))return {passed:false,reason:'acceptance-target-denied'};
 try {
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1}));
  const ssm=new SSMClient({region,maxAttempts:1});
  let secret;
  const signingSecret=async()=>{
   if(secret)return secret;
   const {Parameter}=await ssm.send(new GetParameterCommand({Name:'/decisionnavigator-alpha/hmac-secret',WithDecryption:true}),
    {abortSignal:AbortSignal.timeout(2500)});
   if(typeof Parameter?.Value!=='string'||Parameter.Value.length<32)throw Error('Invalid signing parameter');
   // Never mint a cookie valid for the public runtime.
   secret=createHmac('sha256',Parameter.Value).update('navigator-hosted-acceptance-v1').digest('hex');
   return secret;
  };
  const readMaster=async({signal})=>{
   const {Item}=await db.send(new GetCommand({TableName:table,Key:{pk:'AI#CONFIG',sk:'STATE'},ConsistentRead:true,
    ProjectionExpression:'#pk, #sk, #suspended, #revision',
    ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#suspended':'suspended','#revision':'revision'}}),{abortSignal:signal});
   return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
  };
  const ttl=Math.floor(Date.now()/1000)+3600;
  const makeStore=prefix=>{
   const store=dynamoStore(db,table,id=>({pk:prefix+id,sk:'STATE'}));
   return {...store,replace:(id,version,value)=>store.replace(id,version,{...value,expiresAt:ttl}),
    transaction:updates=>store.transaction(updates.map(row=>({...row,value:{...row.value,expiresAt:ttl}})))};
  };
  return await runNavigatorAcceptance(event.suite,{makeStore,signingSecret,readMaster});
 } catch(error){
  return {suite:event.suite,passed:false,reason:typeof error?.message==='string'&&/^CHECK:[a-z0-9-]+$/.test(error.message)
   ?error.message.slice(6):'acceptance-dependency-failed'};
 }
}
