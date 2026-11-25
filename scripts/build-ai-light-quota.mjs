import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(const mode of ['alpha','production']){
 const root='.artifacts/ai-light-quota/'+source.slice(0,7)+'/'+mode;await mkdir(root,{recursive:true});
 const entry={alpha:'navigator-quota-alpha-entry',production:'navigator-quota-production-entry'}[mode];
 const r=await build({entryPoints:['server/platform/'+entry+'.mjs'],bundle:true,platform:'node',target:'node22',format:'cjs',outfile:root+'/index.js',metafile:true});
 const inputs=Object.keys(r.metafile.inputs);
 if(inputs.some(x=>/\/(budget|navigator-runtime|scenario-alpha-admission|navigator-paid[^/]*)\.mjs$/.test(x)))throw Error('Financial legacy dependency in quota-only bundle');
 await writeFile(root+'/package.json','{"type":"commonjs"}\n');
 execFileSync('python',['-c',"import zipfile,pathlib,sys; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(p/'runtime.zip','w',zipfile.ZIP_DEFLATED); [(lambda i,n: (setattr(i,'compress_type',zipfile.ZIP_DEFLATED),z.writestr(i,(p/n).read_bytes())))(zipfile.ZipInfo(n,(1980,1,1,0,0,0)),n) for n in ['index.js','package.json']]; z.close()",root]);
 const bytes=await readFile(root+'/runtime.zip'),manifest={source,mode,entry,sha256:createHash('sha256').update(bytes).digest('hex'),base64:createHash('sha256').update(bytes).digest('base64'),inputs};
 await writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({source,mode,sha256:manifest.sha256,files:inputs.length}));
}
