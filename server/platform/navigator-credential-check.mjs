import {SSMClient,GetParameterCommand} from '@aws-sdk/client-ssm';

// Direct IAM invocation only. No generation endpoint, arbitrary URLs, or secret output.
export function credentialChecker({readParameter,metadataFetch,environment=process.env}) {
 return async (event,context)=>{
  if(context?.invokedFunctionArn!=='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:$LATEST'||
    environment.STAGE!=='alpha'||environment.NAVIGATOR_ENABLED!=='false'||
    event?.operation!=='verify-credential'||Object.keys(event).length!==1||event.requestContext) {
   return {verified:false,reason:'invalid-target'};
  }
  try {
   const parameter=await readParameter();
   const key=parameter?.Value;
   if(parameter?.Type!=='SecureString'||parameter.Version!==1||typeof key!=='string'||
     !/^sk-[A-Za-z0-9_-]{10,}$/.test(key))return {verified:false,reason:'credential-format'};
   const response=await metadataFetch('https://api.openai.com/v1/models/gpt-6-luna',{
    method:'GET',headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(8000)
   });
   if(!response.ok)return {verified:false,reason:'model-metadata-denied',httpStatus:response.status};
   const body=await response.json();
   return {verified:body.id==='gpt-6-luna',secureString:true,version:1,
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
