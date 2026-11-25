import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const next=readFileSync('infra/scenario-production/viewer-request.js','utf8');
const prior=readFileSync('tests/publication/fixtures/scenario-production-viewer-prior.js','utf8');
const call=(code,uri,method='GET',host='www.engentlabs.com')=>JSON.parse(JSON.stringify(runInNewContext(code+';handler(input)',{input:{request:{uri,method,headers:{host:{value:host}},querystring:{}}}})));
test('Scenario entry supports direct navigation and refresh without masking unknown assets',()=>{
 assert.equal(call(next,'/scenario-analysis').statusCode,301);
 assert.equal(call(next,'/scenario-analysis').headers.location.value,'/scenario-analysis/');
 assert.equal(call(next,'/scenario-analysis/').uri,'/scenario-analysis/index.html');
 for(const path of ['/scenario-analysis/index.html','/scenario-analysis/assets/x.js','/scenario-analysis/missing.js'])assert.equal(call(next,path).uri,path);
});
test('existing website, auth, all other Coaches and API routes remain identical',()=>{
 for(const host of ['www.engentlabs.com','engentlabs.com'])for(const method of ['GET','HEAD','POST'])for(const uri of ['/', '/index.html','/explore','/explore/forecast/cases','/forecasting','/forecasting/','/process/','/process/objectives','/api/platform/session','/api/platform/scenario/management-perspective','/api/platform/navigator','/api/process/workbook/status','/engent-release-a/assets/main.js','/labs'])assert.deepEqual(call(next,uri,method,host),call(prior,uri,method,host));
});
