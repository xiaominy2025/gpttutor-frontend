import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseDocument} from 'yaml';
const document=parseDocument(await readFile('infra/platform/template.yaml','utf8'),{logLevel:'silent'});
const resources=document.toJS().Resources;
await mkdir('.artifacts/platform-approval',{recursive:true});
await writeFile('.artifacts/platform-approval/proposed-changes.json',JSON.stringify({
 status:'LOCAL_PROPOSAL_REQUIRES_OWNER_APPROVAL',
 account:'771049112957',region:'us-east-1',stack:'engent-platform-prod',
 additions:Object.entries(resources).map(([logicalId,resource])=>({action:'Add',logicalId,type:resource.Type})),
 externalChanges:[
  {action:'Modify',target:'CloudFront E1V533CXZPR3FL',scope:'add platform origin and /api/platform/* only'},
  {action:'Modify',target:'decisiontree-prod-api and eoszayfkqd',scope:'new disabled shared sign-in routes, AWS_IAM POST entitlement route, exact role call'},
  {action:'Create',target:'/engent-platform-prod/navigator-credentials',scope:'Standard SecureString using alias/aws/ssm, owner enters value privately'}
 ],
 replacements:[],userMigration:false,newPools:false,dnsChanges:false,
 serviceChangeSet:'Not generated because CreateChangeSet uploads/templates and mutates AWS. Review this proposal and templates before approving that operation.'
},null,2));
console.log('Generated local proposed resource change manifest.');
