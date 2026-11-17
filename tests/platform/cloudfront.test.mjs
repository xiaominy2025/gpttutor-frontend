import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
it('adds only the API origin and behavior while retaining fallback, media and legacy paths',()=>{
 const folder=mkdtempSync(join(tmpdir(),'engent-cloudfront-test-'));
 try {
  const input={ETag:'unchanged-etag',DistributionConfig:{DefaultRootObject:'index.html',Aliases:{Items:['www.engentlabs.com']},
   Origins:{Quantity:1,Items:[{Id:'legacy',DomainName:'legacy.example'}]},
   CacheBehaviors:{Quantity:1,Items:[{PathPattern:'/test/*',TargetOriginId:'legacy'}]},
   CustomErrorResponses:{Items:[{ErrorCode:403,ResponsePagePath:'/index.html',ResponseCode:'200'}]}}};
  const before=join(folder,'before.json'),after=join(folder,'after.json');
  writeFileSync(before,JSON.stringify(input));
  execFileSync(process.execPath,['scripts/platform-cloudfront.mjs',before,'fixtureapi',after]);
  const result=JSON.parse(readFileSync(after));
  expect(result.CacheBehaviors.Items[0].PathPattern).toBe('/api/platform/*');
  expect(result.CustomErrorResponses).toEqual(input.DistributionConfig.CustomErrorResponses);
  expect(result.Origins.Items[0]).toEqual(input.DistributionConfig.Origins.Items[0]);
  expect(result.CacheBehaviors.Items[1]).toEqual(input.DistributionConfig.CacheBehaviors.Items[0]);
  expect(result.Aliases).toEqual(input.DistributionConfig.Aliases);
  expect(()=>execFileSync(process.execPath,['scripts/platform-cloudfront.mjs',after,'fixtureapi',before],{stdio:'pipe'})).toThrow();
 }finally{rmSync(folder,{recursive:true,force:true});}
});
