// Local artifacts only. No AWS SDK calls, uploads, credentials or deployments.
import {build as viteBuild} from 'vite';
import {build} from 'esbuild';
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='.artifacts/release-a';
await mkdir(root+'/api',{recursive:true});
await build({entryPoints:['server/platform/release-a.mjs'],bundle:true,platform:'node',target:'node22',
 format:'cjs',outfile:root+'/api/index.cjs',metafile:true}).then(async result=>writeFile(root+'/lambda-modules.json',JSON.stringify(Object.keys(result.metafile.inputs),null,2)));
await writeFile(root+'/api/package.json',JSON.stringify({type:'commonjs'}));
await viteBuild({base:'/engent-alpha/',build:{outDir:root+'/web',emptyOutDir:true},
 define:{'import.meta.env.VITE_SHARED_AUTH_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_VERIFIED_DECISION_TREE_URL':JSON.stringify('https://d6owpirihdsus.cloudfront.net/')},
 plugins:[{name:'alpha-explore-assets-only',enforce:'pre',transform(code,id){
  if(!id.replaceAll('\\','/').endsWith('/src/components/Homepage.jsx'))return;
  if(!code.includes("const logo = '/assets/Engent Labs Transparent.png';"))throw Error('Review changed branding source before Alpha build.');
  return code.replace("const logo = '/assets/Engent Labs Transparent.png';","const logo = '/engent-alpha/assets/Engent Labs Transparent.png';")
   .replace('to="/" aria-label="Engent Labs home"','to="https://www.engentlabs.com/" aria-label="Engent Labs home"');
 }}]});
async function hashes(dir){const result={};for(const item of await readdir(dir,{withFileTypes:true})){
 const path=dir+'/'+item.name;if(item.isDirectory())Object.assign(result,await hashes(path));
 else result[path.slice(root.length+1)]=createHash('sha256').update(await readFile(path)).digest('hex');
}return result;}
await writeFile(root+'/receipt.json',JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),files:await hashes(root+'/api'),web:await hashes(root+'/web')},null,2));
console.log('Local-only Release A auth and Explore artifacts prepared. No upload or deployment.');
