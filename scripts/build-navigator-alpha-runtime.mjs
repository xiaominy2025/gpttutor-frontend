import {build} from 'esbuild';

await build({entryPoints:['server/platform/navigator-alpha-entry.mjs'],bundle:true,platform:'node',
 target:'node22',format:'cjs',outfile:'.artifacts/navigator-alpha/index.cjs'});
console.log('Navigator Alpha Lambda built locally.');
