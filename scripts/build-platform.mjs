import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('.artifacts/platform',{recursive:true});
await build({entryPoints:['server/platform/lambda.mjs'],bundle:true,platform:'node',target:'node22',
 format:'cjs',outfile:'.artifacts/platform/index.cjs'});
await writeFile('.artifacts/platform/package.json',JSON.stringify({type:'commonjs'}));
console.log('Platform Lambda built locally.');
