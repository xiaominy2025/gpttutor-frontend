#!/bin/bash
set -euo pipefail

# Configuration - UPDATE THESE VALUES
S3_BUCKET_NAME="your-s3-bucket-name"
ACM_CERT_ARN="arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID"
AWS_ACCOUNT_ID="your-aws-account-id"

echo "🚀 Setting up CloudFront distribution for EngentLabs frontend"
echo "S3 Bucket: $S3_BUCKET_NAME"
echo "ACM Certificate: $ACM_CERT_ARN"
echo ""

# Step 1: Update S3 bucket policy
echo "📝 Updating S3 bucket policy..."
sed "s/YOUR_S3_BUCKET_NAME/$S3_BUCKET_NAME/g; s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" \
    infrastructure/s3-bucket-policy.json > /tmp/bucket-policy.json

aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json

echo "✅ S3 bucket policy updated"

# Step 2: Create CloudFront distribution
echo "🌐 Creating CloudFront distribution..."

# Update the config file with your values
sed "s/YOUR_S3_BUCKET_NAME/$S3_BUCKET_NAME/g; s/YOUR_ACM_CERT_ARN/$ACM_CERT_ARN/g" \
    infrastructure/cloudfront-config.json > /tmp/cloudfront-config.json

# Create the distribution
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text)

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"

# Step 3: Wait for deployment
echo "⏳ Waiting for CloudFront distribution to deploy..."
aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"

# Step 4: Get the domain name
DOMAIN_NAME=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' \
    --output text)

echo ""
echo "🎉 CloudFront distribution setup complete!"
echo ""
echo "📋 Distribution Details:"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   Domain Name: $DOMAIN_NAME"
echo ""
echo "🌍 DNS Configuration for Namecheap:"
echo "   Type: CNAME"
echo "   Name: www"
echo "   Value: $DOMAIN_NAME"
echo ""
echo "   Type: ALIAS"
echo "   Name: @ (or leave empty for root)"
echo "   Value: $DOMAIN_NAME"
echo ""
echo "📝 Save these values for your deployment script:"
echo "   S3_BUCKET_NAME=$S3_BUCKET_NAME"
echo "   CF_DISTRIBUTION_ID=$DISTRIBUTION_ID"
echo ""
echo "🔗 Test your site at: https://$DOMAIN_NAME"
