// Additive private Process RPC. Every other route delegates to the unmodified Release A entry.
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {cognitoProvider} from './provider.mjs';
import {createOAuth,PlatformError} from './oauth.mjs';
import {releaseAConfig,releaseAStore,handlerEntry as releaseAEntry} from './release-a-production.mjs';
import {processProductionSession,PROCESS_PRODUCTION_SESSION_PATH} from './process-production-session.mjs';
export function processProductionRouter({fallback,privateHandler}){return event=>event.rawPath===PROCESS_PRODUCTION_SESSION_PATH?privateHandler(event):fallback(event);}
let privateHandler;
export async function handlerEntry(event){
 if(event.rawPath!==PROCESS_PRODUCTION_SESSION_PATH)return releaseAEntry(event);
 if(process.env.SHARED_AUTH_ENABLED!=='true')return{statusCode:503,headers:{'Cache-Control':'no-store'},body:JSON.stringify({error:'Session authority unavailable.'})};
 if(!privateHandler){
  const config=releaseAConfig(process.env),region='us-east-1';
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region,maxAttempts:1}),{marshallOptions:{removeUndefinedValues:true}}),store=releaseAStore(db);
  const oauth=createOAuth({store,provider:cognitoProvider({poolId:config.pool,clientId:process.env.PLATFORM_CLIENT,domain:config.domain}),origin:config.origin,prefix:'/api/platform'});
  const signer=new SignatureV4({service:'execute-api',region,credentials:defaultProvider(),sha256:Sha256});
  const entitlements=async token=>{
   const hostname=config.api+'.execute-api.us-east-1.amazonaws.com',path='/internal/platform/entitlements';
   const request=await signer.sign(new HttpRequest({protocol:'https:',hostname,path,method:'POST',headers:{host:hostname,'content-type':'application/json'},body:JSON.stringify({accessToken:token})}));
   const result=await fetch('https://'+hostname+path,{method:'POST',headers:request.headers,body:request.body,redirect:'error',signal:AbortSignal.timeout(10000)});
   if(!result.ok)throw new PlatformError(result.status===403?401:503,'Account verification unavailable.');
   return result.json();
  };
  privateHandler=processProductionSession({oauth,store,entitlements});
 }
 return privateHandler(event);
}
