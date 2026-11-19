import {it,expect} from 'vitest';
import {releaseA,releaseAConfig} from '../../server/platform/release-b1-alpha.mjs';
it('pins the B1 Alpha adapter to Alpha and rejects production configuration',()=>{
 const e={STAGE:'alpha',APP_ORIGIN:releaseA.origin,TREE_ORIGIN:releaseA.treeOrigin,STUDENT_POOL:releaseA.pool,STATE_TABLE:releaseA.table,LOGIN_DOMAIN:releaseA.domain,PLATFORM_CLIENT:'fixtureclient',NAVIGATOR_ENABLED:'false'};
 expect(releaseAConfig(e)).toBe(releaseA);
 for(const patch of [{STAGE:'prod'},{APP_ORIGIN:'https://www.engentlabs.com'},{TREE_ORIGIN:'https://decisiontree.engentlabs.com'},{STATE_TABLE:'decisiontree-prod-data'},{STUDENT_POOL:'us-east-1_Ilf34btQ0'},{NAVIGATOR_ENABLED:'true'}])expect(()=>releaseAConfig({...e,...patch})).toThrow();
});
