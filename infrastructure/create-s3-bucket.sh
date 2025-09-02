#!/bin/bash
set -euo pipefail

# Configuration
BUCKET_NAME="engentlabs-frontend"
REGION="us-east-1"
AWS_ACCOUNT_ID="771049112957"

echo "🚀 Creating S3 bucket for EngentLabs frontend hosting"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create the S3 bucket
echo "📦 Creating S3 bucket..."
aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

echo "✅ S3 bucket created successfully"

# Step 2: Enable versioning (optional, for rollback)
echo "🔄 Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

echo "✅ Versioning enabled"

# Step 3: Block all public access
echo "🔒 Blocking all public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "✅ Public access blocked"

# Step 4: Create Origin Access Control (OAC)
echo "🌐 Creating Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
        Name="engentlabs-frontend-oac",Description="OAC for EngentLabs frontend",SigningBehavior="always",SigningProtocol="sigv4" \
    --query 'OriginAccessControl.Id' \
    --output text)

echo "✅ Origin Access Control created: $OAC_ID"

# Step 5: Create bucket policy
echo "📝 Creating bucket policy..."
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::$AWS_ACCOUNT_ID:distribution/*"
                }
            }
        }
    ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json

echo "✅ Bucket policy applied"

# Step 6: Set up proper content types for common file types
echo "📋 Setting up content type metadata..."
aws s3api put-bucket-website \
    --bucket "$BUCKET_NAME" \
    --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'

echo "✅ Website configuration set"

# Step 7: Create a sync script for deployment
echo "📝 Creating deployment script..."
cat > scripts/sync-to-s3.sh << EOF
#!/bin/bash
set -euo pipefail

echo "🚀 Syncing frontend to S3 bucket: $BUCKET_NAME"

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Sync with proper content types
echo "📤 Syncing to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/ \\
    --delete \\
    --cache-control "max-age=31536000,public" \\
    --exclude "*.html" \\
    --exclude "*.json" \\
    --exclude "*.xml"

# Sync HTML files with shorter cache
echo "📄 Syncing HTML files..."
aws s3 sync dist/ s3://$BUCKET_NAME/ \\
    --delete \\
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" \\
    --include "*.html" \\
    --include "*.json" \\
    --include "*.xml"

echo "✅ Frontend deployed successfully!"
echo "🌐 Bucket: s3://$BUCKET_NAME"
echo "🔗 OAC ID: $OAC_ID"
echo ""
echo "📋 Next steps:"
echo "   1. Create CloudFront distribution using OAC ID: $OAC_ID"
echo "   2. Update CloudFront origin to use this bucket"
echo "   3. Configure DNS in Namecheap"
EOF

chmod +x scripts/sync-to-s3.sh

# Step 8: Create verification script
echo "🔍 Creating verification script..."
cat > scripts/verify-s3.sh << EOF
#!/bin/bash
set -euo pipefail

echo "🔍 Verifying S3 bucket setup..."

# Check bucket exists
echo "📦 Checking bucket exists..."
aws s3api head-bucket --bucket "$BUCKET_NAME"
echo "✅ Bucket exists"

# Check versioning
echo "🔄 Checking versioning..."
VERSIONING_STATUS=\$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text)
echo "✅ Versioning status: \$VERSIONING_STATUS"

# Check public access block
echo "🔒 Checking public access block..."
aws s3api get-public-access-block --bucket "$BUCKET_NAME"
echo "✅ Public access blocked"

# Check bucket policy
echo "📝 Checking bucket policy..."
aws s3api get-bucket-policy --bucket "$BUCKET_NAME" --query 'Policy' --output text | jq .
echo "✅ Bucket policy applied"

# List bucket contents (if any)
echo "📋 Bucket contents:"
aws s3 ls s3://$BUCKET_NAME --recursive || echo "Bucket is empty (expected for new bucket)"

echo ""
echo "🎯 S3 bucket setup verification complete!"
echo "📦 Bucket: s3://$BUCKET_NAME"
echo "🌐 OAC ID: $OAC_ID"
echo "🔗 Region: $REGION"
EOF

chmod +x scripts/verify-s3.sh

# Step 9: Create CloudFront integration script
echo "🌐 Creating CloudFront integration script..."
cat > infrastructure/cloudfront-oac-config.json << EOF
{
    "CallerReference": "engentlabs-frontend-oac-$(date +%s)",
    "Comment": "EngentLabs Frontend Distribution with OAC",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-engentlabs-frontend",
                "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID",
                "ConnectionAttempts": 3,
                "ConnectionTimeout": 10,
                "OriginShield": {
                    "Enabled": false
                }
            }
        ]
    },
    "OriginGroups": {
        "Quantity": 0
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-engentlabs-frontend",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": false,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": [
                "GET",
                "HEAD"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "GET",
                    "HEAD"
                ]
            }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
        "ResponseHeadersPolicyId": "",
        "RealTimeLogConfigArn": "",
        "RealtimeLogConfigArn": "",
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 0
            },
            "QueryStringCacheKeys": {
                "Quantity": 0
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Comment": "EngentLabs Frontend Distribution with OAC",
    "Logging": {
        "Enabled": false,
        "IncludeCookies": false,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_100",
    "Enabled": true,
    "ViewerCertificate": {
        "ACMCertificateArn": "arn:aws:acm:us-east-1:$AWS_ACCOUNT_ID:certificate/b4d73954-0378-4863-a2da-f0fec92ffa83",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "Certificate": "arn:aws:acm:us-east-1:$AWS_ACCOUNT_ID:certificate/b4d73954-0378-4863-a2da-f0fec92ffa83",
        "CertificateSource": "acm"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF

echo "✅ CloudFront configuration template created"

# Summary
echo ""
echo "🎉 S3 bucket setup complete!"
echo ""
echo "📋 Summary:"
echo "   📦 Bucket: s3://$BUCKET_NAME"
echo "   🌍 Region: $REGION"
echo "   🔒 Public Access: Blocked"
echo "   🔄 Versioning: Enabled"
echo "   🌐 OAC ID: $OAC_ID"
echo ""
echo "📝 Created scripts:"
echo "   📤 scripts/sync-to-s3.sh - Deploy frontend to S3"
echo "   🔍 scripts/verify-s3.sh - Verify bucket setup"
echo "   🌐 infrastructure/cloudfront-oac-config.json - CloudFront config template"
echo ""
echo "🚀 Next steps:"
echo "   1. Build and deploy: ./scripts/sync-to-s3.sh"
echo "   2. Verify setup: ./scripts/verify-s3.sh"
echo "   3. Create CloudFront distribution using the OAC ID: $OAC_ID"
echo "   4. Update CloudFront origin to use this bucket"
echo ""
echo "💡 Note: You'll need to create a new ACM certificate for engentlabs.com"
echo "   Current certificate only covers api.engentlabs.com"
