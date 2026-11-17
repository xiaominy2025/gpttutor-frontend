import {it,expect} from 'vitest';
import {releaseA,releaseAConfig,releaseAStore} from '../../server/platform/release-a.mjs';
it('rejects production configuration and any Navigator enablement',()=>{
 const env={STAGE:'alpha',APP_ORIGIN:releaseA.origin,STUDENT_POOL:releaseA.pool,STATE_TABLE:releaseA.table,
  TREE_ORIGIN:releaseA.origin,LOGIN_DOMAIN:releaseA.domain,PLATFORM_CLIENT:'allocatedclient',NAVIGATOR_ENABLED:'false'};
 expect(releaseAConfig(env)).toBe(releaseA);
 for(const [key,value]of [['STAGE','prod'],['APP_ORIGIN','https://www.engentlabs.com'],['STUDENT_POOL','us-east-1_Ilf34btQ0'],
  ['STATE_TABLE','decisiontree-prod-data'],['TREE_ORIGIN','https://decisiontree.engentlabs.com'],['NAVIGATOR_ENABLED','true']]){
  expect(()=>releaseAConfig({...env,[key]:value})).toThrow();
 }
});
it('namespaces every session read/write/delete in PLATFORM keys and preserves CAS',async()=>{
 const commands=[],store=releaseAStore({send:async command=>{commands.push(command.input);return {Item:{sub:'fixture'}};}});
 await store.get('SESSION#fixture');await store.create('TX#fixture',{expiresAt:100});
 await store.replace('SESSION#fixture',2,{sub:'fixture'});await store.remove('SESSION#fixture',3);
 expect(commands).toHaveLength(4);
 for(const command of commands){expect(command.TableName).toBe(releaseA.table);expect((command.Item??command.Key).pk).toMatch(/^PLATFORM#/);expect((command.Item??command.Key).sk).toBe('STATE');}
 expect(commands[2].ConditionExpression).toBe('#v = :v');expect(commands[3].ExpressionAttributeValues[':v']).toBe(3);
});
