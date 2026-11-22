import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';
import {randomBytes} from 'node:crypto';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-runtime.mjs';

// Reads the real master through the same gate as Navigator, with no provider or write path.
export async function checkMaster(readState){
 let observed;
 const gate=createPaidAiMasterGate({readState:async options=>{
  const state=await readState(options);
  if(typeof state?.suspended==='boolean'&&Number.isSafeInteger(state?.revision))observed={suspended:state.suspended,revision:state.revision};
  return state;
 }});
 try{await gate.assertEnabled();return {allowed:true,observed,providerTransport:'absent',writes:0};}
 catch{return {allowed:false,...(observed?{observed}:{}),providerTransport:'absent',writes:0};}
}
// Actual core admission path, real master reader, memory-only controls and provider stub.
// No SSM, model transport, DynamoDB write, real cookie or canonical budget admission.
export async function checkMasterAdmission(readState){
 let observed,providerStubCalls=0,syntheticAdmissions=0,syntheticSettlements=0;
 const master=createPaidAiMasterGate({readState:async options=>{
  const state=await readState(options);
  if(typeof state?.suspended==='boolean'&&Number.isSafeInteger(state?.revision))observed={suspended:state.suspended,revision:state.revision};
  return state;
 }});
 const origin='https://d6owpirihdsus.cloudfront.net',secret=randomBytes(32).toString('hex');
 const app=anonymousNavigator({origin,enabled:true,signingSecret:async()=>secret,
  credential:async()=> 'synthetic-not-a-provider-key',master,
  controls:{admit:async()=>{syntheticAdmissions++;return {};},settle:async()=>{syntheticSettlements++;}},
  conversationStore:{replace:async()=>{throw Error('Continuation not allowed');},remove:async()=>{throw Error('Continuation not allowed');}},
  price:{model:'gpt-6-luna',input:.125,output:.5},generate:async()=>{
   providerStubCalls++;
   return {usage:{input_tokens:1,output_tokens:1},output:[{content:[{type:'output_text',text:JSON.stringify({kind:'guide',reply:'Clarify the objective before comparing alternatives.',followUps:[],exploredDimension:null})}]}]};
  }});
 const event=(path,body,cookie)=>({rawPath:path,headers:{origin},cookies:cookie?[cookie]:[],body:JSON.stringify(body),requestContext:{http:{method:'POST',sourceIp:'192.0.2.1'}}});
 const bootstrap=await app(event(NAVIGATOR_SESSION_PATH,{}));
 if(bootstrap.statusCode!==200||bootstrap.cookies?.length!==1)throw Error('Synthetic bootstrap failed');
 const result=await app(event(NAVIGATOR_PATH,{message:'How can I structure a decision?',history:[]},bootstrap.cookies[0].split(';')[0]));
 return {observed,status:result.statusCode,providerStubCalls,syntheticAdmissions,syntheticSettlements,providerTransport:'absent',realWrites:0,paidCalls:0};
}
export async function handlerEntry(event,context){
 const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api';
 if(context?.functionVersion!=='$LATEST'||![arn,arn+':$LATEST'].includes(context.invokedFunctionArn)||
  process.env.STAGE!=='alpha'||process.env.NAVIGATOR_ENABLED!=='false'||
  !['check-master','check-master-admission'].includes(event?.operation)||
  (event.operation==='check-master'?Object.keys(event).length!==1:
   Object.keys(event).length!==3||typeof event.expectedSuspended!=='boolean'||!Number.isSafeInteger(event.expectedRevision)||event.expectedRevision<1))
  return {allowed:false,reason:'invalid-target'};
 const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1',maxAttempts:1}));
 const readState=async({signal})=>{
  const {Item}=await db.send(new GetCommand({TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',
   Key:{pk:'AI#CONFIG',sk:'STATE'},ConsistentRead:true,ProjectionExpression:'#pk,#sk,#s,#r',
   ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#s':'suspended','#r':'revision'}}),{abortSignal:signal});
  return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
 };
 if(event.operation==='check-master')return checkMaster(readState);
 const result=await checkMasterAdmission(readState);
 return {...result,verified:result.observed?.suspended===event.expectedSuspended&&result.observed.revision===event.expectedRevision&&
  result.status===(event.expectedSuspended?503:200)&&result.providerStubCalls===(event.expectedSuspended?0:1)};
}
