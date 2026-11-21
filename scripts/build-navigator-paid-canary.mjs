import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {canarySource,validateCanaryManifest} from '../server/platform/navigator-paid-guard.mjs';

const review='5c8f240c916b889d841aeedd5295f44c344319ec';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
for(const file of ['server/platform/navigator-runtime.mjs','server/platform/navigator.mjs','server/platform/store.mjs',
 'server/platform/budget.mjs','server/shared/paid-ai-master.mjs']){
 assert.equal(git('hash-object','--path='+file,file),git('rev-parse',canarySource+':'+file),file+' differs from reviewed runtime');
 assert.equal(git('rev-parse',review+':'+file),git('rev-parse',canarySource+':'+file),file+' differs from acceptance baseline');
}
const args=process.argv.slice(2);
if(args.length!==0&&(args.length!==2||args[0]!=='--manifest'))throw Error('Expected no arguments or --manifest <approved-file>');
const manifest=args.length?JSON.parse(await readFile(args[1],'utf8')):null;
if(args.length){
 validateCanaryManifest(manifest);
 assert.deepEqual(Object.keys(manifest).sort(),['approval','endsAt','source','startsAt']);
}
const folder='.artifacts/navigator-paid-canary/'+(manifest?'reviewed-manifest':'locked');
const result=await build({entryPoints:['server/platform/navigator-paid-canary.mjs'],bundle:true,platform:'node',
 target:'node22',format:'cjs',write:false,metafile:true,
 define:{NAVIGATOR_REVIEWED_CANARY_MANIFEST:JSON.stringify(manifest)}});
assert(!Object.keys(result.metafile.inputs).some(path=>/\/navigator-alpha-entry\.mjs$|\/release-b-entry\.mjs$/.test(path)));
await mkdir(folder,{recursive:true});
await writeFile(folder+'/index.cjs',result.outputFiles[0].contents);
console.log('Navigator paid canary bundle built locally: '+(manifest?'manifest embedded; deployment requires approval':'locked (no manifest)'));
