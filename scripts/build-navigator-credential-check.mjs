import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['server/platform/navigator-credential-check.mjs'],bundle:true,platform:'node',target:'node22',format:'cjs',write:false});
assert(!/\/v1\/responses|\/chat\/completions/.test(result.outputFiles[0].text),'Generation transport forbidden');
const {mkdir,writeFile}=await import('node:fs/promises');
await mkdir('.artifacts/navigator-final-acceptance',{recursive:true});
await writeFile('.artifacts/navigator-final-acceptance/index.cjs',result.outputFiles[0].contents);
console.log('Direct-only credential metadata checker built. No generation transport.');
