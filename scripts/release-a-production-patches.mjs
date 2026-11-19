// Pure proposal functions. No AWS calls or secrets are handled here.
const pool='us-east-1_Ilf34btQ0',guard='arn:aws:lambda:us-east-1:771049112957:function:engent-release-a-prod-registration:live';
const table='arn:aws:dynamodb:us-east-1:771049112957:table/decisiontree-prod-data';
export function preSignupPoolProposal(before,mutableKeys){
 if(before.Id!==pool||before.AdminCreateUserConfig?.AllowAdminCreateUserOnly!==false||Object.keys(before.LambdaConfig??{}).length)throw Error('Production pool/admission/trigger drift');
 if(!Array.isArray(mutableKeys)||!mutableKeys.includes('LambdaConfig')||!mutableKeys.includes('AdminCreateUserConfig'))throw Error('Current CLI UpdateUserPool input model required');
 const input={UserPoolId:pool};for(const key of mutableKeys)if(key!=='UserPoolId'&&Object.hasOwn(before,key))input[key]=structuredClone(before[key]);
 input.LambdaConfig={PreSignUp:guard};
 return input;
}
export function treeBoundaryProposal(before,delta){
 if(before.Version!=='2012-10-17'||!Array.isArray(before.Statement)||delta.Statement?.length!==1)throw Error('Policy drift');
 const s=delta.Statement[0];
 if(s.Effect!=='Allow'||s.Action!=='dynamodb:DeleteItem'||s.Resource!==table||JSON.stringify(s.Condition?.['ForAllValues:StringLike']?.['dynamodb:LeadingKeys'])!==JSON.stringify(['SHARED#OAUTH#*','SHARED#SESSION#*'])||s.Condition?.Null?.['dynamodb:LeadingKeys']!=='false')throw Error('Unreviewed boundary expansion');
 if(before.Statement.some(x=>JSON.stringify(x)===JSON.stringify(s)))throw Error('Delta already exists; reconcile current version');
 return {...structuredClone(before),Statement:[...structuredClone(before.Statement),structuredClone(s)]};
}
export function treeEnvironmentProposal(before,{treeClient,platformClient,enabled=false}){
 if(before.APP_ORIGIN!=='https://decisiontree.engentlabs.com'||before.COGNITO_POOL_ID!==pool||before.ALPHA_TABLE!=='decisiontree-prod-data'||!before.PROJECT_BUCKET?.startsWith('decisiontree-prod-')||!before.AI_CREDENTIALS_PARAMETER_NAME?.startsWith('/decisiontree-prod/')||typeof enabled!=='boolean'||![treeClient,platformClient].every(v=>/^[a-z0-9]+$/.test(v??'')))throw Error('Production environment/client pins required');
 return {...before,SHARED_AUTH_ENABLED:String(enabled),SHARED_TREE_CLIENT:treeClient,PLATFORM_CLIENT:platformClient,SHARED_LOGIN_DOMAIN:'engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com',PLATFORM_CALLER_ROLE:'arn:aws:sts::771049112957:assumed-role/engent-platform-prod-runtime'};
}
