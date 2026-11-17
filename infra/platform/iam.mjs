import {mkdirSync,writeFileSync} from 'node:fs';
const account='771049112957',region='us-east-1';
const dir=process.argv[2]??'.artifacts/platform-approval';
mkdirSync(dir,{recursive:true});
const allow=(Action,Resource,Condition)=>({Effect:'Allow',Action,Resource,...(Condition?{Condition}:{})});
const doc=Statement=>({Version:'2012-10-17',Statement});
const arn=(service,resource)=>`arn:aws:${service}:${region}:${account}:${resource}`;
const runtime=doc([
 allow(['dynamodb:GetItem','dynamodb:PutItem','dynamodb:UpdateItem','dynamodb:DeleteItem'],arn('dynamodb','table/engent-platform-prod-state')),
 allow('ssm:GetParameter',arn('ssm','parameter/engent-platform-prod/navigator-credentials')),
 allow(['logs:CreateLogStream','logs:PutLogEvents'],arn('logs','log-group:/aws/lambda/engent-platform-prod-api:*')),
 allow('cloudwatch:PutMetricData','*',{StringEquals:{'cloudwatch:namespace':'Engent/Platform/prod'}}),
 allow('execute-api:Invoke',arn('execute-api','eoszayfkqd/$default/POST/internal/platform/entitlements'))
]);
const role='arn:aws:iam::'+account+':role/engent-platform-prod-runtime';
const execution='arn:aws:iam::'+account+':role/engent-platform-prod-cloudformation';
const deployer=doc([
 allow(['s3:GetBucketLocation','s3:GetBucketVersioning'],'arn:aws:s3:::decisiontree-prod-artifacts-771049112957-us-east-1'),
 allow(['s3:PutObject','s3:GetObject'],'arn:aws:s3:::decisiontree-prod-artifacts-771049112957-us-east-1/platform/*'),
 allow(['cloudformation:CreateChangeSet'],arn('cloudformation','stack/engent-platform-prod/*'),
  {ArnEquals:{'cloudformation:RoleArn':execution}}),
 allow(['cloudformation:DescribeChangeSet','cloudformation:DescribeStacks','cloudformation:GetTemplate','cloudformation:ExecuteChangeSet'],
  arn('cloudformation','stack/engent-platform-prod/*')),
 allow('iam:PassRole',execution,{StringEquals:{'iam:PassedToService':'cloudformation.amazonaws.com'}})
]);
const execute=doc([
 allow(['sns:Subscribe','sns:GetTopicAttributes'],
  'arn:aws:sns:us-east-1:771049112957:decisiontree-prod-AlarmTopic-aTZwTdkMddZO'),
 allow(['apigateway:GET','apigateway:POST','apigateway:PUT','apigateway:PATCH'],
  'arn:aws:apigateway:us-east-1::/apis/*',
  {StringEquals:{'aws:ResourceTag/Application':'engent-platform-prod'}}),
 allow(['iam:CreateRole','iam:GetRole','iam:PutRolePolicy','iam:GetRolePolicy','iam:TagRole','iam:ListRolePolicies','iam:ListAttachedRolePolicies'],role),
 allow('iam:PassRole',role,{StringEquals:{'iam:PassedToService':'lambda.amazonaws.com'}}),
 allow(['lambda:CreateFunction','lambda:GetFunction','lambda:GetFunctionConfiguration','lambda:GetPolicy','lambda:AddPermission','lambda:TagResource','lambda:PutFunctionConcurrency','lambda:UpdateFunctionCode','lambda:UpdateFunctionConfiguration'],
  arn('lambda','function:engent-platform-prod-api')),
 allow('s3:GetObject','arn:aws:s3:::decisiontree-prod-artifacts-771049112957-us-east-1/platform/*'),
 allow(['dynamodb:CreateTable','dynamodb:DescribeTable','dynamodb:UpdateTimeToLive','dynamodb:DescribeTimeToLive','dynamodb:TagResource','dynamodb:ListTagsOfResource'],arn('dynamodb','table/engent-platform-prod-state')),
 allow(['logs:CreateLogGroup','logs:PutRetentionPolicy','logs:TagResource'],arn('logs','log-group:/aws/lambda/engent-platform-prod-api:*')),
 allow('logs:DescribeLogGroups','*',{StringEquals:{'aws:RequestedRegion':region}}),
 allow(['cognito-idp:CreateUserPoolClient','cognito-idp:DescribeUserPoolClient','cognito-idp:CreateUserPoolDomain','cognito-idp:DescribeUserPoolDomain','cognito-idp:CreateManagedLoginBranding','cognito-idp:DescribeManagedLoginBrandingByClient'],
  arn('cognito-idp','userpool/us-east-1_Ilf34btQ0')),
 allow(['apigateway:POST'],'arn:aws:apigateway:us-east-1::/apis',
  {StringEquals:{'aws:RequestTag/Application':'engent-platform-prod'}}),
 allow(['cloudwatch:PutMetricAlarm','cloudwatch:DescribeAlarms','cloudwatch:TagResource'],arn('cloudwatch','alarm:engent-platform-prod-navigator-*'))
]);
const treeSession=doc([allow('dynamodb:DeleteItem',arn('dynamodb','table/decisiontree-prod-data'),{'ForAllValues:StringLike':{'dynamodb:LeadingKeys':['SHARED#*']}})]);
const treeRoute=doc([allow('execute-api:Invoke',arn('execute-api','eoszayfkqd/$default/POST/internal/platform/entitlements'))]);
const edge=doc([allow(['cloudfront:GetDistribution','cloudfront:GetDistributionConfig','cloudfront:UpdateDistribution'],
 'arn:aws:cloudfront::771049112957:distribution/E1V533CXZPR3FL')]);
for(const [name,value] of Object.entries({'runtime-policy':runtime,'deployer-policy':deployer,'execution-create-policy':execute,
 'cloudfront-patch-policy':edge,'tree-route-policy':treeRoute,'tree-session-policy':treeSession,
 'deployer-trust':doc([{Effect:'Allow',Principal:{AWS:'arn:aws:iam::771049112957:user/engentlabs-cli'},Action:'sts:AssumeRole'}]),
 'runtime-trust':doc([{Effect:'Allow',Principal:{Service:'lambda.amazonaws.com'},Action:'sts:AssumeRole'}]),
 'execution-trust':doc([{Effect:'Allow',Principal:{Service:'cloudformation.amazonaws.com'},Action:'sts:AssumeRole'}])})){
 writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
}
console.log('Wrote literal production IAM JSON locally. No AWS calls.');
