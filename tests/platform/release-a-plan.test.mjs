import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
it('isolates the Explore overlay and prepares a receipt-bound rollback without AWS calls',()=>{
 const dir=mkdtempSync(join(tmpdir(),'release-a-plan-'));
 try{
  const before=join(dir,'before.json'),after=join(dir,'after.json'),receipt=join(dir,'receipt.json'),rollback=join(dir,'rollback.json');
  const original={ETag:'snapshot-etag',Config:{Aliases:{Quantity:0},Origins:{Quantity:2,Items:[
   {Id:'api',DomainName:'8qmgd1ghdi.execute-api.us-east-1.amazonaws.com'},
   {Id:'frontend',DomainName:'decisiontree-alpha-staging-frontend-vnhhrwadnpad.s3.us-east-1.amazonaws.com',OriginPath:'/releases/old',OriginAccessControlId:'unchanged'}]},
   DefaultCacheBehavior:{TargetOriginId:'frontend'},CacheBehaviors:{Quantity:1,Items:[{PathPattern:'/api/*',TargetOriginId:'api'}]},ViewerCertificate:{CloudFrontDefaultCertificate:true}}};
  writeFileSync(before,JSON.stringify(original));
  execFileSync(process.execPath,['scripts/release-a-cloudfront.mjs',before,'a'.repeat(40),after,'b'.repeat(40)]);
  const result=JSON.parse(readFileSync(after));
  expect(result.DefaultCacheBehavior).toEqual(original.Config.DefaultCacheBehavior);
  expect(result.ViewerCertificate).toEqual(original.Config.ViewerCertificate);
  expect(result.CacheBehaviors.Items.at(-1)).toEqual(original.Config.CacheBehaviors.Items[0]);
  expect(result.Origins.Items.find(x=>x.Id==='frontend').OriginPath).toBe('/releases/'+'b'.repeat(40));
  expect(result.Origins.Items.at(-1).OriginAccessControlId).toBe('unchanged');
  writeFileSync(receipt,JSON.stringify({account:'771049112957',distribution:'E1C4AJI9FUE47B',treeFunction:'decisiontree-alpha-staging-api',treeVersion:'10',platformStack:'engent-release-a-alpha',savedCloudFront:before}));
  execFileSync(process.execPath,['scripts/release-a-rollback-plan.mjs',receipt,rollback]);
  expect(JSON.parse(readFileSync(rollback))).toMatchObject({mode:'PLAN_ONLY_NO_EXECUTION',requiresFreshEtags:true,deleteResources:false});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
it('prepares only the Alpha signup guard while retaining every accepted pool setting',()=>{
 const dir=mkdtempSync(join(tmpdir(),'release-a-guard-'));
 try{
  const description=join(dir,'pool.json'),schema=join(dir,'schema.json'),output=join(dir,'request.json');
  const pool={Id:'us-east-1_CipTwwDZb',Policies:{SignInPolicy:{AllowedFirstAuthFactors:['PASSWORD','EMAIL_OTP']}},
   EmailConfiguration:{EmailSendingAccount:'DEVELOPER'},MfaConfiguration:'OFF',UserPoolTier:'ESSENTIALS',
   AdminCreateUserConfig:{AllowAdminCreateUserOnly:false,UnusedAccountValidityDays:7}};
  writeFileSync(description,JSON.stringify({UserPool:pool}));
  writeFileSync(schema,JSON.stringify({UserPoolId:'',Policies:{},EmailConfiguration:{},MfaConfiguration:'',UserPoolTier:'',AdminCreateUserConfig:{}}));
  execFileSync(process.execPath,['scripts/release-a-signup-guard.mjs',description,schema,output]);
  const before=JSON.parse(readFileSync(output+'.before.json')),after=JSON.parse(readFileSync(output));
  expect(after).toEqual({...before,AdminCreateUserConfig:{...before.AdminCreateUserConfig,AllowAdminCreateUserOnly:true}});
  expect(after.UserPoolId).toBe(pool.Id);
  writeFileSync(description,JSON.stringify({UserPool:{...pool,Id:'us-east-1_Ilf34btQ0'}}));
  expect(()=>execFileSync(process.execPath,['scripts/release-a-signup-guard.mjs',description,schema,output],{stdio:'pipe'})).toThrow();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
