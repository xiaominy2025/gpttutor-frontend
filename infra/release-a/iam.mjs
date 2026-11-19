import {mkdirSync,writeFileSync} from 'node:fs';
const dir=process.argv[2]??'infra/release-a/policies';mkdirSync(dir,{recursive:true});
const allow=(Action,Resource,Condition)=>({Effect:'Allow',Action,Resource,...(Condition?{Condition}:{})});
const doc=Statement=>({Version:'2012-10-17',Statement});
const a='771049112957',r='us-east-1',table=`arn:aws:dynamodb:${r}:${a}:table/decisiontree-alpha-staging-Data-JH4B4OFXWER5`;
const role=`arn:aws:iam::${a}:role/engent-platform-alpha-runtime`,treeRole=`arn:aws:iam::${a}:role/decisiontree-alpha-staging-ApiRole-tmQtkTYts533`;
const fn=`arn:aws:lambda:${r}:${a}:function:engent-platform-alpha-api`,tree=`arn:aws:lambda:${r}:${a}:function:decisiontree-alpha-staging-api`;
const log=`arn:aws:logs:${r}:${a}:log-group:/aws/lambda/engent-platform-alpha-api`,pool=`arn:aws:cognito-idp:${r}:${a}:userpool/us-east-1_CipTwwDZb`;
const api=`arn:aws:apigateway:${r}::/apis/8qmgd1ghdi`,front='arn:aws:s3:::decisiontree-alpha-staging-frontend-vnhhrwadnpad';
const artifact='arn:aws:s3:::decisiontree-alpha-artifacts-771049112957-us-east-1';
const runtime=doc([
 allow(['dynamodb:GetItem','dynamodb:PutItem','dynamodb:DeleteItem'],table,{'ForAllValues:StringLike':{'dynamodb:LeadingKeys':['PLATFORM#*']}}),
 allow(['logs:CreateLogStream','logs:PutLogEvents'],log+':*'),
 allow('execute-api:Invoke',`arn:aws:execute-api:${r}:${a}:8qmgd1ghdi/$default/POST/internal/platform/entitlements`)
]);
const operator=doc([
 allow(['cloudformation:CreateChangeSet','cloudformation:DescribeChangeSet','cloudformation:DescribeStacks','cloudformation:DescribeStackEvents','cloudformation:DescribeStackResources','cloudformation:GetTemplate','cloudformation:ExecuteChangeSet','cloudformation:DeleteChangeSet'],`arn:aws:cloudformation:${r}:${a}:stack/engent-release-a-alpha/*`),
 allow(['s3:GetBucketLocation','s3:GetBucketVersioning'],[front,artifact]),
 allow('s3:ListBucket',[front,artifact],{StringLike:{'s3:prefix':['releases/engent-release-a/*','release-a/*']}}),
 allow(['s3:PutObject','s3:GetObject'],[front+'/releases/engent-release-a/*',artifact+'/release-a/*']),
 allow(['iam:CreateRole','iam:GetRole','iam:DeleteRole','iam:PutRolePolicy','iam:GetRolePolicy','iam:DeleteRolePolicy','iam:TagRole','iam:UntagRole','iam:ListRolePolicies'],role),
 allow(['iam:GetRole','iam:PutRolePolicy','iam:GetRolePolicy','iam:DeleteRolePolicy'],treeRole),
 allow('iam:PassRole',role,{StringEquals:{'iam:PassedToService':'lambda.amazonaws.com'}}),
 allow(['lambda:CreateFunction','lambda:UpdateFunctionCode','lambda:UpdateFunctionConfiguration','lambda:GetFunction','lambda:GetFunctionConfiguration','lambda:DeleteFunction','lambda:PublishVersion','lambda:CreateAlias','lambda:GetAlias','lambda:UpdateAlias','lambda:DeleteAlias','lambda:ListVersionsByFunction','lambda:AddPermission','lambda:GetPolicy','lambda:RemovePermission','lambda:PutFunctionConcurrency','lambda:DeleteFunctionConcurrency','lambda:TagResource','lambda:UntagResource','lambda:ListTags'],[fn,fn+':*']),
 allow(['lambda:GetFunction','lambda:GetFunctionConfiguration','lambda:UpdateFunctionCode','lambda:UpdateFunctionConfiguration','lambda:PublishVersion','lambda:GetAlias','lambda:UpdateAlias','lambda:ListVersionsByFunction'],[tree,tree+':*']),
 allow(['logs:CreateLogGroup','logs:DescribeLogStreams','logs:PutRetentionPolicy','logs:DeleteLogGroup','logs:TagResource','logs:UntagResource'],[log,log+':*']),
 allow(['cognito-idp:DescribeUserPool','cognito-idp:UpdateUserPool','cognito-idp:CreateUserPoolDomain','cognito-idp:UpdateUserPoolDomain','cognito-idp:DeleteUserPoolDomain','cognito-idp:CreateUserPoolClient','cognito-idp:DescribeUserPoolClient','cognito-idp:UpdateUserPoolClient','cognito-idp:DeleteUserPoolClient','cognito-idp:CreateManagedLoginBranding','cognito-idp:DescribeManagedLoginBranding','cognito-idp:UpdateManagedLoginBranding','cognito-idp:DeleteManagedLoginBranding'],pool),
 allow('apigateway:GET',api),
 allow('apigateway:GET',api+'/stages/$default'),
 allow(['apigateway:GET','apigateway:POST','apigateway:PATCH','apigateway:DELETE'],[api+'/routes',api+'/routes/*',api+'/integrations',api+'/integrations/*']),
 allow(['cloudfront:CreateFunction','cloudfront:DescribeFunction','cloudfront:GetFunction','cloudfront:UpdateFunction','cloudfront:PublishFunction','cloudfront:DeleteFunction'],`arn:aws:cloudfront::${a}:function/engent-release-a-alpha-explore`),
 allow(['cloudfront:GetDistribution','cloudfront:GetDistributionConfig','cloudfront:UpdateDistribution','cloudfront:CreateInvalidation','cloudfront:GetInvalidation'],`arn:aws:cloudfront::${a}:distribution/E1C4AJI9FUE47B`),
 allow(['cognito-idp:DescribeUserPoolDomain','logs:DescribeLogGroups'],'*',{StringEquals:{'aws:RequestedRegion':r}})
]);
for(const[name,value]of Object.entries({'runtime-policy':runtime,'operator-required-policy':operator,
 'runtime-trust':doc([{Effect:'Allow',Principal:{Service:'lambda.amazonaws.com'},Action:'sts:AssumeRole'}]),
 'tree-session-delta':doc([allow('dynamodb:DeleteItem',table,{'ForAllValues:StringLike':{'dynamodb:LeadingKeys':['SHARED#*']}})])}))
 writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
console.log('Local literal Alpha policies generated; no AWS calls.');
