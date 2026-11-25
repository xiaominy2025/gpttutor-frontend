import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseDocument} from 'yaml';
for(const stage of ['alpha','prod'])it(stage+' quota IAM excludes financial/historical records and preserves proof/turn/security scopes',()=>{
 const p=JSON.parse(readFileSync('infra/ai-light-quota/navigator-policy-'+stage+'.json'));
 const template=parseDocument(readFileSync(stage==='alpha'?'infra/navigator-alpha/proposal.yaml':'infra/navigator-production/template.yaml','utf8'),{logLevel:'silent'}).getIn(['Resources','RuntimeRole','Properties','Policies',0,'PolicyDocument']).toJSON();
 expect(template).toEqual(p);
 const state=p.Statement.find(x=>x.Sid==='NavigatorQuotaState'),turn=p.Statement.find(x=>x.Sid==='NavigatorTurnClaims');
 const match=(key,pattern)=>new RegExp('^'+pattern.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*')+'$').test(key);
 const accepts=key=>state.Condition['ForAllValues:StringLike']['dynamodb:LeadingKeys'].some(pattern=>match(key,pattern));
 for(const key of ['NAVIGATOR#NAVIGATOR#GLOBAL','NAVIGATOR#ACTOR#a#2026-11-25','NAVIGATOR#IP#a#2026-11-25','NAVIGATOR#ACCESS#SCENARIO#uuid'])expect(accepts(key)).toBe(true);
 for(const key of ['NAVIGATOR#BUDGET#2026-11','NAVIGATOR#SCENARIO#REQUEST#uuid','NAVIGATOR#CANARY#id','FORECASTING#PROD','USER#id'])expect(accepts(key)).toBe(false);
 expect(state.Action).toEqual(['dynamodb:GetItem','dynamodb:PutItem']);expect(turn.Action).toContain('dynamodb:DeleteItem');
 const turnPatterns=turn.Condition['ForAllValues:StringLike']['dynamodb:LeadingKeys'];
 expect(turnPatterns.some(p=>match('NAVIGATOR#NAVIGATOR#TURN#fixture',p))).toBe(true);
 expect(turnPatterns.some(p=>match('NAVIGATOR#TURN#fixture',p))).toBe(false);
 expect(p.Statement.find(x=>x.Sid==='ReadSharedPaidAiMaster').Action).toBe('dynamodb:GetItem');
 expect(p.Statement.find(x=>x.Sid==='NavigatorParameters').Resource.every(x=>x.includes('/decisionnavigator-'+stage+'/'))).toBe(true);
});
