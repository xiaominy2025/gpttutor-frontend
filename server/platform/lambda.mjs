import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';
import {CloudWatchClient,PutMetricDataCommand} from '@aws-sdk/client-cloudwatch';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {dynamoStore} from './store.mjs';
import {pilot,navigatorControls} from './budget.mjs';
import {cognitoProvider} from './provider.mjs';
import {createOAuth,PlatformError} from './oauth.mjs';
import {platformApp} from './app.mjs';

let handler;
export async function handlerEntry(event) {
 if(!handler) {
  const env=process.env;
  const production=env.STAGE==='prod';
  const region='us-east-1';
  const origin=production?'https://www.engentlabs.com':env.APP_ORIGIN;
  const treeUrl=new URL(env.TREE_ENTITLEMENTS_URL);
  if(!/^https:\/\/[^/]+$/.test(origin??'') ||
     !/^https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws.com\/internal\/platform\/entitlements$/.test(treeUrl.href) ||
     (production && (env.STUDENT_POOL!=='us-east-1_Ilf34btQ0' || env.TREE_ORIGIN!=='https://decisiontree.engentlabs.com' || treeUrl.hostname!=='eoszayfkqd.execute-api.us-east-1.amazonaws.com'))) {
   throw Error('Invalid platform configuration.');
  }
  if(!['alpha','prod'].includes(env.STAGE)||(!production && (env.STUDENT_POOL!=='us-east-1_CipTwwDZb'||treeUrl.hostname!=='8qmgd1ghdi.execute-api.us-east-1.amazonaws.com'||origin==='https://www.engentlabs.com'||env.TREE_ORIGIN!=='https://d6owpirihdsus.cloudfront.net')))throw Error('Alpha isolation required.');
  const table=env.STATE_TABLE;
  if(table!=='engent-platform-'+env.STAGE+'-state') throw Error('Invalid platform state target.');
  const store=dynamoStore(DynamoDBDocumentClient.from(new DynamoDBClient({region})),table);
  const provider=cognitoProvider({poolId:env.STUDENT_POOL,clientId:env.PLATFORM_CLIENT,domain:env.LOGIN_DOMAIN});
  const oauth=createOAuth({store,provider,origin,prefix:'/api/platform'});
  const parameters=new SSMClient({region}),metrics=new CloudWatchClient({region});
  let saved,until=0;
  async function credentials() {
   if(saved && Date.now()<until) return saved;
   const result=await parameters.send(new GetParameterCommand({Name:'/engent-platform-'+env.STAGE+'/navigator-credentials',WithDecryption:true}));
   let value;try {value=JSON.parse(result.Parameter?.Value??'');}catch {throw new PlatformError(503,'Navigator configuration unavailable.');}
   if(typeof value.OPENAI_API_KEY!=='string'||value.OPENAI_API_KEY.length<10 ||
      typeof value.IP_HMAC_SECRET!=='string'||value.IP_HMAC_SECRET.length<32) throw new PlatformError(503,'Navigator configuration unavailable.');
   saved={key:value.OPENAI_API_KEY,ipSecret:value.IP_HMAC_SECRET};until=Date.now()+60000;return saved;
  }
  const configured=JSON.parse(env.NAVIGATOR_LIMITS??'{}');
  if(Object.entries(configured).some(([key,value])=>key==='monthlyMicros'||!Object.hasOwn(pilot,key)||!Number.isSafeInteger(value)||value<1))throw Error('Invalid Navigator limits.');
  const controls=navigatorControls(store,{limits:{...pilot,...configured},alert:async(threshold,micros)=>{
   await metrics.send(new PutMetricDataCommand({Namespace:'Engent/Platform/'+env.STAGE,
    MetricData:[{MetricName:'NavigatorBudgetPercent',Value:threshold,Unit:'Percent'},
     {MetricName:'NavigatorAdmittedMicros',Value:micros,Unit:'Count'}]}));
  }});
  const signer=new SignatureV4({service:'execute-api',region,credentials:defaultProvider(),sha256:Sha256});
  handler=platformApp({oauth,origin,treeOrigin:env.TREE_ORIGIN,credentials,controls,enabled:env.SHARED_AUTH_ENABLED==='true',navigator:env.NAVIGATOR_ENABLED==='true',
   price:{model:env.NAVIGATOR_MODEL,input:Number(env.INPUT_USD_PER_MILLION),output:Number(env.OUTPUT_USD_PER_MILLION)},
   entitlements:async token=>{
    const request=await signer.sign(new HttpRequest({protocol:'https:',hostname:treeUrl.hostname,path:treeUrl.pathname,method:'POST',
     headers:{host:treeUrl.hostname,'content-type':'application/json'},body:JSON.stringify({accessToken:token})}));
    const response=await fetch(treeUrl,{method:'POST',headers:request.headers,body:request.body,signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok) throw new PlatformError(response.status===403?401:503,'Account access is unavailable.');
    return response.json();
   },
   generate:async(key,request)=>{
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
     body:JSON.stringify(request),signal:AbortSignal.timeout(18000),redirect:'error'});
    if(!response.ok) throw new Error('Provider unavailable.');
    return response.json();
   }});
 }
 return handler(event);
}
