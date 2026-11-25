// Production composition retains the accepted Navigator runtime unchanged.
import {handlerEntry as navigatorHandler} from './navigator-production-entry.mjs';
import {scenarioProductionAdmission,SCENARIO_ADMISSION_PATH} from './scenario-alpha-admission.mjs';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {dynamoStore} from './store.mjs';
import {navigatorControls} from './budget.mjs';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';
let admission;
function createAdmission(){
 const table='decisiontree-prod-data',region='us-east-1';
 const db=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1}));
 const ssm=new SSMClient({region,maxAttempts:1});
 const store=dynamoStore(db,table,id=>({pk:'NAVIGATOR#'+id,sk:'STATE'}));
 return scenarioProductionAdmission({store,controls:navigatorControls(store),
  signingSecret:async()=>{
   const {Parameter}=await ssm.send(new GetParameterCommand({Name:'/decisionnavigator-prod/hmac-secret',WithDecryption:true}),{abortSignal:AbortSignal.timeout(2500)});
   if(Parameter?.Type!=='SecureString'||typeof Parameter.Value!=='string'||Parameter.Value.length<32)throw Error('Proof verification unavailable.');
   return Parameter.Value;
  },
  master:createPaidAiMasterGate({readState:async({signal})=>{
   const {Item}=await db.send(new GetCommand({TableName:table,Key:{pk:'AI#CONFIG',sk:'STATE'},ConsistentRead:true,
    ProjectionExpression:'#pk,#sk,#suspended,#revision',ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#suspended':'suspended','#revision':'revision'}}),{abortSignal:signal});
   return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
  }})
 });
}
export async function handlerEntry(event){
 if(event.rawPath!==SCENARIO_ADMISSION_PATH)return navigatorHandler(event);
 if(process.env.STAGE!=='prod'||process.env.NAVIGATOR_ENABLED!=='true')return {statusCode:503,headers:{'Cache-Control':'no-store'},body:'{"error":"Scenario admission unavailable."}'};
 admission??=createAdmission();return admission(event);
}
