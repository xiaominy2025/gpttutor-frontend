import {it,expect} from 'vitest';import {loggingPrivacyProposal} from '../../scripts/release-a-logging-privacy.mjs';
const delivery={id:'aThRgLrDEczfdnUd',deliverySourceName:'CreatedByCloudFront-E1V533CXZPR3FL',deliveryDestinationArn:'arn:aws:logs:us-east-1:771049112957:delivery-destination:CF-E1V533CXZPR3FL-engentlabs-frontend-1756589108658',deliveryDestinationType:'S3',recordFields:['date','cs-uri-stem','cs-uri-query','cs(Cookie)','cs(Referer)','sc-status'],s3DeliveryConfiguration:{suffixPath:'original-path'}};
it('removes credential-bearing fields and denies only the CloudFront log prefix without altering original grants',()=>{
 const before={Version:'2012-10-17',Statement:[{Sid:'OriginalWebRead',Effect:'Allow',Action:'s3:GetObject',Resource:'arn:aws:s3:::engentlabs-frontend/*'}]},p=loggingPrivacyProposal(delivery,before);
 expect(p.deliveryUpdate).toEqual({id:delivery.id,recordFields:['date','cs-uri-stem','sc-status'],s3DeliveryConfiguration:delivery.s3DeliveryConfiguration});expect(delivery.recordFields).toContain('cs(Cookie)');
 expect(p.bucketPolicy.Statement[0]).toEqual(before.Statement[0]);expect(before.Statement).toHaveLength(1);expect(p.bucketPolicy.Statement[1]).toMatchObject({Effect:'Deny',Principal:{Service:'cloudfront.amazonaws.com'},Resource:'arn:aws:s3:::engentlabs-frontend/AWSLogs/*'});expect(p.bucketPolicy.Statement[1].Action).toContain('s3:GetObjectVersion');
 expect(p.retainPrivacyOnAuthRollback).toBe(true);expect(p.deliveryUpdate.s3DeliveryConfiguration).toEqual(delivery.s3DeliveryConfiguration);
});
it('rejects different deliveries or already-applied policies rather than editing unrelated logging',()=>{
 const before={Version:'2012-10-17',Statement:[]};expect(()=>loggingPrivacyProposal({...delivery,id:'other'},before)).toThrow();const p=loggingPrivacyProposal(delivery,before);expect(()=>loggingPrivacyProposal(delivery,p.bucketPolicy)).toThrow('already present');
});
