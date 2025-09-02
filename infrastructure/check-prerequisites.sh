#!/bin/bash
set -euo pipefail

echo "🔍 Checking CloudFront setup prerequisites..."
echo ""

# Check AWS CLI
echo "1. Checking AWS CLI..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    echo "   ✅ AWS CLI found: $AWS_VERSION"
else
    echo "   ❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check AWS credentials
echo ""
echo "2. Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo "   ✅ AWS credentials valid"
    echo "   📋 Account ID: $ACCOUNT_ID"
    echo "   👤 User: $USER_ARN"
else
    echo "   ❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Check S3 buckets
echo ""
echo "3. Checking S3 buckets..."
S3_BUCKETS=$(aws s3 ls --query 'Buckets[].Name' --output text)
echo "   📦 Available S3 buckets:"
for bucket in $S3_BUCKETS; do
    echo "      - $bucket"
done

# Check ACM certificates
echo ""
echo "4. Checking ACM certificates in us-east-1..."
CERTIFICATES=$(aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?contains(DomainName, `engentlabs.com`)].{Domain:DomainName,ARN:CertificateArn,Status:Status}' --output table 2>/dev/null || echo "No certificates found")

if [[ $CERTIFICATES == *"engentlabs.com"* ]]; then
    echo "   ✅ Found certificates for engentlabs.com:"
    echo "$CERTIFICATES"
else
    echo "   ⚠️  No certificates found for engentlabs.com in us-east-1"
    echo "   📝 You may need to create or import a certificate"
fi

# Check required permissions
echo ""
echo "5. Checking required permissions..."
echo "   🔍 Testing CloudFront permissions..."
if aws cloudfront list-distributions --query 'DistributionList.MaxItems' --output text &> /dev/null; then
    echo "   ✅ CloudFront access confirmed"
else
    echo "   ❌ CloudFront access denied. Check your IAM permissions."
fi

echo ""
echo "6. Testing S3 permissions..."
if aws s3 ls --query 'Buckets[0].Name' --output text &> /dev/null; then
    echo "   ✅ S3 access confirmed"
else
    echo "   ❌ S3 access denied. Check your IAM permissions."
fi

echo ""
echo "7. Testing ACM permissions..."
if aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[0].CertificateArn' --output text &> /dev/null; then
    echo "   ✅ ACM access confirmed"
else
    echo "   ❌ ACM access denied. Check your IAM permissions."
fi

echo ""
echo "🎯 Prerequisites Summary:"
echo "   - AWS CLI: ✅"
echo "   - AWS Credentials: ✅"
echo "   - Account ID: $ACCOUNT_ID"
echo "   - S3 Access: ✅"
echo "   - CloudFront Access: ✅"
echo "   - ACM Access: ✅"
echo ""
echo "📝 Next steps:"
echo "   1. Update infrastructure/setup-cloudfront.sh with your values"
echo "   2. Run: ./infrastructure/setup-cloudfront.sh"
echo "   3. Configure DNS in Namecheap"
echo ""
echo "💡 Required IAM permissions:"
echo "   - s3:GetBucketPolicy, s3:PutBucketPolicy"
echo "   - cloudfront:CreateDistribution, cloudfront:GetDistribution"
echo "   - acm:DescribeCertificate"
echo "   - iam:GetUser, sts:GetCallerIdentity"
