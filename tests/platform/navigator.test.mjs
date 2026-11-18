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
   text:JSON.stringify({kind:final?'guide':'clarify',reply:final?'Map what you can learn before committing.':'What would change your choice?'})}]}]};
 });
 const app=platformApp({enabled:true,navigator:true,origin,treeOrigin:'https://decisiontree.engentlabs.com',
  oauth:{session:async()=>null},credentials:async()=>({key:'mock',ipSecret:'fixture-secret'}),
  price:{model:'gpt-6-luna',input:0.1,output:0.5},controls,generate,conversationStore});
 async function ask(history=[],continuation,guest='a'.repeat(43),message='Should we invest in capacity now?') {
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
 expect((await ask(first.history)).statusCode).toBe(400);
 expect((await ask(first.history,first.continuation,'b'.repeat(43))).statusCode).toBe(400);
 expect((await ask([{...first.history[0],text:'Different'},first.history[1]],first.continuation)).statusCode).toBe(400);
 const second=await ask(first.history,first.continuation);
 const third=await ask(second.history,second.continuation);
 expect(third).toMatchObject({statusCode:200,done:true,continuation:null});
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

const refinementCases=[
 ['graduate school',"Should I do a master's?",
  ['What job would you want the degree to help you get?','I want a data scientist role and would need a loan.'],
  'The degree is only one way to close the hiring gap. Review ten jobs you would apply for and tally how many require the degree.'],
 ['AI triage','Should our 30-person support team spend $80,000 annually on AI triage? We have no baseline for misrouted tickets.',
  null,'A baseline gives a pilot something to beat. Audit 100 recent tickets and count how many were sent to the wrong queue.'],
 ['lease option','A lease option expires before regulatory approval. I can pay a fee to hold it for six months or sign now.',
  ['What would each option cost if approval is denied?','The hold costs $25,000; signing now leaves $180,000 owed.'],
  'An approval contingency could preserve the site while limiting the downside. Ask the landlord for a written approval-contingent lease before paying either amount.'],
 ['packaging orders','We order packaging monthly. We have two years of orders with promotions and holiday peaks. How much should we commit next quarter?',
  ['How quickly can you top up an order if demand is higher than expected?','We can top up monthly with a three-week lead time.'],
  'A monthly top-up can limit how much cash you tie up. Compare a baseline forecast with actual packaging use during last year’s comparable promotion to size a buffer.'],
 ['shift scheduling','I schedule 25 operators on three lines. There are skill requirements, max hours, overtime and minimum daily output.',
  ['Once minimum output is covered, what do you most want the schedule to improve?','Minimize overtime next week.'],
  'Treat skill coverage and output as requirements, then compare overtime across feasible shifts. Build next week’s coverage grid with each shift’s required skills and qualified operators.'],
 ['kettle','My kettle takes a minute longer to boil now. Should I replace it? It still works and money is tight.',
  null,'If it works safely, a small slowdown does not justify replacing it yet. Check the manual for the recommended way to remove limescale.'],
 ['irreversible equipment purchase','Our plant is considering a $1.2 million custom production line with no resale market. We only have verbal demand estimates, but a contract manufacturer could make the first batch.',
  null,'A contract batch can test whether orders materialize before you commit to equipment. Ask for a one-batch quote with lead time and minimum quantity.'],
 ['simple break-even decision','Should I buy a monthly transit pass? I expect eight round trips this month, and a pass costs $60.',
  null,'At eight round trips, the pass breaks even at $7.50 per round trip. Check the fare for one round trip and compare it with $7.50.']
];

function mockReply(kind,reply) {
 return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{
  type:'output_text',text:JSON.stringify({kind,reply})
 }]}]};
}

it.each(refinementCases)('asks only for decision-changing context and returns a useful mock starting point for %s',async(_name,message,clarification,guidance)=>{
 const {ask,generate}=setup();
 const guest='a'.repeat(43);
 let result;
 if(clarification) {
  const [question,answer]=clarification;
  generate.mockResolvedValueOnce(mockReply('clarify',question));
  const first=await ask([],undefined,guest,message);
  expect(first).toMatchObject({statusCode:200,done:false,reply:question});
  expect(first.continuation).toEqual(expect.any(String));
  generate.mockResolvedValueOnce(mockReply('guide',guidance));
  result=await ask(first.history,first.continuation,guest,answer);
  expect(generate.mock.lastCall[1].input.map(row=>row.content)).toEqual([message,question,answer]);
 } else {
  generate.mockResolvedValueOnce(mockReply('guide',guidance));
  result=await ask([],undefined,guest,message);
 }

 const request=generate.mock.calls[0][1];
 expect(request.instructions).toContain('Objectives → Analysis → Human Judgment');
 expect(request.instructions).toContain('their priorities or judgment');
 expect(request.instructions).toContain('one useful insight and end with one concrete first action');
 expect(request.instructions).toContain('materially change your guidance');
 expect(request.instructions).toContain('end without a follow-up question or invitation');
 expect(request.text.format.schema.required).toEqual(['kind','reply']);
 expect(result).toMatchObject({statusCode:200,done:true,continuation:null,reply:guidance});
 expect(generate).toHaveBeenCalledTimes(clarification?2:1);
});
