// Generates a reviewed rollback order; no network or command execution.
import {readFileSync,writeFileSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
const receipt=JSON.parse(readFileSync(input,'utf8'));
if(receipt.account!=='771049112957'||receipt.distribution!=='E1C4AJI9FUE47B'||receipt.treeFunction!=='decisiontree-alpha-staging-api'||
 !/^\d+$/.test(receipt.treeVersion)||receipt.platformStack!=='engent-release-a-alpha')throw Error('Alpha rollback receipt required.');
const config=JSON.parse(readFileSync(receipt.savedCloudFront,'utf8'));
if(config.Config.Aliases.Quantity!==0||!config.Config.Origins.Items.some(x=>x.Id==='api'&&x.DomainName==='8qmgd1ghdi.execute-api.us-east-1.amazonaws.com'))throw Error('Invalid Alpha snapshot.');
const plan={mode:'PLAN_ONLY_NO_EXECUTION',order:[
 'Gate new platform auth with an approved stack update setting EnableAuth=false, keeping the existing packaged template and client IDs.',
 'Wait for UPDATE_COMPLETE; verify /api/platform/session returns 410. Do not use the broad Navigator template.',
 'Restore the prior Tree live version with a fresh alias RevisionId conditional write.',
 'Restore saved Alpha distribution config using the CURRENT distribution ETag, then wait for deployment and invalidate only /explore, /explore/*, /engent-alpha/* and /index.html.',
 'Verify old Tree OTP, Administrator MFA entry and project recovery; retain session/data rows for TTL expiry. No stack deletion or user/project cleanup.'
],treeAliasCommand:`aws lambda update-alias --function-name ${receipt.treeFunction} --name live --function-version ${receipt.treeVersion} --revision-id CURRENT_ALIAS_REVISION --region us-east-1`,
 cloudFrontSnapshot:receipt.savedCloudFront,requiresFreshEtags:true,deleteResources:false};
writeFileSync(output,JSON.stringify(plan,null,2)+'\n');console.log('Local ordered rollback plan generated; no actions executed.');
