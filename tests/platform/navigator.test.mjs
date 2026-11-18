import {it,expect,vi} from 'vitest';
import {platformApp} from '../../server/platform/app.mjs';

const origin='https://www.engentlabs.com';
function setup() {
 const claims=new Set();
 const conversationStore={
  replace:async id=>{if(claims.has(id))return false;claims.add(id);return true;},
  remove:async id=>claims.delete(id)
 };
 const controls={admit:vi.fn(async()=>({})),settle:vi.fn(async()=>{})};
 const generate=vi.fn(async (_key,request)=>{
  const final=request.input.length===5;
  return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{type:'output_text',
   text:JSON.stringify({kind:final?'guide':'clarify',reply:final?'Map what you can learn before committing.':'What would change your choice?',coach:'tree'})}]}]};
 });
 const app=platformApp({enabled:true,navigator:true,origin,treeOrigin:'https://decisiontree.engentlabs.com',
  oauth:{session:async()=>null},credentials:async()=>({key:'mock',ipSecret:'fixture-secret'}),
  price:{model:'gpt-6-luna',input:0.1,output:0.5},controls,generate,conversationStore});
 async function ask(history=[],continuation,guest='a'.repeat(43)) {
  const message='Should we invest in capacity now?';
  const {statusCode,body}=await app({rawPath:'/api/platform/navigator',headers:{origin},cookies:['__Host-engent-guest='+guest],
   requestContext:{http:{method:'POST',sourceIp:'127.0.0.1'}},body:JSON.stringify({history,continuation,message})});
  const response=JSON.parse(body);
  return {...response,statusCode,history:[...history,{role:'user',text:message},{role:'assistant',text:response.reply}]};
 }
 return {ask,controls,generate};
}

it('authenticates history, binds it to the caller, and completes the third turn',async()=>{
 const {ask,generate,controls}=setup();
 const first=await ask();
 expect(first).toMatchObject({statusCode:200,done:false});
 expect(first.coach).toBeUndefined();
 expect((await ask(first.history)).statusCode).toBe(400);
 expect((await ask(first.history,first.continuation,'b'.repeat(43))).statusCode).toBe(400);
 expect((await ask([{...first.history[0],text:'Different'},first.history[1]],first.continuation)).statusCode).toBe(400);
 const second=await ask(first.history,first.continuation);
 const third=await ask(second.history,second.continuation);
 expect(third).toMatchObject({statusCode:200,done:true,continuation:null,
  coach:{name:'Decision Tree Coach',url:'https://decisiontree.engentlabs.com/'}});
 expect(generate.mock.lastCall[1].text.format.schema.properties.kind.enum).toEqual(['guide']);
 expect((await ask(third.history,third.continuation)).statusCode).toBe(400);
 expect((await ask(second.history,second.continuation)).statusCode).toBe(409);
 expect(controls.admit).toHaveBeenCalledTimes(3);
});

it('allows a failed clarification attempt to be retried and charges the uncertain call',async()=>{
 const {ask,generate,controls}=setup();
 const first=await ask();
 generate.mockRejectedValueOnce(new Error('mock timeout'));
 expect((await ask(first.history,first.continuation)).statusCode).toBe(503);
 expect(controls.settle).toHaveBeenCalledWith({},0,true);
 expect((await ask(first.history,first.continuation)).statusCode).toBe(200);
});
