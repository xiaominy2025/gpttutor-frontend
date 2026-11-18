const key=process.env.NAVIGATOR_OPENAI_API_KEY?.trim();
const model='gpt-6-luna';
if (!key) {
 console.error('Navigator key is missing. Set NAVIGATOR_OPENAI_API_KEY in a server-only local environment.');
 process.exitCode=1;
} else {
 try {
  const response=await fetch('https://api.openai.com/v1/models/'+model,{
   headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(10000)
  });
  if (!response.ok || (await response.json()).id!==model) {
   console.error('Model access was not verified (HTTP '+response.status+').');
   process.exitCode=1;
  } else {
   console.log('Dedicated Navigator credential can access '+model+'. Model metadata only.');
  }
 } catch {
  console.error('Navigator model metadata request failed.');
  process.exitCode=1;
 }
}
