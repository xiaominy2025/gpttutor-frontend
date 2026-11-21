import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterEach,expect,it,vi} from 'vitest';
import {canarySource} from '../../server/platform/navigator-paid-guard.mjs';
import {openCanaryJournal} from '../../server/platform/navigator-canary-journal.mjs';

const epoch=Date.UTC(2026,10,21,12);
const manifest={source:canarySource,approval:'journal-fixture-only',startsAt:epoch,endsAt:epoch+1800000};
const artifactSha256='a'.repeat(64);
const cookie='__Host-engent-navigator='+'a'.repeat(43)+'.'+'1'.repeat(10)+'.'+'n'.repeat(43);
const receipt=step=>String(step).repeat(43);
const continuation='1'.repeat(13)+'.'+'a'.repeat(24)+'.'+'b'.repeat(64);
const reply='private synthetic transcript excluded from journal';
const directories=[];
function response(step){
 if(step===0)return {status:200,cookie};
 return {status:200,canary:{state:step===4?'complete':'ready',spentMicros:step*28,
  usage:{step,inputs:100,outputs:30,cost:28,bytes:1000,requestHash:'f'.repeat(64),withinBounds:true},
  ...(step<4?{receipt:receipt(step)}:{})},
  result:{reply,followUps:[],done:step===4,continuation:step===4?null:continuation}};
}
function fixture(transport=vi.fn(async({step})=>response(step))){
 const directory=mkdtempSync(join(tmpdir(),'navigator-journal-'));
 directories.push(directory);
 const args={directory,manifest,artifactSha256,now:()=>epoch,transport};
 return {args,run:openCanaryJournal(args),transport};
}
const entries=filename=>readFileSync(filename,'utf8').trim().split('\n').map(JSON.parse);
afterEach(()=>{for(const directory of directories.splice(0))rmSync(directory,{recursive:true,force:true});});

it('acks bootstrap and exactly four dispatch slots after pending is durable, retaining only sanitized records',async()=>{
 const transport=vi.fn(async({step,previous,binding})=>{
  expect(entries(run.filename).at(-1)).toEqual({event:'pending',step});
  expect(binding).toMatchObject({artifactSha256,source:manifest.source,approval:manifest.approval,run:'alpha-initial'});
  if(step===1)expect(previous.cookie).toBe(cookie);
  if(step===2)expect(previous.canary.receipt).toBe(receipt(1));
  return response(step);
 });
 const {args,run}=fixture(transport);
 for(let step=0;step<=4;step++){
  expect(await run.runStep()).toMatchObject({step,state:step===4?'complete':'ready'});
 }
 await expect(run.runStep()).rejects.toThrow('does not allow');
 expect(transport).toHaveBeenCalledTimes(5);
 expect(()=>openCanaryJournal(args)).toThrow('already exists');
 const records=entries(run.filename);
 expect(records.filter(x=>x.event==='acknowledged').map(x=>x.step)).toEqual([0,1,2,3,4]);
 const text=readFileSync(run.filename,'utf8');
 for(const secret of [cookie,reply,receipt(1),continuation])expect(text).not.toContain(secret);
 expect(records.at(-1)).toMatchObject({step:4,costMicros:28,spentMicros:112});
});

it.each([429,503])('never retries after pre-claim rejection (%s)',async status=>{
 const {args,run,transport}=fixture(vi.fn(async({step})=>step===0?response(0):{status}));
 await run.runStep();
 await expect(run.runStep()).rejects.toThrow('invalid-result');
 await expect(run.runStep()).rejects.toThrow('does not allow');
 expect(()=>openCanaryJournal(args)).toThrow('already exists');
 expect(transport).toHaveBeenCalledTimes(2);
 expect(entries(run.filename).slice(-2)).toEqual([
  {event:'pending',step:1},{event:'stopped',step:1,reason:'invalid-result'}
 ]);
});

it('stops permanently on transport response loss and sanitizes the exception',async()=>{
 const transport=vi.fn(async()=>{throw Error('raw-cookie-must-not-leak');});
 const {args,run}=fixture(transport);
 await expect(run.runStep()).rejects.toThrow('transport-uncertain');
 expect(()=>openCanaryJournal(args)).toThrow('already exists');
 expect(readFileSync(run.filename,'utf8')).not.toContain('raw-cookie');
 expect(transport).toHaveBeenCalledTimes(1);
});

it('excludes a second writer and rejects another in-flight call',async()=>{
 let settle;
 const {args,run,transport}=fixture(vi.fn(()=>new Promise(resolve=>{settle=resolve;})));
 try{
  const pending=run.runStep();
  expect(()=>openCanaryJournal(args)).toThrow('already exists');
  await expect(run.runStep()).rejects.toThrow('does not allow');
  expect(()=>run.close()).toThrow('pending');
  settle(response(0));
  expect(await pending).toMatchObject({step:0});
  expect(transport).toHaveBeenCalledTimes(1);
 }finally{run.close();}
});

it('does not reopen an acknowledged run after its in-memory capabilities are lost',async()=>{
 const {args,run}=fixture();
 await run.runStep();
 run.close();
 expect(()=>openCanaryJournal(args)).toThrow('already exists');
});

it('retains a pending marker on actual process termination and rejects restart',()=>{
 const directory=mkdtempSync(join(tmpdir(),'navigator-journal-crash-'));
 directories.push(directory);
 const options={directory,manifest,artifactSha256};
 const moduleUrl=pathToFileURL(resolve('server/platform/navigator-canary-journal.mjs')).href;
 const source=`import {openCanaryJournal} from ${JSON.stringify(moduleUrl)};
  const run=openCanaryJournal({...JSON.parse(process.argv[1]),now:()=>${epoch},transport:()=>process.exit(79)});
  await run.runStep();`;
 const crashed=spawnSync(process.execPath,['--input-type=module','-e',source,JSON.stringify(options)]);
 expect(crashed.status).toBe(79);
 const filename=join(directory,'navigator-alpha-initial.ndjson');
 expect(entries(filename).at(-1)).toEqual({event:'pending',step:0});
 expect(()=>openCanaryJournal({...options,now:()=>epoch,transport:vi.fn()})).toThrow('already exists');
});

it.each(['invalid','duplicate','wrong-cost','wrong-step','bad-continuation'])('stops on a %s acknowledgement',async mode=>{
 const {run}=fixture(vi.fn(async({step})=>{
  const value=response(step);
  if(step===2){
   if(mode==='invalid')value.canary.receipt='malformed';
   if(mode==='duplicate')value.canary.receipt=receipt(1);
   if(mode==='wrong-cost')value.canary.usage.cost=0;
   if(mode==='wrong-step')value.canary.usage.step=3;
   if(mode==='bad-continuation')value.result.continuation='bad';
  }
  return value;
 }));
 await run.runStep();
 await run.runStep();
 await expect(run.runStep()).rejects.toThrow('invalid-result');
 await expect(run.runStep()).rejects.toThrow('does not allow');
 expect(entries(run.filename).filter(x=>x.event==='acknowledged')).toHaveLength(2);
});
