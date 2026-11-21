// Separate Release B entry. Release A adapter remains the default when flag is off.
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {releaseAConfig,releaseAStore,handlerEntry as productionFallback} from './release-a-production.mjs';
import {handlerEntry as alphaFallback,releaseAConfig as alphaConfig,releaseAStore as alphaStore} from './release-b-alpha-fallback.mjs';
import {emailPlatform} from './release-b-app.mjs';
import {processSession,PROCESS_SESSION_PATH} from './process-session.mjs';
let app;
export async function handlerEntry(event){
 const alpha=process.env.STAGE==='alpha',fallback=alpha?alphaFallback:productionFallback;
 if(event.rawPath===PROCESS_SESSION_PATH&&(process.env.STAGE!=='alpha'||process.env.PROCESS_SESSION_ENABLED!=='true'||process.env.RELEASE_B_EMAIL_ENABLED!=='true'||process.env.SHARED_AUTH_ENABLED!=='true'))return {statusCode:503,headers:{'Cache-Control':'no-store'},body:'Process session verification unavailable.'};
 if(process.env.RELEASE_B_EMAIL_ENABLED!=='true')return fallback(event);
 if(process.env.SHARED_AUTH_ENABLED!=='true')return {statusCode:503,headers:{'Cache-Control':'no-store'},body:'Shared session configuration unavailable.'};
 if(!app){
  const config=alpha?alphaConfig(process.env):releaseAConfig(process.env);
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:'us-east-1'}),{marshallOptions:{removeUndefinedValues:true}});
  // Same versioned PLATFORM namespace contract, with the exact Alpha table adapter separate from production.
  const store=alpha?alphaStore(db):releaseAStore(db);
  if(!store)throw Error('Alpha store adapter unavailable');
  const signer=new SignatureV4({service:'execute-api',region:'us-east-1',credentials:defaultProvider(),sha256:Sha256});
  const invoke=async(action,data)=>{if(!['start','finish','session','handoff','advanced-request'].includes(action))throw Error('Invalid action');const hostname=config.api+'.execute-api.us-east-1.amazonaws.com',path='/internal/platform/email/'+action;
   const r=await signer.sign(new HttpRequest({protocol:'https:',hostname,path,method:'POST',headers:{host:hostname,'content-type':'application/json'},body:JSON.stringify(data)}));const response=await fetch('https://'+hostname+path,{method:'POST',headers:r.headers,body:r.body,signal:AbortSignal.timeout(10000),redirect:'error'});if(!response.ok)throw Object.assign(Error('Email service unavailable'),{status:response.status});return response.json();};
  const processEnabled=alpha&&process.env.PROCESS_SESSION_ENABLED==='true';
  const publicApp=emailPlatform({store,invoke,origin:config.origin,treeOrigin:config.treeOrigin,fallback,enabled:true,processEnabled});
  const privateApp=processSession({store,invoke,enabled:processEnabled});
  app=e=>e.rawPath===PROCESS_SESSION_PATH?privateApp(e):publicApp(e);
 }
 return app(event);
}
