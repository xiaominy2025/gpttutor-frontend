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
   text:JSON.stringify({kind:'guide',reply:final?'Duration belongs in your evidence, while acceptable disruption depends on your priorities. A later change in demand could justify revisiting your judgment.':request.input.length===1?'Which outcome would make the extra capacity worthwhile?':'Reliable deliveries are your priority. Seasonal demand makes it important to separate a temporary problem from a lasting one before committing.'})}]}]};
 });
 const app=platformApp({enabled:true,navigator:true,origin,treeOrigin:'https://decisiontree.engentlabs.com',
  oauth:{session:async()=>null},credentials:async()=>({key:'mock',ipSecret:'fixture-secret'}),
  price:{model:'gpt-6-luna',input:0.1,output:0.5},controls,generate,conversationStore});
 async function ask(history=[],continuation,guest='a'.repeat(43),message='Should we invest in capacity now?',dimension) {
  const {statusCode,body}=await app({rawPath:'/api/platform/navigator',headers:{origin},cookies:['__Host-engent-guest='+guest],
   requestContext:{http:{method:'POST',sourceIp:'127.0.0.1'}},body:JSON.stringify({history,continuation,message,dimension})});
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
 expect(generate.mock.lastCall[1].instructions).toContain('Do not repeat the earlier question');
 const third=await ask(second.history,second.continuation,'a'.repeat(43),'What if the peak is temporary?');
 expect(third).toMatchObject({statusCode:200,done:true,continuation:null});
 expect(generate.mock.lastCall[1].text.format.schema.properties.kind.enum).toEqual(['guide']);
 expect(generate.mock.lastCall[1].instructions).toContain('ask no questions');
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

// These fixtures exercise request, response and continuation behavior. Real model replies are evaluated separately.
const processCases=[
 ['linked chemistry decisions',"I'm studying chemistry at Rice University, second year, graduating in two years. I'm unsure whether to pursue a Ph.D. or find a job after my B.S. Should I seek an industry internship or lab research this summer?",
  null,'You are connecting a summer decision with a later career decision. Clarifying what this summer needs to achieve gives you a basis for examining opportunities without expecting one experience to settle your career. Have you defined a summer priority before looking at particular roles?'],
 ['business investment','We want to buy faster equipment because orders are late.',
  null,'Keep the outcome separate from the proposed means: reliable delivery is the objective, and more speed is one hypothesis about how to reach it. The useful evidence is what would tell you whether speed addresses the underlying cause.'],
 ['competing objectives','I want a senior project that fits my job, interests me, and shows employers my skills.',
  ['How have you separated requirements from preferences?','My work hours cannot change.'],
  'Treat fixed work hours as a requirement before weighing preferences. That keeps a project from looking suitable only because its other qualities hide an infeasible schedule.'],
 ['irreversible commitment','Our makerspace may sign a five-year lease before we know future attendance.',
  null,'A long commitment makes the limits of your assumptions important. Identify what you would need to believe about future demand and what evidence could challenge that belief before the decision becomes costly to reverse.'],
 ['purposeful waiting','A venue will hold a date for ten days and a reliable attendance estimate arrives in five.',
  null,'Tie the decision to the value of the information and the deadline. Waiting can improve a judgment when useful evidence arrives in time. What would the estimate need to change for the wait to matter?'],
 ['fear of mistakes','I keep postponing a club leadership decision because a disappointing result would feel like failure.',
  null,'Separate the quality of your reasoning from the eventual outcome. You can look for information that could change your judgment, decide what uncertainty remains acceptable, and revisit your assumptions if new evidence appears.']
];

function mockReply(kind,reply) {
 return {usage:{input_tokens:100,output_tokens:30},output:[{content:[{
  type:'output_text',text:JSON.stringify({kind,reply})
 }]}]};
}

it.each(processCases)('returns a mock decision map and leaves a voluntary follow-up available for %s',async(_name,message,clarification,guidance)=>{
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
 expect(request.instructions).toContain('Do not evaluate, compare the merits of, rank, or select their options');
 expect(request.instructions).toContain('Use the scenario to illustrate the reasoning move');
 expect(request.instructions).toContain('Do not ask them to choose between priorities');
 expect(request.instructions).toContain('Do not ask for an option preference or for facts so you can do the analysis');
 expect(request.text.format.schema.required).toEqual(['kind','reply','followUps','exploredDimension']);
 expect(result).toMatchObject({statusCode:200,done:false,continuation:expect.any(String),reply:guidance});
 expect(generate).toHaveBeenCalledTimes(clarification?2:1);
});

const chemistry="I'm studying chemistry at Rice University, second year, graduating in two years. I'm unsure whether to pursue a Ph.D. or find a job after my B.S. Should I seek an industry internship or lab research this summer?";
const chemistryPaths=[
 {dimension:'objectives',question:'How can I separate my summer objectives from my eventual career decision?'},
 {dimension:'analysis',question:'How can I test my assumptions about each kind of work?'},
 {dimension:'judgment',question:'How can I decide when I have learned enough to revisit my plans?'}
];
function mockPaths(followUps,exploredDimension=null){
 return {usage:{input_tokens:100,output_tokens:80},output:[{content:[{type:'output_text',
  text:JSON.stringify({kind:'guide',reply:'Separate what this decision needs to accomplish from what you can learn later.',followUps,exploredDimension})
 }]}]};
}

it('binds the three paths to the continuation, preserves unselected paths, and closes after round three',async()=>{
 const {ask,generate,controls}=setup();
 const guest='a'.repeat(43);
 generate.mockResolvedValueOnce(mockPaths(chemistryPaths));
 const first=await ask([],undefined,guest,chemistry);
 expect(first).toMatchObject({statusCode:200,done:false,followUps:chemistryPaths});
 const token=first.continuation;
 expect((await ask(first.history,token,guest,'Unissued question?','objectives')).statusCode).toBe(400);
 expect((await ask(first.history,token,guest,chemistryPaths[0].question,'judgment')).statusCode).toBe(400);
 const altered=token.slice(0,token.lastIndexOf('.')+1)+'W10';
 expect((await ask(first.history,altered,guest,chemistryPaths[0].question,'objectives')).statusCode).toBe(400);
 expect(controls.admit).toHaveBeenCalledTimes(1);

 const revised={dimension:'analysis',question:'How can I tell what evidence from summer work applies to my later career decision?'};
 generate.mockResolvedValueOnce(mockPaths([revised,chemistryPaths[0]],'judgment'));
 const second=await ask(first.history,token,guest,chemistryPaths[0].question,'objectives');
 expect(second).toMatchObject({statusCode:200,done:false,followUps:[revised,chemistryPaths[2]]});
 expect(generate.mock.lastCall[1].instructions).toContain('The student selected objectives');
 expect((await ask(first.history,token,guest,chemistryPaths[0].question,'objectives')).statusCode).toBe(409);
 expect((await ask(second.history,second.continuation,guest,chemistryPaths[0].question,'objectives')).statusCode).toBe(400);

 generate.mockResolvedValueOnce(mockPaths(chemistryPaths));
 const final=await ask(second.history,second.continuation,guest,'I can treat the summer as one sample. How can I revisit my assumptions later?');
 expect(final).toMatchObject({statusCode:200,done:true,followUps:[],continuation:null});
 expect(generate).toHaveBeenCalledTimes(3);
});

it.each([
 ['I saw the word analysis in the reply.',null,chemistryPaths],
 ['How can I decide what evidence would disprove my assumptions?', 'analysis',[chemistryPaths[0],chemistryPaths[2]]]
])('keeps or removes a dimension based on meaningful free-form exploration: %s',async(message,explored,expected)=>{
 const {ask,generate}=setup();
 const guest='a'.repeat(43);
 generate.mockResolvedValueOnce(mockPaths(chemistryPaths));
 const first=await ask([],undefined,guest,chemistry);
 generate.mockResolvedValueOnce(mockPaths([],explored));
 const second=await ask(first.history,first.continuation,guest,message);
 expect(second.followUps).toEqual(expected);
 expect(generate.mock.lastCall[1].instructions).toContain('never for a passing mention');
});
