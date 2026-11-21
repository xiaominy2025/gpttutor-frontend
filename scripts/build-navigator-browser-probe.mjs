import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const file of ['server/platform/navigator-runtime.mjs','server/platform/navigator.mjs','server/platform/oauth.mjs','server/platform/store.mjs']){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 assert.equal(git('hash-object','--path='+file,file),git('rev-parse','934f2fd837423c45d77082566ba5f55a50df4771:'+file),file+' differs from reviewed runtime');
}
const args=process.argv.slice(2);
assert(args.length===0||(args.length===2&&args[0]==='--manifest'),'Expected no arguments or --manifest <approved-file>');
const manifest=args.length?JSON.parse(await readFile(args[1],'utf8')):null;
if(manifest){
 assert.deepEqual(Object.keys(manifest).sort(),['endsAt','run','startsAt']);
 assert(/^[a-zA-Z0-9-]{16,80}$/.test(manifest.run)&&Number.isSafeInteger(manifest.startsAt)&&Number.isSafeInteger(manifest.endsAt)&&
  manifest.endsAt>manifest.startsAt&&manifest.endsAt-manifest.startsAt<=300000,'Invalid short probe window');
}
const result=await build({entryPoints:['server/platform/navigator-browser-probe.mjs'],bundle:true,platform:'node',target:'node22',format:'cjs',write:false,
 define:{NAVIGATOR_BROWSER_PROBE_MANIFEST:JSON.stringify(manifest)}});
assert(!/api\.openai\.com|\/openai-api-key/.test(result.outputFiles[0].text),'Provider/key access must be absent');
const dir='.artifacts/navigator-browser-probe/'+(manifest?'reviewed-manifest':'locked');
await mkdir(dir,{recursive:true});await writeFile(dir+'/index.cjs',result.outputFiles[0].contents);
console.log('Navigator provider-free browser probe built: '+(manifest?'manifest embedded; publication requires approval':'locked'));
