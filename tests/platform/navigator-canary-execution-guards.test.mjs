import {describe,it,expect,vi} from 'vitest';
import {acknowledgedInstallRevision,assertOwnedPrivateRevision,observeTerminalLambdaResponse} from '../../scripts/navigator-canary-execution-guards.mjs';
const before='11111111-1111-1111-1111-111111111111',owned='22222222-2222-2222-2222-222222222222',other='33333333-3333-3333-3333-333333333333';
describe('private canary ownership',()=>{
 it('requires an acknowledged new revision and exact code hash',()=>{
  expect(acknowledgedInstallRevision({CodeSha256:'hash',RevisionId:owned},'hash',before)).toBe(owned);
  for(const ack of [null,{CodeSha256:'wrong',RevisionId:owned},{CodeSha256:'hash',RevisionId:before},{CodeSha256:'hash'}])expect(()=>acknowledgedInstallRevision(ack,'hash',before)).toThrow();
 });
 it('rejects matching code with changed or unacknowledged revision',()=>{
  expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:owned},'hash',owned)).not.toThrow();
  for(const revision of [other,undefined])expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:revision},'hash',owned)).toThrow();
  expect(()=>assertOwnedPrivateRevision({CodeSha256:'hash',RevisionId:owned},'hash',undefined)).toThrow();
 });
});
describe('terminal Lambda acknowledgement',()=>{
 it('clears uncertainty only after reading the complete payload',async()=>{
  const terminal=vi.fn(),json=vi.fn(async()=>{expect(terminal).not.toHaveBeenCalled();return {status:200};});
  const response=observeTerminalLambdaResponse({status:200,headers:new Headers({'x-amz-executed-version':'$LATEST'}),json},terminal);
  expect(terminal).not.toHaveBeenCalled();await expect(response.json()).resolves.toEqual({status:200});expect(terminal).toHaveBeenCalledTimes(1);
 });
 it.each(['truncated','wrong-version','function-error','http-error'])('retains uncertainty for %s',async mode=>{
  const terminal=vi.fn(),headers=new Headers({'x-amz-executed-version':mode==='wrong-version'?'1':'$LATEST'});
  if(mode==='function-error')headers.set('x-amz-function-error','Unhandled');
  const response=observeTerminalLambdaResponse({status:mode==='http-error'?502:200,headers,json:async()=>{throw Error('truncated');}},terminal);
  await expect(response.json()).rejects.toThrow();expect(terminal).not.toHaveBeenCalled();
 });
});
