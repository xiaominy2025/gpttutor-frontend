import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {handlerEntry} from '../../server/platform/navigator-scenario-production-entry.mjs';
afterEach(()=>vi.unstubAllEnvs());
it('isolates the exact ten-resource default-OFF Scenario stack without a new budget or secret',()=>{
 const raw=readFileSync('infra/scenario-production/template.json','utf8'),t=JSON.parse(raw);
 expect(Object.keys(t.Resources)).toHaveLength(10);expect(raw).not.toMatch(/8qmgd1ghdi|decisionnavigator-alpha|AWS::SSM|AWS::DynamoDB|NAVIGATOR#BUDGET/);
 expect(t.Resources.Runtime.Properties.Environment.Variables).toEqual({SCENARIO_PRODUCTION_MODE:'off'});
 const p=t.Resources.RuntimeRole.Properties.Policies[0].PolicyDocument.Statement;
 expect(p).toHaveLength(3);expect(p.some(x=>JSON.stringify(x.Action).includes('dynamodb'))).toBe(false);
 expect(p.find(x=>x.Action==='ssm:GetParameter').Resource).toBe('arn:aws:ssm:us-east-1:771049112957:parameter/decisionnavigator-prod/openai-api-key');
 expect(p.find(x=>x.Action==='execute-api:Invoke').Resource).toBe('arn:aws:execute-api:us-east-1:771049112957:eoszayfkqd/$default/POST/internal/coaches/scenario/ai');
 expect(t.Resources.PrivateRoute.Properties.AuthorizationType).toBe('AWS_IAM');
 expect(t.Resources.PublicInvoke.Properties.SourceArn).toBe('arn:aws:execute-api:us-east-1:771049112957:eoszayfkqd/$default/POST/api/platform/scenario/management-perspective');
});
it('does not expose admission when environment flags or private caller are invalid',async()=>{
 const event={rawPath:'/internal/coaches/scenario/ai',routeKey:'POST /internal/coaches/scenario/ai',requestContext:{apiId:'eoszayfkqd',stage:'$default',http:{method:'POST'}},body:'{"operation":"master"}'};
 vi.stubEnv('STAGE','alpha');vi.stubEnv('NAVIGATOR_ENABLED','true');expect((await handlerEntry(event)).statusCode).toBe(503);
 vi.stubEnv('STAGE','prod');expect((await handlerEntry(event)).statusCode).toBe(403);
});
