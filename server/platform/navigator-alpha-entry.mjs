import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-runtime.mjs';
import {navigatorControls} from './budget.mjs';
import {dynamoStore} from './store.mjs';

const region='us-east-1';
const apiId='8qmgd1ghdi';
const origin='https://d6owpirihdsus.cloudfront.net';
const table='decisiontree-alpha-staging-Data-JH4B4OFXWER5';
const unavailable={statusCode:503,headers:{'Cache-Control':'no-store','Content-Type':'application/json'},
 body:JSON.stringify({error:'Navigator is unavailable.'})};

function secureParameter(ssm,name,minimumLength) {
 let value,expires=0;
 return async ()=>{
  if(Date.now()<expires)return value;
  const result=await ssm.send(new GetParameterCommand({Name:name,WithDecryption:true}),{abortSignal:AbortSignal.timeout(2500)});
  const next=result.Parameter?.Value;
  if(typeof next!=='string'||next.length<minimumLength)throw Error('Navigator credential is unavailable.');
  value=next;
  expires=Date.now()+60000;
  return value;
 };
}

function createHandler() {
 const db=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1}));
 const ssm=new SSMClient({region,maxAttempts:1});
 const store=dynamoStore(db,table,id=>({pk:'NAVIGATOR#'+id,sk:'STATE'}));
 const master=createPaidAiMasterGate({readState:async({signal})=>{
  const {Item}=await db.send(new GetCommand({TableName:table,Key:{pk:'AI#CONFIG',sk:'STATE'},
   ConsistentRead:true,ProjectionExpression:'#pk, #sk, #suspended, #revision',
   ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#suspended':'suspended','#revision':'revision'}}),{abortSignal:signal});
  return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
 }});
 return anonymousNavigator({enabled:true,origin,master,conversationStore:store,
  controls:navigatorControls(store),
  signingSecret:secureParameter(ssm,'/decisionnavigator-alpha/hmac-secret',32),
  credential:secureParameter(ssm,'/decisionnavigator-alpha/openai-api-key',10),
  // Conservatively charge every input token at the highest Standard input rate (cache write).
  price:{model:'gpt-6-luna',input:0.125,output:0.50},
  generate:async(key,request)=>{
   const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',
    headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify(request),redirect:'error',signal:AbortSignal.timeout(18000)});
   if(!response.ok)throw Error('Provider unavailable.');
   return response.json();
  }
 });
}

let handler;
export async function handlerEntry(event) {
 const path=event.rawPath;
 if(process.env.STAGE!=='alpha'||process.env.NAVIGATOR_ENABLED!=='true'||
    event.requestContext?.apiId!==apiId||event.requestContext?.stage!=='$default'||
    ![NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH].includes(path)||event.routeKey!=='POST '+path)return unavailable;
 handler??=createHandler();
 return handler(event);
}
