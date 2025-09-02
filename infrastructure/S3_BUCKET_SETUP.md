# S3 Bucket Setup for EngentLabs Frontend

This guide creates a secure S3 bucket for hosting your React frontend with CloudFront integration.

## 🎯 Overview

Creates an S3 bucket with:
- ✅ **Secure access** - No public read access
- ✅ **Origin Access Control (OAC)** - CloudFront-only access
- ✅ **Versioning** - For rollback capability
- ✅ **Proper content types** - Optimized for web hosting
- ✅ **Deployment scripts** - Automated sync with caching

## 📋 Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **AWS Account ID**: `771049112957`
3. **Region**: `us-east-1` (optimal for CloudFront)

## 🚀 Quick Setup

### Option 1: Bash Script (Linux/macOS)
```bash
chmod +x infrastructure/create-s3-bucket.sh
./infrastructure/create-s3-bucket.sh
```

### Option 2: PowerShell Script (Windows)
```powershell
.\infrastructure\create-s3-bucket.ps1
```

## 📦 What Gets Created

### S3 Bucket Configuration
- **Name**: `engentlabs-frontend`
- **Region**: `us-east-1`
- **Versioning**: Enabled
- **Public Access**: Blocked
- **Website Configuration**: Set for SPA routing

### Security Features
- **Origin Access Control (OAC)**: Created and configured
- **Bucket Policy**: Restricts access to CloudFront only
- **Public Access Block**: All public access blocked

### Deployment Scripts
- `scripts/sync-to-s3.sh` / `scripts/sync-to-s3.ps1` - Deploy frontend
- `scripts/verify-s3.sh` / `scripts/verify-s3.ps1` - Verify setup

## 🔧 Manual Setup (Step by Step)

### Step 1: Create S3 Bucket
```bash
aws s3api create-bucket \
    --bucket "engentlabs-frontend" \
    --region "us-east-1" \
    --create-bucket-configuration LocationConstraint="us-east-1"
```

### Step 2: Enable Versioning
```bash
aws s3api put-bucket-versioning \
    --bucket "engentlabs-frontend" \
    --versioning-configuration Status=Enabled
```

### Step 3: Block Public Access
```bash
aws s3api put-public-access-block \
    --bucket "engentlabs-frontend" \
    --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Step 4: Create Origin Access Control
```bash
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
        Name="engentlabs-frontend-oac",Description="OAC for EngentLabs frontend",SigningBehavior="always",SigningProtocol="sigv4" \
    --query 'OriginAccessControl.Id' \
    --output text)
echo "OAC ID: $OAC_ID"
```

### Step 5: Apply Bucket Policy
```bash
aws s3api put-bucket-policy \
    --bucket "engentlabs-frontend" \
    --policy file://infrastructure/s3-bucket-policy-oac.json
```

### Step 6: Set Website Configuration
```bash
aws s3api put-bucket-website \
    --bucket "engentlabs-frontend" \
    --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'
```

## 📤 Deployment

### Build and Deploy
```bash
# Build frontend
npm run build

# Deploy to S3 with proper caching
aws s3 sync dist/ s3://engentlabs-frontend/ \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.xml"

# Deploy HTML files with no cache
aws s3 sync dist/ s3://engentlabs-frontend/ \
    --delete \
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
    --include "*.html" \
    --include "*.json" \
    --include "*.xml"
```

### Using the Deployment Script
```bash
# Bash
./scripts/sync-to-s3.sh

# PowerShell
.\scripts\sync-to-s3.ps1
```

## 🔍 Verification

### Check Bucket Setup
```bash
# Verify bucket exists
aws s3api head-bucket --bucket "engentlabs-frontend"

# Check versioning
aws s3api get-bucket-versioning --bucket "engentlabs-frontend"

# Check public access block
aws s3api get-public-access-block --bucket "engentlabs-frontend"

# Check bucket policy
aws s3api get-bucket-policy --bucket "engentlabs-frontend"

# List contents
aws s3 ls s3://engentlabs-frontend --recursive
```

### Using the Verification Script
```bash
# Bash
./scripts/verify-s3.sh

# PowerShell
.\scripts\verify-s3.ps1
```

## 🌐 CloudFront Integration

### Required Information
- **Bucket Name**: `engentlabs-frontend`
- **OAC ID**: Generated during setup
- **Region**: `us-east-1`

### CloudFront Configuration
Use the generated `infrastructure/cloudfront-oac-config.json` file to create your CloudFront distribution.

## 📁 File Structure

```
infrastructure/
├── create-s3-bucket.sh          # Bash setup script
├── create-s3-bucket.ps1         # PowerShell setup script
├── s3-bucket-policy-oac.json    # Bucket policy template
├── cloudfront-oac-config.json   # CloudFront config template
└── S3_BUCKET_SETUP.md          # This documentation

scripts/
├── sync-to-s3.sh               # Bash deployment script
├── sync-to-s3.ps1              # PowerShell deployment script
├── verify-s3.sh                # Bash verification script
└── verify-s3.ps1               # PowerShell verification script
```

## 🔒 Security Features

### Origin Access Control (OAC)
- **Modern security** - Replaces deprecated OAI
- **SigV4 signing** - Enhanced security
- **CloudFront-only access** - No direct S3 access

### Bucket Policy
```json
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
            "Resource": "arn:aws:s3:::engentlabs-frontend/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::771049112957:distribution/*"
                }
            }
        }
    ]
}
```

## 🚨 Important Notes

### Certificate Requirement
⚠️ **You need a new ACM certificate** for `engentlabs.com`:
- Current certificate only covers `api.engentlabs.com`
- Create new certificate in `us-east-1` for:
  - `engentlabs.com`
  - `www.engentlabs.com`
  - `*.engentlabs.com`

### Content Types
The deployment script automatically sets proper content types:
- **Static assets** (JS, CSS, images): Long cache (1 year)
- **HTML files**: No cache (for SPA routing)

### Cost Optimization
- **S3 Standard**: ~$0.023 per GB stored
- **Data transfer**: ~$0.09 per GB (first 1TB)
- **Estimated monthly**: $2-5 for typical usage

## 🔧 Troubleshooting

### Common Issues

1. **Bucket already exists**
   ```bash
   # Check if bucket exists
   aws s3api head-bucket --bucket "engentlabs-frontend"
   ```

2. **Permission denied**
   ```bash
   # Check your AWS credentials
   aws sts get-caller-identity
   ```

3. **OAC creation failed**
   ```bash
   # List existing OACs
   aws cloudfront list-origin-access-controls
   ```

4. **Policy application failed**
   ```bash
   # Check current policy
   aws s3api get-bucket-policy --bucket "engentlabs-frontend"
   ```

### Verification Commands
```bash
# Test bucket access
aws s3 ls s3://engentlabs-frontend/

# Test OAC
aws cloudfront list-origin-access-controls --query 'OriginAccessControlList.Items[?Name==`engentlabs-frontend-oac`]'

# Test CloudFront permissions
aws cloudfront list-distributions --query 'DistributionList.MaxItems'
```

## 🎯 Success Criteria

Your S3 bucket is properly configured when:

✅ **Bucket exists** and is accessible  
✅ **Versioning is enabled**  
✅ **Public access is blocked**  
✅ **OAC is created** and configured  
✅ **Bucket policy is applied**  
✅ **Website configuration is set**  
✅ **Deployment scripts work**  
✅ **Files sync with proper content types**  

## 🚀 Next Steps

After successful S3 setup:

1. **Create ACM certificate** for `engentlabs.com`
2. **Create CloudFront distribution** using the OAC ID
3. **Deploy your frontend** using the sync scripts
4. **Configure DNS** in Namecheap
5. **Test the complete setup**

## 📞 Support

For issues:
1. Check AWS S3 console for bucket status
2. Verify IAM permissions
3. Review CloudTrail logs for errors
4. Test with the verification scripts
