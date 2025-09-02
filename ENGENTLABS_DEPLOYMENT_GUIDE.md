# 🚀 Engent Labs Frontend Deployment Guide

## Overview

This guide provides automated deployment scripts for deploying the Engent Labs React frontend to AWS S3 + CloudFront. The deployment is fully automated and includes build, upload, cache invalidation, and testing steps.

## 🎯 Quick Start

### Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js** and **npm** installed
3. **AWS credentials** configured (`aws configure`)
4. **S3 bucket** created for frontend hosting
5. **CloudFront distribution** configured with S3 origin

### One-Command Deployment

#### Windows (PowerShell)
```powershell
npm run deploy:engentlabs
```

#### Linux/macOS (Bash)
```bash
npm run deploy:engentlabs:linux
```

## 📋 Deployment Steps

The automated deployment performs the following steps:

1. **🔍 Prerequisites Check**
   - Verifies AWS CLI, Node.js, npm installation
   - Checks AWS credentials configuration
   - Validates S3 bucket accessibility

2. **🔨 Build Process**
   - Installs dependencies (if needed)
   - Runs `npm run build` to create production build
   - Outputs to `dist/` directory (Vite)

3. **🚀 S3 Deployment**
   - Syncs build files to S3 bucket
   - Removes old files with `--delete` flag
   - Applies appropriate cache headers

4. **🔄 CloudFront Invalidation**
   - Creates invalidation for all paths (`/*`)
   - Ensures new content is served immediately

5. **🧪 Deployment Testing**
   - Tests production URLs accessibility
   - Verifies both `engentlabs.com` and `www.engentlabs.com`

## ⚙️ Configuration

### Default Settings

- **S3 Bucket**: `engentlabs-frontend`
- **CloudFront Distribution ID**: `E1V533CXZPR3FL`
- **Backend API**: `https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws`

### Custom Configuration

#### Environment Variables
```bash
# Set custom bucket and distribution
export S3_BUCKET="your-custom-bucket"
export CF_DISTRIBUTION_ID="your-distribution-id"
```

#### Command Line Options

**PowerShell (Windows)**
```powershell
# Custom bucket and distribution
.\scripts\deploy-engentlabs.ps1 -S3_BUCKET "my-bucket" -CF_DISTRIBUTION_ID "E1234567890"

# Skip build step
.\scripts\deploy-engentlabs.ps1 -SkipBuild

# Skip CloudFront invalidation
.\scripts\deploy-engentlabs.ps1 -SkipInvalidation

# Dry run (no actual changes)
.\scripts\deploy-engentlabs.ps1 -DryRun
```

**Bash (Linux/macOS)**
```bash
# Custom bucket and distribution
./scripts/deploy-engentlabs.sh --bucket "my-bucket" --distribution-id "E1234567890"

# Skip build step
./scripts/deploy-engentlabs.sh --skip-build

# Skip CloudFront invalidation
./scripts/deploy-engentlabs.sh --skip-invalidation

# Dry run (no actual changes)
./scripts/deploy-engentlabs.sh --dry-run
```

## 📦 NPM Scripts

The following npm scripts are available for easy deployment:

| Script | Description |
|--------|-------------|
| `npm run deploy:engentlabs` | Full deployment (Windows) |
| `npm run deploy:engentlabs:dry` | Dry run deployment (Windows) |
| `npm run deploy:engentlabs:skip-build` | Deploy without building (Windows) |
| `npm run deploy:engentlabs:skip-invalidation` | Deploy without cache invalidation (Windows) |
| `npm run deploy:engentlabs:linux` | Full deployment (Linux/macOS) |
| `npm run deploy:engentlabs:linux:dry` | Dry run deployment (Linux/macOS) |
| `npm run deploy:engentlabs:linux:skip-build` | Deploy without building (Linux/macOS) |
| `npm run deploy:engentlabs:linux:skip-invalidation` | Deploy without cache invalidation (Linux/macOS) |

## 🔧 Manual Deployment Steps

If you prefer to run deployment steps manually:

### Step 1: Build React App
```bash
npm install
npm run build
```

### Step 2: Upload to S3
```bash
aws s3 sync dist/ s3://engentlabs-frontend --delete
```

### Step 3: Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E1V533CXZPR3FL \
  --paths "/*"
```

### Step 4: Verify Deployment
Test the following URLs in your browser:
- https://engentlabs.com
- https://www.engentlabs.com

## 🏗️ Infrastructure Requirements

### S3 Bucket Configuration
- **Bucket Name**: `engentlabs-frontend`
- **Region**: `us-east-1` (or your preferred region)
- **Access**: Private (OAC access only)
- **Static Website Hosting**: Disabled (CloudFront handles this)

### CloudFront Distribution
- **Origin**: S3 bucket with OAC
- **Domain**: `engentlabs.com` and `www.engentlabs.com`
- **SSL Certificate**: ACM certificate for both domains
- **Default Root Object**: `index.html`
- **Error Pages**: Redirect 404s to `/index.html` (SPA routing)

### DNS Configuration
- **A Record**: `engentlabs.com` → CloudFront distribution
- **A Record**: `www.engentlabs.com` → CloudFront distribution
- **CNAME**: `www.engentlabs.com` → `engentlabs.com` (alternative)

## 🔍 Troubleshooting

### Common Issues

#### AWS CLI Not Found
```bash
# Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/
# Linux/macOS: Use package manager or pip
pip install awscli
```

#### AWS Credentials Not Configured
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region, and output format
```

#### S3 Bucket Access Denied
- Verify IAM permissions include S3 access
- Check bucket policy allows your user/role
- Ensure bucket exists in the specified region

#### CloudFront Invalidation Failed
- Verify distribution ID is correct
- Check IAM permissions include CloudFront access
- Ensure distribution is deployed and active

#### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug Mode

Run with verbose output to see detailed information:

**PowerShell**
```powershell
$env:DEBUG="true"; npm run deploy:engentlabs
```

**Bash**
```bash
DEBUG=true npm run deploy:engentlabs:linux
```

## 📊 Deployment Verification

After deployment, verify:

1. **Frontend Accessibility**
   - https://engentlabs.com loads correctly
   - https://www.engentlabs.com loads correctly
   - React app renders without errors

2. **API Integration**
   - Frontend can communicate with backend API
   - API calls go to: `https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws`
   - No CORS issues in browser console

3. **Performance**
   - CloudFront cache is working
   - Static assets load quickly
   - No 404 errors for routes

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: npm run deploy:engentlabs:linux
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify infrastructure configuration
4. Test with dry run mode first

## 🎉 Success Indicators

A successful deployment will show:
- ✅ All prerequisites met
- ✅ Build completed successfully
- ✅ S3 deployment completed
- ✅ CloudFront invalidation initiated
- ✅ Production URLs are accessible
- ✅ Deployment summary with all URLs

Your React app is now live on AWS S3 + CloudFront! 🚀
