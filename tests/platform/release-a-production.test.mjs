import {it,expect} from 'vitest';
import {releaseA,releaseAConfig,releaseAStore} from '../../server/platform/release-a-production.mjs';
it('permits only exact production origin/pool/table/API context with Navigator off',()=>{
 const env={STAGE:'prod',APP_ORIGIN:'https://www.engentlabs.com',TREE_ORIGIN:'https://decisiontree.engentlabs.com',STUDENT_POOL:'us-east-1_Ilf34btQ0',STATE_TABLE:'decisiontree-prod-data',LOGIN_DOMAIN:'engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com',PLATFORM_CLIENT:'allocatedclient',NAVIGATOR_ENABLED:'false'};
 expect(releaseAConfig(env)).toBe(releaseA);expect(releaseA.api).toBe('eoszayfkqd');
 for(const patch of [{STAGE:'alpha'},{APP_ORIGIN:'https://engentlabs.com'},{TREE_ORIGIN:'https://d6owpirihdsus.cloudfront.net'},{STATE_TABLE:'decisiontree-alpha-staging-Data-JH4B4OFXWER5'},{STUDENT_POOL:'us-east-1_CipTwwDZb'},{NAVIGATOR_ENABLED:'true'}])expect(()=>releaseAConfig({...env,...patch})).toThrow();
});
it('bounds production session access to PLATFORM records and rejects Alpha tables',async()=>{
 const commands=[],db={send:async c=>{commands.push(c.input);return {Item:{fixture:true}};}};const store=releaseAStore(db);
 await store.get('SESSION#fixture');await store.create('TX#fixture',{expiresAt:100});await store.remove('TX#fixture',1);
 for(const c of commands){expect(c.TableName).toBe('decisiontree-prod-data');expect((c.Key??c.Item).pk).toMatch(/^PLATFORM#/);}
 expect(()=>releaseAStore(db,'decisiontree-alpha-staging-Data-JH4B4OFXWER5')).toThrow();
});
