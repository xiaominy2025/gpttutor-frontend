import {createHmac} from 'node:crypto';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-runtime.mjs';
import {navigatorControls} from './budget.mjs';
import {dynamoStore} from './store.mjs';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';
import {canaryAttempt,canaryPrice,validateCanaryManifest} from './navigator-paid-guard.mjs';

const region='us-east-1';
const origin='https://d6owpirihdsus.cloudfront.net';
const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5';
const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api';
const messages=[
 'I study chemistry and am weighing an industry internship against summer research. I want to learn what suits me before deciding whether to pursue graduate school.',
 'How can I tell which objectives the summer should serve?',
 'How could I compare what I might actually learn from the two experiences?',
 'How can I weigh what I learn against practical constraints without treating it as a final verdict?'
];
const denied=()=>({status:503,canary:{state:'stopped'}});

export async function executeCanary(event,{manifest,store,master,signingSecret,credential,send,now=Date.now}){
 const pin=validateCanaryManifest(manifest);
 if(!event||now()<pin.startsAt||now()>=pin.endsAt||event.approval!==pin.approval)return denied();
 const step=event.step;
 let attempt,body,cookies;
 if(step===0){
  if(Object.keys(event).some(key=>!['approval','step'].includes(key)))return denied();
  body={};cookies=[];
 }else{
  if(!Number.isInteger(step)||step<1||step>messages.length||
     Object.keys(event).some(key=>!['approval','step','cookie','history','continuation','receipt'].includes(key))||
     typeof event.cookie!=='string'||!/^__Host-engent-navigator=[A-Za-z0-9_.-]{98}$/.test(event.cookie)||
     !Array.isArray(event.history)||event.history.length!==(step-1)*2||
     event.history.some((entry,index)=>index%2===0&&entry?.text!==messages[index/2])||
     (step===1?event.continuation!==undefined||event.receipt!==undefined:
      typeof event.continuation!=='string'||typeof event.receipt!=='string'))return denied();
  body={message:messages[step-1],history:event.history,continuation:event.continuation};
  cookies=[event.cookie];
  attempt=canaryAttempt({manifest,store,step,receipt:event.receipt,master,send,now});
 }
 const path=step===0?NAVIGATOR_SESSION_PATH:NAVIGATOR_PATH;
 const controls=navigatorControls(store,{now});
 const app=anonymousNavigator({enabled:true,origin,now,signingSecret,credential,master,
  controls:{...controls,settle:(lease,cost,uncertain)=>{
   // The core conservatively flags all generate failures. The guard knows whether its transport started.
   return controls.settle(lease,cost,uncertain&&attempt?.dispatchStarted());
  }},conversationStore:store,price:canaryPrice,generate:attempt?.generate});
 const result=await app({rawPath:path,cookies,headers:{origin},requestContext:{http:{method:'POST',sourceIp:'192.0.2.1'}},
  body:JSON.stringify(body)});
 if(step===0)return result.statusCode===200?{status:200,cookie:result.cookies[0].split(';')[0]}:denied();
 const accounting=await attempt.finish(result.statusCode===200);
 if(result.statusCode!==200||!['ready','complete'].includes(accounting.state))return {status:result.statusCode===200?503:result.statusCode,
  canary:{...accounting,state:accounting.state==='held'?'held':'stopped'}};
 return {status:200,canary:accounting,result:JSON.parse(result.body)};
}

export async function handlerEntry(event,context){
 const direct=context?.functionVersion==='$LATEST'&&[arn,arn+':$LATEST'].includes(context.invokedFunctionArn);
 const manifest=typeof NAVIGATOR_REVIEWED_CANARY_MANIFEST==='undefined'?null:NAVIGATOR_REVIEWED_CANARY_MANIFEST;
 if(!direct||!manifest||process.env.STAGE!=='alpha'||process.env.NAVIGATOR_ENABLED!=='false')return denied();
 try{
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1}));
  const ssm=new SSMClient({region,maxAttempts:1});
  const store=dynamoStore(db,table,id=>({pk:'NAVIGATOR#'+id,sk:'STATE'}));
  const master=createPaidAiMasterGate({readState:async({signal})=>{
   const {Item}=await db.send(new GetCommand({TableName:table,Key:{pk:'AI#CONFIG',sk:'STATE'},
    ConsistentRead:true,ProjectionExpression:'#pk, #sk, #suspended, #revision',
    ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#suspended':'suspended','#revision':'revision'}}),{abortSignal:signal});
   return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
  }});
  const parameter=async(name,min)=>{
   const response=await ssm.send(new GetParameterCommand({Name:'/decisionnavigator-alpha/'+name,WithDecryption:true}),
    {abortSignal:AbortSignal.timeout(2500)});
   const value=response.Parameter?.Value;
   if(typeof value!=='string'||value.length<min)throw Error('Canary credential unavailable');
   return value;
  };
  return await executeCanary(event,{manifest,store,master,
   signingSecret:async()=>createHmac('sha256',await parameter('hmac-secret',32)).update('navigator-paid-canary-v1').digest('hex'),
   credential:async()=>{
    const key=await parameter('openai-api-key',10);
    if(!/^sk-[A-Za-z0-9_-]+$/.test(key))throw Error('Canary key format mismatch');
    return key;
   },
   send:async(key,body)=>{
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',
     headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
     body,redirect:'error',signal:AbortSignal.timeout(18000)});
    if(!response.ok)throw Error('Provider unavailable');
    return response.json();
   }
  });
 }catch{return denied();}
}
