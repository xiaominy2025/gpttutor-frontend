import {DynamoDBClient,GetItemCommand,PutItemCommand,TransactWriteItemsCommand} from '@aws-sdk/client-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {productionRuntime,productionModelParameter} from './runtime.mjs';
const db=new DynamoDBClient({maxAttempts:1}),ssm=new SSMClient({maxAttempts:1});
const getItem=input=>db.send(new GetItemCommand(input));
const putItem=input=>db.send(new PutItemCommand(input));
const table='decisiontree-prod-data',key=pk=>({pk:{S:pk},sk:{S:'STATE'}});
const fail=condition=>{if(!condition)throw Error('Provider-free production acceptance failed');};
export async function handler(event){
 if(event?.operation!=='provider-free-shared-budget')return{passed:false};
 let fixtureDispatches=0,atomicAdmission=false,atomicSettlement=false,rawCredential=false;
 const runtime=productionRuntime({mode:'live',getItem,putItem,
  getParameter:async input=>{const r=await ssm.send(new GetParameterCommand(input));if(input.Name===productionModelParameter)rawCredential=r.Parameter?.Type==='SecureString'&&/^sk-[A-Za-z0-9_-]{20,}$/.test(r.Parameter?.Value??'');return r;},
  transactWrite:async input=>{
   const money=input.TransactItems.find(x=>x.Put.Item.pk.S.startsWith('NAVIGATOR#BUDGET#')).Put;
   const local=input.TransactItems.find(x=>x.Put.Item.pk.S==='FORECASTING#PROD').Put;
   await db.send(new TransactWriteItemsCommand(input));
   const state=JSON.parse(local.Item.state.S),shared=(await getItem({TableName:table,Key:{pk:money.Item.pk,sk:money.Item.sk},ConsistentRead:true})).Item;
   const leases=Object.values(state.leases);if(leases.length){const id=Object.keys(state.leases)[0];fail(Number(shared.leases.M['forecasting-'+id]?.N)===state.leases[id].reservation);atomicAdmission=true;}
   else atomicSettlement=true;
  },
  fetcher:async(url,input)=>{fail(url==='https://api.openai.com/v1/responses');fixtureDispatches++;fail(fixtureDispatches===1);return new Response(JSON.stringify({status:'completed',usage:{input_tokens:0,output_tokens:0},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Production provider-free fixture; no model call.'}]}]}),{status:200});}
 });
 const request=path=>({version:'2.0',rawPath:path,routeKey:'POST '+path,requestContext:{apiId:'eoszayfkqd',stage:'$default',http:{method:'POST',sourceIp:'192.0.2.99'}},headers:{origin:'https://www.engentlabs.com','content-type':'application/json'},body:'{}'});
 const boot=await runtime(request('/api/platform/forecasting/session'));fail(boot.statusCode===200&&boot.cookies?.length===1);
 const message=request('/api/platform/forecasting/communication');message.cookies=[boot.cookies[0].split(';')[0]];
 message.body=JSON.stringify({version:1,objective:'Review staffing',variable:{name:'Orders',units:'orders'},forecast:{method:'moving',frequency:'monthly',horizon:1,reference:{period:12,value:80,kind:'actual'},change:{difference:10,percent:12.5},keyPeriods:[{lead:1,period:13,base:90,low:null,high:null}]},historicalPatterns:null,seasonalEffects:null,accuracy:[],limitations:['missing_historical_accuracy']});
 const response=await runtime(message);fail(response.statusCode===200&&fixtureDispatches===1&&atomicAdmission&&atomicSettlement&&rawCredential);
 const denied=productionRuntime({mode:'live',getItem:async input=>input.Key.pk.S==='AI#CONFIG'?{Item:{suspended:{BOOL:true},revision:{N:'1'}}}:getItem(input),putItem,getParameter:()=>{throw Error('Denied gate reached secret');}});
 fail((await denied(request('/api/platform/forecasting/session'))).statusCode===503);
 const month=new Date().toISOString().slice(0,7);const budget=(await getItem({TableName:table,Key:key('NAVIGATOR#BUDGET#'+month),ConsistentRead:true})).Item;
 return{passed:true,providerCalls:0,fixtureDispatches,atomicAdmission,atomicSettlement,rawCredentialFormatVerified:rawCredential,masterDenialWithoutToggle:true,spentMicros:Number(budget.spent.N),reservedMicros:Number(budget.reserved.N)};
}
