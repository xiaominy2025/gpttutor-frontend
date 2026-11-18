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
   text:JSON.stringify({kind:'guide',reply:final?'The choice turns on whether extra capacity solves a recurring bottleneck or only covers a brief peak.':request.input.length===1?'Which outcome would make the extra capacity worthwhile?':'Reliable deliveries are your priority. Seasonal demand could make a temporary shift worth considering.'})}]}]};
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
 const competing=await Promise.all([
  ask(first.history,first.continuation,'a'.repeat(43),'Reliable delivery is the objective.'),
  ask(first.history,first.continuation,'a'.repeat(43),'Reliable delivery is the objective.')
 ]);
 expect(competing.map(response=>response.statusCode).sort()).toEqual([200,409]);
 const second=competing.find(response=>response.statusCode===200);
 expect(second).toMatchObject({done:false,reply:expect.stringContaining('Seasonal demand')});
 expect(second.reply).not.toMatch(/\?/);
 expect(generate.mock.lastCall[1].instructions).toContain('Do not repeat the previous question');
 const third=await ask(second.history,second.continuation,'a'.repeat(43),'What if the peak is temporary?');
 expect(third).toMatchObject({statusCode:200,done:true,continuation:null});
 expect(generate.mock.lastCall[1].text.format.schema.properties.kind.enum).toEqual(['guide']);
 expect(generate.mock.lastCall[1].instructions).toContain('do not ask a question');
 expect((await ask(third.history,second.continuation)).statusCode).toBe(400);
 expect((await ask(first.history,first.continuation)).statusCode).toBe(409);
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
 ['chemistry internship versus academic research','I am a chemistry student deciding between an industry internship and an academic research placement. I want to explore both industry and graduate school. How can I think through the choice?',
  null,'Both placements can build chemistry skills, but they can answer different questions about your future. The internship may show how teams use chemistry to solve production or product problems, while research may show how you enjoy investigating an open question. The actual work and mentorship matter more than the titles. The comparison depends on which uncertainty you most want to resolve this summer and what opportunities you might have to explore the other path later.'],
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
 ['purposeful waiting','A nonrefundable venue deposit is due in two weeks. I get a reliable attendance estimate next week, and the venue can hold the date until then.',
  null,'Waiting for the estimate has a purpose: it could change which venue fits, and you can learn it before losing the date. Waiting beyond that point may offer little unless another useful signal is coming. The judgment is how much booking risk you can accept for better information.'],
 ['reversible learning','We can buy equipment now or rent it for one month. Orders are promising but unconfirmed, and renting costs more per week.',
  null,'Renting buys flexibility and a chance to learn whether the orders are durable. Buying saves on repeated rental if demand holds, but commits cash before you know. A month of actual orders could give you a reason to revisit the choice. Even a well-judged trial can turn out poorly.'],
 ['narrow alternatives and fear of mistakes','I can either accept a permanent lab role or stay in my current job. I keep delaying because I am afraid of regretting either choice.',
  null,'The options differ in stability and what you would learn about lab work. A short placement or a chance to shadow the team could make the choice less all-or-nothing, if available. Waiting can help if useful information is coming. A well-considered decision can still disappoint.\n\nWhat could you learn by waiting that would actually change how you compare these options?'],
 ['reconsidering as circumstances change','I chose a paid internship to support my final year, but my funding changed and a research placement reopened. How might I revisit the decision?',
  null,'Your original choice responded to your financial constraint. With funding changed, the research placement and internship can be compared again against the experience you want before graduation. Reconsidering makes sense if the new funding changes which options are feasible.\n\nWhat part of your original reasoning still holds now that the money constraint has changed?'],
 ['transit pass trade-off','A $60 monthly transit pass covers eight round trips I expect to take. Tickets cost $6 per round trip. I am on a tight budget and might take one more trip.',
  null,'The pass fixes the cost upfront, while tickets let you pay only for trips you take. Eight trips cost $48 and nine cost $54. The costs match at ten trips. The trade-off is whether any convenience or additional travel is worth committing scarce cash upfront.']
];

function mockReply(kind,reply) {
 return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{
  type:'output_text',text:JSON.stringify({kind,reply})
 }]}]};
}

it.each(refinementCases)('returns a mock decision map and leaves a voluntary follow-up available for %s',async(_name,message,clarification,guidance)=>{
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
 expect(request.instructions).toContain('a sound decision can still turn out badly');
 expect(request.instructions).toContain('whether waiting would bring useful information or merely postpone the choice');
 expect(request.instructions).toContain('Treat acting and waiting as alternatives');
 expect(request.instructions).toContain('reversibility, staged commitments, feedback');
 expect(request.instructions).toContain('Objectives → Analysis → Human Judgment');
 expect(request.instructions).toContain('tolerance for risk');
 expect(request.instructions).toContain('how relevant alternatives serve competing objectives');
 expect(request.instructions).toContain('only if helpful');
 expect(request.instructions).toContain('without ranking, recommending, or favoring one');
 expect(request.instructions).toContain('Use conditional comparisons');
 expect(request.instructions).toContain('Do not infer a weakness simply because a detail is absent');
 expect(request.instructions).toContain('two to four short natural paragraphs');
 expect(request.instructions).toContain('leave the choice with the student');
 expect(request.instructions).toContain('Verify factual and numerical claims');
 expect(request.text.format.schema.required).toEqual(['kind','reply']);
 expect(result).toMatchObject({statusCode:200,done:false,continuation:expect.any(String),reply:guidance});
 expect(generate).toHaveBeenCalledTimes(clarification?2:1);
});
