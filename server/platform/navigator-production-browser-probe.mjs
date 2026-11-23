import {createHash,createHmac,randomBytes} from 'node:crypto';
import {isIP} from 'node:net';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {dynamoStore} from './store.mjs';
import {anonymousNavigator,NAVIGATOR_PATH,NAVIGATOR_SESSION_PATH} from './navigator-runtime.mjs';

const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-prod-api';
const origin='https://www.engentlabs.com';
const denied=()=>({statusCode:503,headers:{'Cache-Control':'no-store'},body:'{"error":"Navigator is unavailable."}'});
const hash=value=>createHash('sha256').update(value).digest('hex');

// Acceptance-only, provider-free module. An unarmed build cannot serve any probe.
export function browserProbe({store,signingSecret,manifest,now=Date.now,environment=process.env}) {
 return async(event,context)=>{
  try {
   if(!manifest||typeof manifest.run!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(manifest.run)||
      !Number.isSafeInteger(manifest.startsAt)||!Number.isSafeInteger(manifest.endsAt)||
      manifest.endsAt-manifest.startsAt>300000||manifest.endsAt<=manifest.startsAt||
      now()<manifest.startsAt||now()>=manifest.endsAt||environment.STAGE!=='prod'||environment.NAVIGATOR_ENABLED!=='false')return denied();
   const direct=context?.functionVersion==='$LATEST'&&[arn,arn+':$LATEST'].includes(context.invokedFunctionArn);
   const namespace='probe#'+manifest.run+'#';
   const secret=async()=>createHmac('sha256',await signingSecret()).update('navigator-browser-probe#'+manifest.run).digest('hex');
   const ipHash=async ip=>createHmac('sha256',await secret()).update(ip).digest('hex');
   if(direct&&!event.requestContext&&event.operation==='prepare'){
    if(!['a','b'].includes(event.network)||!isIP(event.expectedIp)||Object.keys(event).some(k=>!['operation','network','expectedIp'].includes(k)))return denied();
    const token=randomBytes(32).toString('base64url');
    if(!await store.replace(namespace+event.network,0,{phase:'prepared',tokenHash:hash(token),expectedIpHash:await ipHash(event.expectedIp),
      expiresAt:Math.ceil(manifest.endsAt/1000),network:event.network}))return denied();
    // Operator memory only. No raw IP, cookie or transcript is stored.
    return {prepared:true,token,network:event.network};
   }
   if(!/^\d+$/.test(context?.functionVersion??'')||![arn+':live',arn+':'+context.functionVersion].includes(context.invokedFunctionArn)||
     event.requestContext?.apiId!=='eoszayfkqd'||event.requestContext?.stage!=='$default'||
     event.routeKey!=='POST '+NAVIGATOR_SESSION_PATH||event.rawPath!==NAVIGATOR_SESSION_PATH||
     event.requestContext?.http?.method!=='POST'||event.headers?.origin!==origin||
     event.isBase64Encoded||Buffer.byteLength(event.body??'')>1000)return denied();
   const token=event.headers?.['x-engent-navigator-probe'];
   if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return denied();
   const body=JSON.parse(event.body??'{}');
   if(!['a','b'].includes(body.network)||!['bootstrap','verify'].includes(body.action)||Object.keys(body).length!==2)return denied();
   const id=namespace+body.network,row=await store.get(id);
   if(!row||row.tokenHash!==hash(token)||row.expiresAt*1000<=now()||
      row.phase!==(body.action==='bootstrap'?'prepared':'bootstrapped'))return denied();
   if(!await store.replace(id,row.version,{...row,phase:body.action==='bootstrap'?'bootstrapped':'complete'}))return denied();
   const forbidden=async()=>{throw Error('Provider and quota operations forbidden');};
   let accepted=false;
   const app=anonymousNavigator({origin,enabled:true,signingSecret:secret,now,
    credential:async()=>{accepted=true;throw Error('Cookie verified; stop before admission');},
    controls:{admit:forbidden,settle:forbidden},conversationStore:{replace:forbidden,remove:forbidden},
    master:{assertEnabled:forbidden},generate:forbidden,price:{model:'gpt-6-luna',input:.125,output:.5}});
   const result=await app({...event,rawPath:body.action==='bootstrap'?NAVIGATOR_SESSION_PATH:NAVIGATOR_PATH,
    body:JSON.stringify({message:'Cookie verification only.',history:[]})});
   const source=event.requestContext.http.sourceIp;
   const matches=typeof source==='string'&&isIP(source)!==0&&(await ipHash(source))===row.expectedIpHash;
   if(body.action==='bootstrap'&&(result.statusCode!==200||result.cookies?.length!==1))return denied();
   return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
    ...(body.action==='bootstrap'?{cookies:result.cookies}:{}),body:JSON.stringify({
     action:body.action,sourceIpMatchesExpectedViewer:matches,cookieAccepted:body.action==='verify'?accepted:null,
     providerTransport:'absent',requestId:event.requestContext.requestId})};
  }catch{return denied();}
 };
}

let probe;
export async function handlerEntry(event,context){
 const manifest=typeof NAVIGATOR_BROWSER_PROBE_MANIFEST==='undefined'?null:NAVIGATOR_BROWSER_PROBE_MANIFEST;
 if(!manifest)return denied();
 if(!probe){
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1',maxAttempts:1}));
  const ssm=new SSMClient({region:'us-east-1',maxAttempts:1});
  probe=browserProbe({manifest,store:dynamoStore(db,'decisiontree-prod-data',id=>({pk:'NAVIGATOR#acceptance#'+id,sk:'STATE'})),
   signingSecret:async()=>{
    const r=await ssm.send(new GetParameterCommand({Name:'/decisionnavigator-prod/hmac-secret',WithDecryption:true}),{abortSignal:AbortSignal.timeout(2500)});
    if(typeof r.Parameter?.Value!=='string'||r.Parameter.Value.length<32)throw Error('Signing unavailable');
    return r.Parameter.Value;
   }});
 }
 return probe(event,context);
}
