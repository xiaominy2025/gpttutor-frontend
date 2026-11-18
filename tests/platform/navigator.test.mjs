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
   text:JSON.stringify({kind:final?'guide':'clarify',reply:final?'The choice turns on whether extra capacity solves a recurring bottleneck or only covers a brief peak.':'What would change your choice?'})}]}]};
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
  'The objective is qualifying for data-science roles. A degree buys a credential, while coursework or a portfolio can demonstrate skills with less debt. Which path fits depends on what your target roles require and how much financial risk you are comfortable taking.'],
 ['AI triage','Should our 30-person support team spend $80,000 annually on AI triage? We have no baseline for misrouted tickets.',
  null,'The objective is more accurate routing at a cost the team can justify. The current process, a limited pilot, and a full subscription differ in cost and reversibility. Without a baseline, you cannot tell how much the tool improves routing. How much improvement would justify the cost rests on what misroutes cost your team and customers.'],
 ['lease option','A lease option expires before regulatory approval. I can pay a fee to hold it for six months or sign now.',
  ['What would each option cost if approval is denied?','The hold costs $25,000; signing now leaves $180,000 owed.'],
  'The hold buys time, while signing now secures the site with greater exposure if approval fails. An approval contingency, if available, changes that trade-off. The choice depends on how hard the site would be to replace and what loss the business can tolerate.'],
 ['packaging orders','We order packaging monthly. We have two years of orders with promotions and holiday peaks. How much should we commit next quarter?',
  ['How quickly can you top up an order if demand is higher than expected?','We can top up monthly with a three-week lead time.'],
  'A large order protects against stockouts but ties up cash. Monthly top-ups preserve flexibility if three weeks is short enough to respond to a demand spike. The useful comparison is how much shipment risk you can tolerate relative to the cost of holding extra packaging.'],
 ['shift scheduling','I schedule 25 operators on three lines. There are skill requirements, max hours, overtime and minimum daily output.',
  ['Once minimum output is covered, what do you most want the schedule to improve?','Minimize overtime next week.'],
  'Skill coverage and minimum output define which schedules are feasible. Among those schedules, lower overtime may mean less slack when someone is absent. Your tolerance for that disruption determines how much flexibility is worth paying for.'],
 ['kettle','My kettle takes a minute longer to boil now. Should I replace it? It still works and money is tight.',
  null,'Keeping, cleaning if appropriate, and replacing the kettle trade off convenience and cash. If it continues to work safely, the value of saving a minute depends on how often you use it and how tight the budget is.'],
 ['irreversible equipment purchase','Our plant is considering a $1.2 million custom production line with no resale market. We only have verbal demand estimates, but a contract manufacturer could make the first batch.',
  null,'The custom line offers control but makes an irreversible commitment before demand is firm. A contract batch preserves the option to wait at the cost of less control and potentially higher unit costs. The trade-off depends on how much those constraints matter while you learn whether demand holds.'],
 ['transit pass trade-off','A $60 monthly transit pass covers eight round trips I expect to take. Tickets cost $6 per round trip. I am on a tight budget and might take one more trip.',
  null,'The pass fixes the cost upfront, while tickets let you pay only for trips you take. Eight trips cost $48 and nine cost $54. The costs match at ten trips. The trade-off is whether any convenience or additional travel is worth committing scarce cash upfront.']
];

function mockReply(kind,reply) {
 return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{
  type:'output_text',text:JSON.stringify({kind,reply})
 }]}]};
}

it.each(refinementCases)('asks only for decision-changing context and returns a clear mock decision map for %s',async(_name,message,clarification,guidance)=>{
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
 expect(request.instructions).toContain('tolerance for risk');
 expect(request.instructions).toContain('how relevant alternatives serve competing objectives');
 expect(request.instructions).toContain('materially improve understanding');
 expect(request.instructions).toContain('Leave the choice with the student');
 expect(request.instructions).toContain('verify any factual or numerical claim');
 expect(request.text.format.schema.required).toEqual(['kind','reply']);
 expect(result).toMatchObject({statusCode:200,done:true,continuation:null,reply:guidance});
 expect(generate).toHaveBeenCalledTimes(clarification?2:1);
});
