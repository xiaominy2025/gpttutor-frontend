import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';
for(const stage of ['alpha','prod'])it('keeps '+stage+' IAM/route proposal bounded and disabled',()=>{const t=JSON.parse(readFileSync(new URL('../../infra/release-b/'+stage+'-routes.template.json',import.meta.url),'utf8')),b=JSON.parse(readFileSync(new URL('../../infra/release-b/'+stage+'-boundary-append.json',import.meta.url),'utf8'));expect(t.Metadata.RELEASE_B_EMAIL_ENABLED).toBe('false');const routes=Object.values(t.Resources).filter(r=>r.Type==='AWS::ApiGatewayV2::Route');expect(routes).toHaveLength(5);for(const r of routes){expect(r.Properties.AuthorizationType).toBe('AWS_IAM');expect(r.Properties.RouteKey).toMatch(/^POST \/internal\/platform\/email\/(start|finish|session|handoff|advanced-request)$/);}for(const arn of b.BffBoundaryStatement.Resource){expect(arn).not.toContain('*');expect(arn).toContain('771049112957:');}expect(b.TreeBoundaryStatement.Action).toBe('dynamodb:ConditionCheckItem');expect(b.TreeBoundaryStatement.Condition['ForAllValues:StringLike']['dynamodb:LeadingKeys']).toEqual(['SHARED#EMAIL-LEASE#*','SESSION#*']);expect(b.TreeBoundaryStatement.Condition.Null['dynamodb:LeadingKeys']).toBe('false');expect(Object.values(t.Resources).every(r=>['AWS::ApiGatewayV2::Route','AWS::IAM::Policy'].includes(r.Type))).toBe(true);});
import {runInNewContext} from 'node:vm';
it('Alpha viewer-function proposal adds homepage preview without rerouting Tree/API',()=>{const source=readFileSync('infra/release-b/alpha-explore-function.js','utf8'),handler=runInNewContext(source+';handler');for(const [input,out]of [['/engent-alpha/','/index.html'],['/engent-alpha/assets/a.js','/assets/a.js'],['/explore','/index.html'],['/explore/tree/cases','/index.html'],['/','/'],['/api/shared/email/status','/api/shared/email/status']])expect(handler({request:{uri:input}}).uri).toBe(out);});
it('operator proposal scopes Alpha writes, guard pass-role and registration-only data',()=>{
 const p=JSON.parse(readFileSync('infra/release-b/alpha-operator-policy.json','utf8'));
 expect(p.Version).toBe('2012-10-17');
 const serialized=JSON.stringify(p);expect(serialized).not.toContain('decisiontree-prod');expect(serialized).not.toContain('eoszayfkqd');
 const pass=p.Statement.find(s=>s.Action.includes('iam:PassRole'));
 expect(pass.Resource).toBe('arn:aws:iam::771049112957:role/engent-release-a-alpha-registration-runtime');
 expect(pass.Condition.StringEquals['iam:PassedToService']).toBe('lambda.amazonaws.com');
 const data=p.Statement.find(s=>s.Sid==='RegistrationFlagOnly');
 expect(data.Condition['ForAllValues:StringEquals']['dynamodb:LeadingKeys']).toEqual(['REGISTRATION#CONFIG']);
 expect(data.Condition.Null['dynamodb:LeadingKeys']).toBe('false');
 for(const s of p.Statement)for(const a of [].concat(s.Action))expect(a).not.toMatch(/Admin(AddUserToGroup|SetUser|UpdateUser)|s3:Delete|secretsmanager|ssm:Put/);
 const guard=p.Statement.find(s=>s.Sid==='CreateBoundedGuardRole');
 expect(guard.Condition.ArnEquals['iam:PermissionsBoundary']).toContain('engent-release-a-alpha-registration-boundary');
});
