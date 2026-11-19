import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseDocument} from 'yaml';
const path='infra/release-a/template.yaml';
const original=execFileSync('git',['show','57317528f9b747e6737d493dff5549eb21c474e1:'+path],{encoding:'utf8'});
const current=readFileSync(path,'utf8');
const template=parseDocument(current,{logLevel:'silent'}).toJS();
it('changes only the unused Gate 1 acknowledgement, preserving every resource and output byte',()=>{
 const normalize=text=>text.replaceAll('\r\n','\n');
 const expected=original.replace('  ExistingOnlyGuardVerified:','  SignupGuardRequiredBeforeExecution:')
  .replace('Required explicit acknowledgement that Alpha AllowAdminCreateUserOnly=true was verified before public clients are created.',
   'Acknowledges the future requirement for Gate 2 to approve, apply and verify the Alpha existing-only signup guard before any change-set execution. Does not attest that the guard is applied during Gate 1.');
 expect(normalize(current)).toBe(normalize(expected));
 expect(current.slice(current.indexOf('Resources:'))).not.toMatch(/ExistingOnlyGuardVerified|SignupGuardRequiredBeforeExecution/);
 expect(template.Parameters).not.toHaveProperty('ExistingOnlyGuardVerified');
 expect(template.Parameters.EnableAuth.Default).toBe('false');
});
it('constructs an unexecuted Gate 1 request without attesting that the current signup guard is active',()=>{
 const liveStateFixture={AllowAdminCreateUserOnly:false};
 const request={StackName:'engent-release-a-alpha',ChangeSetType:'CREATE',
  Parameters:[{ParameterKey:'SignupGuardRequiredBeforeExecution',ParameterValue:'true'},
   {ParameterKey:'EnableAuth',ParameterValue:'false'}]};
 for(const parameter of request.Parameters){
  expect(template.Parameters[parameter.ParameterKey].AllowedValues).toContain(parameter.ParameterValue);
 }
 expect(template.Parameters.SignupGuardRequiredBeforeExecution.Description).toContain('Does not attest that the guard is applied during Gate 1');
 expect(liveStateFixture.AllowAdminCreateUserOnly).toBe(false);
 expect(request).not.toHaveProperty('ExecuteChangeSet');
 // This validates local request/template semantics only, not service-side permission or acceptance.
});
