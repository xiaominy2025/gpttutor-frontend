import {describe,it,expect,vi} from 'vitest';
import {credentialChecker} from '../../server/platform/navigator-credential-check.mjs';
const context={invokedFunctionArn:'arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:$LATEST'};
const event={operation:'verify-credential'},environment={STAGE:'alpha',NAVIGATOR_ENABLED:'false'};
const secret='sk-private_test_value_not_a_real_key';
function setup(overrides={}) {
 const readParameter=vi.fn(async()=>({Value:secret,Type:'SecureString',Version:1}));
 const metadataFetch=vi.fn(async()=>({ok:true,json:async()=>({id:'gpt-6-luna'})}));
 return {readParameter,metadataFetch,run:credentialChecker({readParameter,metadataFetch,environment,...overrides})};
}
describe('private credential verification',()=>{
 it('checks metadata once without generation or returning key material',async()=>{
  const s=setup(),result=await s.run(event,context);
  expect(result.verified).toBe(true);expect(JSON.stringify(result)).not.toContain(secret);
  expect(s.metadataFetch).toHaveBeenCalledTimes(1);
  expect(s.metadataFetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/models/gpt-6-luna');
  expect(s.metadataFetch.mock.calls[0][1].method).toBe('GET');
 });
 it.each(['1','live'])('rejects public or numbered invocations: %s',async qualifier=>{
  const s=setup();expect((await s.run(event,{invokedFunctionArn:context.invokedFunctionArn.replace('$LATEST',qualifier)})).verified).toBe(false);
  expect(s.readParameter).not.toHaveBeenCalled();
 });
 it('rejects gateway events and enabled configuration before reading a key',async()=>{
  const s=setup();await s.run({...event,requestContext:{}},context);expect(s.readParameter).not.toHaveBeenCalled();
  const t=setup({environment:{...environment,NAVIGATOR_ENABLED:'true'}});await t.run(event,context);expect(t.readParameter).not.toHaveBeenCalled();
 });
 it.each([' '+secret,JSON.stringify({key:secret}),secret+'\n'])('rejects wrapped or whitespace credentials',async Value=>{
  const s=setup({readParameter:async()=>({Value,Type:'SecureString',Version:1})});
  expect((await s.run(event,context)).reason).toBe('credential-format');expect(s.metadataFetch).not.toHaveBeenCalled();
 });
 it('sanitizes exceptions and makes no retry',async()=>{
  const metadataFetch=vi.fn(async()=>{throw Error(secret);}),s=setup({metadataFetch});
  expect(JSON.stringify(await s.run(event,context))).not.toContain(secret);expect(metadataFetch).toHaveBeenCalledTimes(1);
 });
});
