import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const result=await build({entryPoints:['server/platform/navigator-master-check.mjs'],bundle:true,platform:'node',target:'node22',format:'cjs',write:false});
assert(!/api\.openai\.com|\/openai-api-key|GetParameterCommand/.test(result.outputFiles[0].text),'Provider/credential paths forbidden');
await mkdir('.artifacts/navigator-master-check',{recursive:true});
await writeFile('.artifacts/navigator-master-check/index.cjs',result.outputFiles[0].contents);
console.log('Read-only, direct-only Navigator master checker built. Not deployed.');
