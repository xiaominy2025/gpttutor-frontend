import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';

const pin='934f2fd837423c45d77082566ba5f55a50df4771';
for(const file of ['server/platform/navigator-runtime.mjs','server/platform/navigator.mjs','server/platform/store.mjs',
 'server/platform/budget.mjs','server/shared/paid-ai-master.mjs']){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 assert.equal(git('hash-object','--path='+file,file),git('rev-parse',pin+':'+file),file+' differs from reviewed integration');
}
const result=await build({entryPoints:['server/platform/navigator-alpha-acceptance.mjs'],bundle:true,
 platform:'node',target:'node22',format:'cjs',write:false,metafile:true});
assert(!Object.keys(result.metafile.inputs).some(file=>/\/navigator-alpha-entry\.mjs$|\/release-b-entry\.mjs$/.test(file)));
assert(!/api\.openai\.com|\/decisionnavigator-alpha\/openai-api-key/.test(result.outputFiles[0].text),
 'Acceptance bundle must exclude paid transport and model key paths');
await mkdir('.artifacts/navigator-alpha-acceptance',{recursive:true});
await writeFile('.artifacts/navigator-alpha-acceptance/index.cjs',result.outputFiles[0].contents);
console.log('Provider-blocked Navigator acceptance Lambda built locally.');
