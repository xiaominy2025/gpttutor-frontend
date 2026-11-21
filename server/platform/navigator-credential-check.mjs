import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';

const rawKey=value=>typeof value==='string'&&/^sk-[A-Za-z0-9_-]{10,}$/.test(value);
// Return a fixed vocabulary only. Never return input, lengths, field names or fingerprints.
export function inspectCredentialFormat(value){
 if(typeof value!=='string')return {rawFormatValid:false,format:'not-a-string'};
 if(rawKey(value))return {rawFormatValid:true,format:'raw-token'};
 const trimmed=value.trim();
 const flags={boundaryWhitespace:value!==trimmed,byteOrderMark:value.includes('\uFEFF'),
  internalWhitespace:/\s/.test(trimmed),nonAscii:/[^\x20-\x7e]/.test(trimmed)};
 if(rawKey(trimmed))return {rawFormatValid:false,format:'surrounding-whitespace',recognizedTokenInsideWrapper:true,...flags};
 try{
  const parsed=JSON.parse(trimmed);
  if(typeof parsed==='string')return {rawFormatValid:false,format:'json-string',recognizedTokenInsideWrapper:rawKey(parsed.trim()),...flags};
  if(parsed&&typeof parsed==='object'){
   const contains=(input,depth)=>depth<=3&&(typeof input==='string'?rawKey(input.trim()):
    input&&typeof input==='object'&&Object.values(input).slice(0,20).some(v=>contains(v,depth+1)));
   return {rawFormatValid:false,format:Array.isArray(parsed)?'json-array':'json-object',recognizedTokenInsideWrapper:Boolean(contains(parsed,0)),...flags};
  }
 }catch{/* No parsing exception or input may leave the runtime. */}
 const forms=[['single-quoted',trimmed.startsWith("'")&&trimmed.endsWith("'")?trimmed.slice(1,-1):null],
  ['bearer-prefix',/^Bearer\s+/i.test(trimmed)?trimmed.replace(/^Bearer\s+/i,''):null],
  ['environment-assignment',/^(?:export\s+)?OPENAI_API_KEY\s*=/.test(trimmed)?trimmed.replace(/^(?:export\s+)?OPENAI_API_KEY\s*=\s*/,'').replace(/^(['"])(.*)\1$/,'$2'):null]];
 for(const [format,candidate] of forms)if(candidate!==null)return {rawFormatValid:false,format,recognizedTokenInsideWrapper:rawKey(candidate.trim()),...flags};
 try{const decoded=decodeURIComponent(trimmed);if(decoded!==trimmed&&rawKey(decoded))return {rawFormatValid:false,format:'url-encoded',recognizedTokenInsideWrapper:true,...flags};}catch{}
 if(/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)&&trimmed.length%4===0&&rawKey(Buffer.from(trimmed,'base64').toString('utf8')))
  return {rawFormatValid:false,format:'base64-encoded',recognizedTokenInsideWrapper:true,...flags};
 return {rawFormatValid:false,format:'unrecognized',recognizedTokenInsideWrapper:false,...flags};
}

// Direct IAM invocation only. No generation endpoint, arbitrary URLs, or secret output.
export function credentialChecker({readParameter,metadataFetch,environment=process.env}) {
 return async (event,context)=>{
  if(context?.invokedFunctionArn!=='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:$LATEST'||
    environment.STAGE!=='alpha'||environment.NAVIGATOR_ENABLED!=='false'||
    !['verify-credential','inspect-credential-format','verify-credential-format'].includes(event?.operation)||Object.keys(event).length!==1||event.requestContext) {
   return {verified:false,reason:'invalid-target'};
  }
  try {
   const parameter=await readParameter();
   const key=parameter?.Value;
   if(parameter?.Type!=='SecureString'||!Number.isSafeInteger(parameter.Version)||parameter.Version<1)
    return {verified:false,reason:'parameter-metadata'};
   const format=inspectCredentialFormat(key);
   if(event.operation!=='verify-credential')return {verified:format.rawFormatValid,parameterVersion:parameter.Version,
    secureString:true,...format,providerRequests:0,generationCalls:0};
   if(!format.rawFormatValid)return {verified:false,reason:'credential-format'};
   const response=await metadataFetch('https://api.openai.com/v1/models/gpt-6-luna',{
    method:'GET',headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(8000)
   });
   if(!response.ok)return {verified:false,reason:'model-metadata-denied',httpStatus:response.status};
   const body=await response.json();
   return {verified:body.id==='gpt-6-luna',secureString:true,version:parameter.Version,
    modelMetadataAccessible:body.id==='gpt-6-luna',generationCalls:0};
  } catch {
   // SDK/provider exceptions may contain sensitive input. Never return or log them.
   return {verified:false,reason:'credential-or-metadata-unavailable',generationCalls:0};
  }
 };
}

let check;
export async function handlerEntry(event,context) {
 check??=credentialChecker({readParameter:async()=>{
  const client=new SSMClient({region:'us-east-1',maxAttempts:1});
  const result=await client.send(new GetParameterCommand({Name:'/decisionnavigator-alpha/openai-api-key',WithDecryption:true}),
   {abortSignal:AbortSignal.timeout(2500)});
  return result.Parameter;
 },metadataFetch:fetch});
 return check(event,context);
}
