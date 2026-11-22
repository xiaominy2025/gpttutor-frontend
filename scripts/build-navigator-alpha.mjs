// Local web-only candidate. Never builds, uploads or replaces the Release B BFF.
import {build} from 'vite';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const forecastingIntegration=process.argv.includes('--forecasting-integration');
if(process.argv.slice(2).some(a=>a!=='--forecasting-integration'))throw Error('Alpha-only build; unsupported argument');
const root='.artifacts/navigator-alpha-integration',base='/engent-alpha/';
await mkdir(root,{recursive:true});
await build({base,build:{outDir:root+'/web',emptyOutDir:true},define:{
 'import.meta.env.VITE_FORECAST_COACH_ENABLED':JSON.stringify(forecastingIntegration?'true':'false'),
 'import.meta.env.VITE_NAVIGATOR_ALPHA_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_PROCESS_COACH_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_PROCESS_RETURN_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_SHARED_AUTH_ENABLED':JSON.stringify('true'),
 'import.meta.env.VITE_VERIFIED_DECISION_TREE_URL':JSON.stringify('https://d6owpirihdsus.cloudfront.net/')
},plugins:[{name:'preserve-release-b-alpha-header',enforce:'pre',resolveId(source,importer){
 if(source==='./PlatformAccess'&&importer?.replaceAll('\\','/').endsWith('/src/components/Homepage.jsx'))return resolve('src/components/ReleaseBAccess.jsx');
},transform(code,id){
 if(!id.replaceAll('\\','/').endsWith('/src/components/Homepage.jsx'))return;
 const logo="const logo = '/assets/Engent Labs Transparent.png';";
 if(!code.includes(logo)||!code.includes('  if (canLaunch(coach)) {'))throw Error('Release B source baseline changed');
 return code.replace(logo,`const logo = '${base}assets/Engent Labs Transparent.png';`).replace('  if (canLaunch(coach)) {',`  if (coach.id === 'tree' && sharedLaunch === 'https://d6owpirihdsus.cloudfront.net/api/shared/email/login') return <form method="post" action={sharedLaunch}><CoachLaunchControl type="submit" label="Launch Decision Tree Coach" /></form>;
  if (canLaunch(coach)) {`);
}}]});
const files={};
async function inspect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await inspect(p);else{const b=await readFile(p);if(/\.(js|html)$/.test(p)&&/\/decisionnavigator-alpha\/openai-api-key|IP_HMAC_SECRET|WithDecryption/.test(b.toString()))throw Error('Server credential capability leaked into web output');files[p.slice(root.length+1)]=createHash('sha256').update(b).digest('hex');}}}
await inspect(root+'/web');
await writeFile(root+'/web-receipt.json',JSON.stringify({stage:'alpha',webOnly:true,deployed:false,forecastingIntegration,navigator:true,processLaunch:true,releaseBHeader:true,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),files},null,2));
console.log('Local Navigator Alpha web candidate prepared; no deployment or paid traffic enabled.');
