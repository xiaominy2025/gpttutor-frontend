// Alpha-only authentication adapter. No Navigator, SSM, AI or budget capabilities.
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand} from '@aws-sdk/lib-dynamodb';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {Sha256} from '@aws-crypto/sha256-js';
import {cognitoProvider} from './provider.mjs';
import {createOAuth,PlatformError} from './oauth.mjs';
import {platformApp} from './app.mjs';

export const releaseA={origin:'https://d6owpirihdsus.cloudfront.net',pool:'us-east-1_CipTwwDZb',
 table:'decisiontree-alpha-staging-Data-JH4B4OFXWER5',api:'8qmgd1ghdi',
 domain:'engent-platform-alpha-771049112957.auth.us-east-1.amazoncognito.com'};
export function releaseAStore(db,table=releaseA.table){
 if(table!==releaseA.table)throw Error('Release A requires the existing Alpha table.');
 const key=id=>({pk:'PLATFORM#'+id,sk:'STATE'});
 const conflict=error=>error?.name==='ConditionalCheckFailedException';
 async function put(id,version,data){
  try{
   await db.send(new PutCommand({TableName:table,Item:{...data,...key(id),version:version+1},
    ConditionExpression:version?'#v = :v':'attribute_not_exists(pk)',
    ...(version?{ExpressionAttributeNames:{'#v':'version'},ExpressionAttributeValues:{':v':version}}:{})}));return true;
  }catch(error){if(conflict(error))return false;throw error;}
 }
 return {
  get:async id=>(await db.send(new GetCommand({TableName:table,Key:key(id),ConsistentRead:true}))).Item,
  create:async(id,data)=>{if(!await put(id,0,data))throw Error('Session conflict.');},
  replace:put,
  remove:async(id,version)=>{
   try{await db.send(new DeleteCommand({TableName:table,Key:key(id),
    ...(version?{ConditionExpression:'#v = :v',ExpressionAttributeNames:{'#v':'version'},ExpressionAttributeValues:{':v':version}}:{})}));return true;}
   catch(error){if(conflict(error))return false;throw error;}
  }
 };
}
export function releaseAConfig(env){
 if(env.STAGE!=='alpha'||env.APP_ORIGIN!==releaseA.origin||env.STUDENT_POOL!==releaseA.pool||
    env.STATE_TABLE!==releaseA.table||env.TREE_ORIGIN!==releaseA.origin||env.LOGIN_DOMAIN!==releaseA.domain||
    !/^[a-z0-9]+$/.test(env.PLATFORM_CLIENT??'')||env.NAVIGATOR_ENABLED!=='false')
  throw Error('Release A Alpha isolation required.');
 return releaseA;
}
let app;
export async function handlerEntry(event){
 if(process.env.SHARED_AUTH_ENABLED!=='true')return {statusCode:410,headers:{'Cache-Control':'no-store'},body:'Feature unavailable.'};
 if(!app){
  const config=releaseAConfig(process.env),region='us-east-1';
  const db=DynamoDBDocumentClient.from(new DynamoDBClient({region}),{marshallOptions:{removeUndefinedValues:true}});
  const oauth=createOAuth({store:releaseAStore(db),provider:cognitoProvider({poolId:config.pool,
   clientId:process.env.PLATFORM_CLIENT,domain:config.domain}),origin:config.origin,prefix:'/api/platform'});
  const signer=new SignatureV4({service:'execute-api',region,credentials:defaultProvider(),sha256:Sha256});
  app=platformApp({oauth,origin:config.origin,treeOrigin:config.origin,enabled:true,navigator:false,
   entitlements:async token=>{
    const hostname=config.api+'.execute-api.us-east-1.amazonaws.com',path='/internal/platform/entitlements';
    const request=await signer.sign(new HttpRequest({protocol:'https:',hostname,path,method:'POST',
     headers:{host:hostname,'content-type':'application/json'},body:JSON.stringify({accessToken:token})}));
    const response=await fetch('https://'+hostname+path,{method:'POST',headers:request.headers,body:request.body,
     signal:AbortSignal.timeout(10000),redirect:'error'});
    if(!response.ok)throw new PlatformError(response.status===403?401:503,'Account access is unavailable.');
    return response.json();
   }});
 }
 return app(event);
}
