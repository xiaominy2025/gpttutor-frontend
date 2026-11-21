import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
import {createPaidAiMasterGate} from '../shared/paid-ai-master.mjs';

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
export async function handlerEntry(event,context){
 const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api';
 if(context?.functionVersion!=='$LATEST'||![arn,arn+':$LATEST'].includes(context.invokedFunctionArn)||
  process.env.STAGE!=='alpha'||process.env.NAVIGATOR_ENABLED!=='false'||event?.operation!=='check-master'||Object.keys(event).length!==1)
  return {allowed:false,reason:'invalid-target'};
 const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1',maxAttempts:1}));
 return checkMaster(async({signal})=>{
  const {Item}=await db.send(new GetCommand({TableName:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',
   Key:{pk:'AI#CONFIG',sk:'STATE'},ConsistentRead:true,ProjectionExpression:'#pk,#sk,#s,#r',
   ExpressionAttributeNames:{'#pk':'pk','#sk':'sk','#s':'suspended','#r':'revision'}}),{abortSignal:signal});
  return Item?.pk==='AI#CONFIG'&&Item.sk==='STATE'?Item:null;
 });
}
