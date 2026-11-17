// Local request-file preparation only. Never calls Cognito.
import {readFileSync,writeFileSync} from 'node:fs';
const [description,skeleton,output]=process.argv.slice(2);
const pool=JSON.parse(readFileSync(description,'utf8')).UserPool;
if(pool?.Id!=='us-east-1_CipTwwDZb')throw Error('Only the existing Alpha Student pool is allowed.');
// Generate the skeleton separately with the installed AWS CLI, without calling a service.
const accepted=Object.keys(JSON.parse(readFileSync(skeleton,'utf8')));
if(!accepted.includes('UserPoolId')||!accepted.includes('AdminCreateUserConfig'))throw Error('Unexpected UpdateUserPool schema.');
const request={UserPoolId:pool.Id};
for(const key of accepted)if(key!=='UserPoolId'&&Object.hasOwn(pool,key))request[key]=pool[key];
const before=structuredClone(request);
request.AdminCreateUserConfig={...request.AdminCreateUserConfig,AllowAdminCreateUserOnly:true};
// Current responses may include legacy aliases not accepted by UpdateUserPool; never guess them.
writeFileSync(output,JSON.stringify(request,null,2)+'\n');
writeFileSync(output+'.before.json',JSON.stringify(before,null,2)+'\n');
console.log('Local full-preservation requests generated. Review the single signup-policy change before any approved execution.');
