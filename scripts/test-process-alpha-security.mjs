if(!process.argv.includes('--approved-alpha'))throw Error('Explicit --approved-alpha required; no live sign-in or AI calls.');
import{createHash}from'node:crypto';import{writeFileSync}from'node:fs';import{pathToFileURL}from'node:url';
const origin='https://d6owpirihdsus.cloudfront.net',direct='https://xfn2ffdvfjtycxmdwp4dvwqbne0gyzsc.lambda-url.us-east-1.on.aws';const{chemistryWorkbook}=await import(pathToFileURL((process.env.PROCESS_CHECKOUT??'')+'/tests/fixtures/chemistry-workbook.mjs'));const project=chemistryWorkbook();project.decision+=' — résumé/café';const body=JSON.stringify({project,scope:'baseline',stage:1,seen:[]}),hash=createHash('sha256').update(body).digest('hex');const results=[];
async function check(name,url,options,expected){const r=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(25000)});const text=await r.text();results.push({name,status:r.status,expected,body:text.slice(0,260)});if(!expected.includes(r.status))throw Error(name+' unexpected '+r.status+' '+text.slice(0,100));}
const headers={origin,'content-type':'application/json','x-amz-content-sha256':hash,'x-process-request-id':'00000000-0000-4000-8000-000000000001'};
try{
await check('Guest status',origin+'/api/process/workbook/status',{},[200]);
await check('valid UTF8 hashed POST remains unauthorized',origin+'/api/process/workbook/suggestions',{method:'POST',headers,body},[401]);
const missing={...headers};delete missing['x-amz-content-sha256'];await check('missing payload hash rejected',origin+'/api/process/workbook/suggestions',{method:'POST',headers:missing,body},[400,403]);
await check('tampered payload rejected',origin+'/api/process/workbook/suggestions',{method:'POST',headers,body:body+' '},[400,403]);
await check('forged identity metadata does not authorize',origin+'/api/process/workbook/suggestions',{method:'POST',headers:{...headers,'x-user-id':'student','x-user-role':'advanced','x-forwarded-user':'student','x-amzn-request-context':'{"authorizer":{"subject":"student"}}'},body},[401]);
await check('cross-origin denied',origin+'/api/process/workbook/suggestions',{method:'POST',headers:{...headers,origin:'https://attacker.invalid'},body},[403]);
await check('direct Function URL GET denied',direct+'/api/process/workbook/status',{},[403]);
await check('direct Function URL POST denied',direct+'/api/process/workbook/suggestions',{method:'POST',headers,body},[403]);
await check('shared IAM endpoint unsigned denied','https://8qmgd1ghdi.execute-api.us-east-1.amazonaws.com/internal/coaches/process/session',{method:'POST',headers:{'content-type':'application/json'},body:'{}'},[403]);
console.log(JSON.stringify({passed:true,results}));}finally{writeFileSync('.artifacts/alpha-retry/security-results.json',JSON.stringify({paidAI:false,liveEmail:false,requestBodyBytes:Buffer.byteLength(body),payloadHash:hash,results},null,2));}
