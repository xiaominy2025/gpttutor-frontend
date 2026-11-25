import {createHmac, timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import {digest, PlatformError} from './oauth.mjs';

export const SCENARIO_ADMISSION_PATH='/internal/coaches/scenario/ai';
export const SCENARIO_ALPHA_ORIGIN='https://d6owpirihdsus.cloudfront.net';
const caller=/^arn:aws:sts::771049112957:assumed-role\/scenario-alpha-runtime\/[^/]+$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const response=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
const unavailable=()=>new PlatformError(503,'Scenario AI admission is unavailable.');

// Only the platform receives Navigator's signing material. Scenario receives no
// secret, actor identifier, IP hash, arbitrary Dynamo key, or mutable lease data.
export function scenarioAlphaAdmission({signingSecret,store,controls,master,now=Date.now}) {
 async function identity(input) {
  if(input.origin!==SCENARIO_ALPHA_ORIGIN||!isIP(input.sourceIp??''))throw new PlatformError(403,'Invalid Scenario request provenance.');
  if(typeof input.cookie!=='string'||input.cookie.length>8192)throw new PlatformError(401,'Guest proof is required.');
  const matches=input.cookie.split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-engent-navigator='));
  if(matches.length!==1)throw new PlatformError(401,'Guest proof is required.');
  const token=matches[0].slice('__Host-engent-navigator='.length);
  const match=/^([A-Za-z0-9_-]{43})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if(!match||Number(match[2])<=Math.floor(now()/1000))throw new PlatformError(401,'Guest proof expired or invalid.');
  const secret=await signingSecret();
  if(typeof secret!=='string'||secret.length<32)throw unavailable();
  const signature=createHmac('sha256',secret).update('navigator-session#'+match[1]+'.'+match[2]).digest();
  const supplied=Buffer.from(match[3],'base64url');
  if(supplied.length!==signature.length||!timingSafeEqual(supplied,signature))throw new PlatformError(401,'Guest proof expired or invalid.');
  return {actor:digest('navigator#'+match[1]),ip:createHmac('sha256',secret).update(input.sourceIp).digest('hex')};
 }
 return async event=>{
  try {
   if(event.requestContext?.apiId!=='8qmgd1ghdi'||event.requestContext?.stage!=='$default'||
      event.rawPath!==SCENARIO_ADMISSION_PATH||event.routeKey!=='POST '+SCENARIO_ADMISSION_PATH||
      event.requestContext?.http?.method!=='POST'||!caller.test(event.requestContext?.authorizer?.iam?.userArn??''))
    return response(403,{error:'Scenario runtime required.'});
   const raw=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';
   if(Buffer.byteLength(raw)>16384)throw new PlatformError(413,'Admission request too large.');
   let input;try{input=JSON.parse(raw);}catch{throw new PlatformError(400,'Invalid admission request.');}
   if(!input||typeof input!=='object'||Array.isArray(input))throw new PlatformError(400,'Invalid admission request.');
   if(input.operation==='verify') {
    await identity(input);await master.assertEnabled();
    return response(200,{verified:true,coach:'scenario',environment:'alpha'});
   }
   if(input.operation==='admit') {
    const {actor,ip}=await identity(input);
    if(!uuid.test(input.requestId??'')||input.model!=='gpt-6-luna'||
       !Number.isSafeInteger(input.requestBytes)||input.requestBytes<1||input.requestBytes>24576||input.maxOutputTokens!==640)
     throw new PlatformError(400,'Invalid Scenario request bounds.');
    await master.assertEnabled();
    const id='SCENARIO#REQUEST#'+input.requestId;
    const row={coach:'scenario',environment:'alpha',state:'pending',createdAt:now(),
     expiresAt:Math.floor(now()/1000)+40*86400};
    // A lost admission response must not be retried: it might own a reservation.
    if(!await store.replace(id,0,row))throw new PlatformError(409,'Scenario request already submitted. Do not retry.');
    // Accepted Scenario V0.61 bounds: <=4096 input tokens (UTF-8/framing
    // ceiling) and <=640 output tokens. Both rates are fixed server-side.
    const reservation=832;
    const lease=await controls.admit(actor,ip,true,reservation);
    const current=await store.get(id);
    if(current?.state!=='pending'||!await store.replace(id,current.version,{...row,state:'admitted',lease,reservation,
      requestBytes:input.requestBytes,maxOutputTokens:input.maxOutputTokens,dispatchBefore:now()+15000}))throw unavailable();
    // Recheck after reservation, immediately before allowing provider dispatch.
    try{await master.assertEnabled();}catch{
     await controls.settle(lease,0);
     const saved=await store.get(id);
     if(saved?.state==='admitted')await store.replace(id,saved.version,{...saved,state:'cancelled',cost:0});
     throw unavailable();
    }
    return response(200,{admitted:true,leaseId:input.requestId,reservationMicros:reservation,
     model:'gpt-6-luna',coach:'scenario',environment:'alpha',noRetry:true});
   }
   if(input.operation==='master') {
    await master.assertEnabled();return response(200,{enabled:true});
   }
   if(input.operation==='dispatch') {
    if(!uuid.test(input.leaseId??''))throw new PlatformError(400,'Invalid Scenario lease.');
    const id='SCENARIO#REQUEST#'+input.leaseId,row=await store.get(id);
    if(row?.coach!=='scenario'||row.state!=='admitted'||row.environment!=='alpha'||row.dispatchBefore<=now())
     throw new PlatformError(409,'Scenario dispatch expired or already authorized. Do not retry.');
    await master.assertEnabled();
    if(!await store.replace(id,row.version,{...row,state:'dispatched'}))throw unavailable();
    return response(200,{allowed:true,noRetry:true});
   }
   if(input.operation==='settle') {
    if(!uuid.test(input.leaseId??''))throw new PlatformError(400,'Invalid Scenario lease.');
    const id='SCENARIO#REQUEST#'+input.leaseId,row=await store.get(id);
    if(row?.coach!=='scenario'||row.environment!=='alpha'||!['admitted','dispatched'].includes(row.state))
     throw new PlatformError(409,'Scenario settlement is unavailable. Do not retry.');
    let cost;
    if(input.uncertain===true){
     if(!await store.replace(id,row.version,{...row,state:'uncertain',retainedMicros:row.reservation}))throw unavailable();
     return response(200,{settled:false,retained:true,reservedMicros:row.reservation,requiresReconciliation:true});
    }
    else if(input.notDispatched===true)cost=0;
    else {
     const u=input.usage;
     if(!u||![u.input_tokens,u.output_tokens].every(x=>Number.isSafeInteger(x)&&x>=0))throw unavailable();
     cost=Math.ceil(u.input_tokens*.125+u.output_tokens*.5);
    }
    if(!await store.replace(id,row.version,{...row,state:'settling',cost,uncertain:input.uncertain===true}))throw unavailable();
    // Never accept lease keys/cost/prices from the caller. An ambiguous transaction
    // leaves durable state for reconciliation; no automatic refunds or replay.
    await controls.settle(row.lease,cost,input.uncertain===true);
    const saved=await store.get(id);
    if(saved?.state!=='settling'||!await store.replace(id,saved.version,{...saved,state:'settled',settledAt:now()}))throw unavailable();
    return response(200,{settled:true,coach:'scenario',costMicros:cost,conservative:input.uncertain===true});
   }
   throw new PlatformError(400,'Unsupported Scenario operation.');
  } catch(error) {
   return response(error instanceof PlatformError?error.status:503,{error:error instanceof PlatformError?error.message:'Scenario AI admission is unavailable.'});
  }
 };
}
