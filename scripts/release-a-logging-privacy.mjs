// Proposal only. No AWS/log-content access or mutation.
export function loggingPrivacyProposal(delivery,bucketPolicy){
 const account='771049112957',distribution='E1V533CXZPR3FL',destination='arn:aws:logs:us-east-1:'+account+':delivery-destination:CF-E1V533CXZPR3FL-engentlabs-frontend-1756589108658';
 if(delivery.id!=='aThRgLrDEczfdnUd'||delivery.deliverySourceName!=='CreatedByCloudFront-'+distribution||delivery.deliveryDestinationArn!==destination||delivery.deliveryDestinationType!=='S3'||!Array.isArray(delivery.recordFields)||!Array.isArray(bucketPolicy.Statement))throw Error('Logging delivery/policy drift');
 const excluded=['cs-uri-query','cs(Cookie)','cs(Referer)'];
 const retained=delivery.recordFields.filter(x=>!excluded.includes(x));
 if(!retained.includes('cs-uri-stem')||!retained.includes('sc-status'))throw Error('Diagnostic fields missing');
 const sid='ReleaseADenyCloudFrontLogRead';if(bucketPolicy.Statement.some(s=>s.Sid===sid))throw Error('Privacy deny already present; reconcile, do not append blindly');
 const policy=structuredClone(bucketPolicy);policy.Statement.push({Sid:sid,Effect:'Deny',Principal:{Service:'cloudfront.amazonaws.com'},Action:['s3:GetObject','s3:GetObjectVersion'],Resource:'arn:aws:s3:::engentlabs-frontend/AWSLogs/*',Condition:{StringEquals:{'AWS:SourceArn':'arn:aws:cloudfront::'+account+':distribution/'+distribution}}});
 return {deliveryUpdate:{id:delivery.id,recordFields:retained,...(delivery.s3DeliveryConfiguration?{s3DeliveryConfiguration:structuredClone(delivery.s3DeliveryConfiguration)}:{}),...(delivery.fieldDelimiter!==undefined?{fieldDelimiter:delivery.fieldDelimiter}:{})},excludedFields:excluded.filter(x=>delivery.recordFields.includes(x)),bucketPolicy:policy,retainPrivacyOnAuthRollback:true,verification:'One new non-sensitive sentinel under AWSLogs/engent-release-a-probe/; verify CloudFront never returns its marker, then delete only its recorded S3 VersionId. Never read existing logs.'};
}
