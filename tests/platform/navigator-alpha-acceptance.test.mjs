import {expect,it,vi} from 'vitest';
import {pilot} from '../../server/platform/budget.mjs';
import {handlerEntry,runNavigatorAcceptance} from '../../server/platform/navigator-alpha-acceptance.mjs';

function makeStore(prefix){
 expect(prefix).toMatch(/^NAVIGATOR#acceptance#[0-9a-f-]+#[a-z-]+#$/);
 const rows=new Map();
 const correct=(id,version)=>version===(rows.get(id)?.version??0);
 const put=(id,version,value)=>rows.set(id,{...structuredClone(value),version:version+1});
 return {
  get:async id=>structuredClone(rows.get(id)),
  replace:async(id,version,value)=>{
   if(!correct(id,version))return false;
   put(id,version,value);return true;
  },
  remove:async(id,version)=>{
   if(!correct(id,version))return false;
   return rows.delete(id);
  },
  transaction:async updates=>{
   if(!updates.every(({id,previous})=>correct(id,previous?.version??0)))return false;
   for(const {id,previous,value} of updates)put(id,previous?.version??0,value);
   return true;
  }
 };
}

it.each(['protocol','limits','master-and-outcomes'])('runs the %s suite with synthetic state and no AWS',async suite=>{
 const readMaster=vi.fn(async()=>({suspended:false,revision:9}));
 const result=await runNavigatorAcceptance(suite,{makeStore,readMaster,signingSecret:async()=>'synthetic-signing-secret-for-offline-test'});
 expect(result).toEqual({suite,passed:true,providerTransport:'absent',canonicalWrites:false});
 expect(readMaster).toHaveBeenCalledTimes({protocol:4,limits:pilot.guestDaily+1,'master-and-outcomes':2}[suite]);
});

it('refuses aliases, numbered versions, wrong event shape and wrong environment before AWS setup',async()=>{
 const arn='arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:';
 vi.stubEnv('STAGE','alpha');
 vi.stubEnv('NAVIGATOR_ENABLED','false');
 try {
  for(const target of ['live','3','other']){
   expect(await handlerEntry({suite:'protocol'},{functionVersion:'3',invokedFunctionArn:arn+target})).toMatchObject({passed:false});
  }
  expect(await handlerEntry({suite:'protocol',extra:true},{functionVersion:'$LATEST',invokedFunctionArn:arn+'$LATEST'})).toMatchObject({passed:false});
  expect(await handlerEntry({rawPath:'/api/platform/navigator',requestContext:{}},{functionVersion:'$LATEST',invokedFunctionArn:arn.slice(0,-1)})).toMatchObject({passed:false});
  vi.stubEnv('STAGE','prod');
  expect(await handlerEntry({suite:'protocol'},{functionVersion:'$LATEST',invokedFunctionArn:arn+'$LATEST'})).toMatchObject({passed:false});
 } finally {vi.unstubAllEnvs();}
});
