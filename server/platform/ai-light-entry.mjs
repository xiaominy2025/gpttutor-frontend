import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-quota-runtime.mjs';
import {abuseControls} from './abuse-controls.mjs';
import {scenarioQuotaAdmission} from './scenario-quota-admission.mjs';
import {dynamoStore} from './store.mjs';
const bindings={alpha:{origin:'https://d6owpirihdsus.cloudfront.net',api:'8qmgd1ghdi',table:'decisiontree-alpha-staging-Data-JH4B4OFXWER5'},prod:{origin:'https://www.engentlabs.com',api:'eoszayfkqd',table:'decisiontree-prod-data'}};
const path='/internal/coaches/scenario/ai';
const unavailable=()=>({statusCode:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:'{"error":"AI is temporarily unavailable."}'});
export function createAiLightEntry(environment){
 const b=bindings[environment];if(!b)throw Error('Unknown environment');let handlers;
 function create(){
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1',maxAttempts:1}));
  const ssm=new SSMClient({region:'us-east-1',maxAttempts:1}),store=dynamoStore(db,b.table,id=>({pk:'NAVIGATOR#'+id,sk:'STATE'}));
  const controls=abuseControls(store),master=createPaidAiMasterGate({readState:async({signal})=>{
   const {Item}=await db.send(new GetCommand({TableName:b.table,Key:{pk:'AI#CONFIG',sk:'STATE'},ConsistentRead:true,
    ProjectionExpression:'#pk,#sk,#suspended,#revision',ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#suspended':'suspended','#revision':'revision'}}),{abortSignal:signal});
   return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
  }});
  function parameter(suffix){let value,until=0;return async()=>{
   if(Date.now()<until)return value;const {Parameter}=await ssm.send(new GetParameterCommand({Name:'/decisionnavigator-'+environment+'/'+suffix,WithDecryption:true}),{abortSignal:AbortSignal.timeout(2500)});
   const next=Parameter?.Value;if(Parameter?.Type!=='SecureString'||typeof next!=='string'||(suffix==='hmac-secret'?next.length<32:!/^sk-[A-Za-z0-9_-]{10,}$/.test(next)))throw Error('Secure configuration unavailable');
   value=next;until=Date.now()+60000;return value;
  };}
  const signingSecret=parameter('hmac-secret');
  return{navigator:anonymousNavigator({origin:b.origin,enabled:true,aiEnabled:process.env.NAVIGATOR_AI_ENABLED!=='false',signingSecret,credential:parameter('openai-api-key'),controls,conversationStore:store,master,
   generate:async(key,request)=>{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(request),redirect:'error',signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('Provider unavailable');return r.json();}}),
   scenario:scenarioQuotaAdmission(environment,{signingSecret,store,controls,master})};
 }
 return async event=>{
  if(process.env.STAGE!==environment||process.env.NAVIGATOR_ENABLED!=='true'||event.requestContext?.apiId!==b.api||event.requestContext?.stage!=='$default'||![NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH,path].includes(event.rawPath)||event.routeKey!=='POST '+event.rawPath||event.requestContext?.http?.method!=='POST')return unavailable();
  handlers??=create();return event.rawPath===path?handlers.scenario(event):handlers.navigator(event);
 };
}
