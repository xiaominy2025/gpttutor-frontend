# AWS Frontend Deployment Guide for Engent Labs

## Overview

This guide explains how the Engent Labs frontend is deployed to AWS using S3, CloudFront, and automated deployment scripts. The frontend is accessible at `https://www.engentlabs.com/labs/`.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│   CloudFront    │───▶│   S3 Bucket     │
│                 │    │   CDN           │    │   (Static Host) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Route 53      │
                       │   DNS           │
                       └─────────────────┘
```

## Infrastructure Components

### 1. S3 Bucket
- **Name**: `engentlabs-frontend`
- **Purpose**: Static file hosting
- **Path**: `/labs/` (subdirectory for the frontend)
- **Policy**: Allows CloudFront access only

### 2. CloudFront Distribution
- **Distribution ID**: `E1V533CXZPR3FL`
- **Domain**: `www.engentlabs.com`
- **Origin**: S3 bucket with OAC (Origin Access Control)
- **Cache Policy**: CachingOptimized
- **Error Handling**: SPA routing support (404 → 200)

### 3. Route 53 DNS
- **Domain**: `engentlabs.com`
- **Subdomain**: `www.engentlabs.com`
- **SSL Certificate**: ACM certificate in us-east-1

## Build Configuration

### Vite Configuration (`vite.config.js`)
```javascript
export default defineConfig({
  base: '/',  // Base path for assets
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
```

### Package.json Configuration
```json
{
  "homepage": "/",  // React build base path
  "scripts": {
    "build": "vite build",
    "deploy:engentlabs": "powershell -ExecutionPolicy Bypass -File scripts/deploy-engentlabs.ps1"
  }
}
```

### React Router Configuration (`src/App.jsx`)
```javascript
<Router>
  <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/labs" element={<LabsApp />} />
  </Routes>
</Router>
```

## Deployment Process

### Prerequisites

1. **AWS CLI Configuration**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and default region
   ```

2. **Required Permissions**
   - S3: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`
   - CloudFront: `cloudfront:CreateInvalidation`, `cloudfront:GetInvalidation`

3. **Node.js and npm**
   ```bash
   node --version  # Should be 18+ 
   npm --version   # Should be 9+
   ```

### Automated Deployment

#### Option 1: PowerShell Script (Windows)
```powershell
# Full deployment
.\scripts\deploy-engentlabs.ps1

# Or via npm script
npm run deploy:engentlabs
```

#### Option 2: Bash Script (Linux/macOS)
```bash
# Full deployment
bash scripts/deploy-engentlabs.sh

# Or via npm script
npm run deploy:engentlabs:linux
```

### Manual Deployment Steps

#### Step 1: Build the Application
```bash
# Clean and build
npm run build

# Verify build output
ls dist/
# Should contain: index.html, assets/, courses/
```

#### Step 2: Deploy to S3
```bash
# Sync with delete flag to remove old assets
aws s3 sync dist/ s3://engentlabs-frontend/ --delete

# Verify upload
aws s3 ls s3://engentlabs-frontend/ --recursive
```

#### Step 3: Invalidate CloudFront Cache
```bash
# Create invalidation for all paths
aws cloudfront create-invalidation \
  --distribution-id E1V533CXZPR3FL \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1V533CXZPR3FL \
  --id <INVALIDATION_ID>
```

## Deployment Script Details

### PowerShell Script (`scripts/deploy-engentlabs.ps1`)

The script performs these steps:

1. **Build Verification**
   - Cleans existing `dist/` folder
   - Runs `npm run build`
   - Verifies required files exist

2. **S3 Deployment**
   - Syncs `dist/` to `s3://engentlabs-frontend/labs/`
   - Uses `--delete` flag to remove old assets
   - Verifies upload success

3. **CloudFront Invalidation**
   - Creates invalidation for all paths (`/*`)
   - Waits for invalidation to complete
   - Provides status updates

4. **Deployment Summary**
   - Shows target URL and configuration
   - Provides next steps for testing

### Script Parameters
```powershell
param(
    [string]$Environment = "production",
    [string]$DistributionId = "E1V533CXZPR3FL",
    [string]$S3Bucket = "engentlabs-frontend",
    [string]$S3Path = "labs"
)
```

## Environment Variables

### Required Environment Variables
```bash
# Backend API URL
VITE_API_URL=https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

### Optional Environment Variables
```bash
# Development server port
VITE_DEV_PORT=5173

# Build optimization
NODE_ENV=production
```

## Testing Deployment

### 1. Production URL
```
https://www.engentlabs.com/
```

### 2. Verification Steps
1. **Wait 2-3 minutes** for CloudFront propagation
2. **Test in incognito/private browser** to avoid cache
3. **Hard refresh** (Ctrl+F5) if changes not visible
4. **Clear browser cache** if needed

### 3. Health Checks
```bash
# Check S3 bucket contents
aws s3 ls s3://engentlabs-frontend/labs/ --recursive

# Check CloudFront distribution status
aws cloudfront get-distribution --id E1V533CXZPR3FL

# Test URL accessibility
curl -I https://www.engentlabs.com/labs/
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. S3 Upload Failures
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket permissions
aws s3 ls s3://engentlabs-frontend/
```

#### 3. CloudFront Cache Issues
```bash
# Force invalidation
aws cloudfront create-invalidation \
  --distribution-id E1V533CXZPR3FL \
  --paths "/*"

# Check invalidation status
aws cloudfront list-invalidations --distribution-id E1V533CXZPR3FL
```

#### 4. CORS Issues
- Ensure backend API has proper CORS headers
- Check CloudFront CORS policy configuration
- Verify API URL in environment variables

### Debug Commands

#### Check Build Output
```bash
# Verify build files
ls -la dist/

# Check asset paths in index.html
grep -r "assets/" dist/index.html
```

#### Check S3 Contents
```bash
# List all files
aws s3 ls s3://engentlabs-frontend/labs/ --recursive

# Download and inspect
aws s3 cp s3://engentlabs-frontend/labs/index.html ./temp-index.html
cat temp-index.html
```

#### Check CloudFront Status
```bash
# Get distribution details
aws cloudfront get-distribution --id E1V533CXZPR3FL

# List recent invalidations
aws cloudfront list-invalidations --distribution-id E1V533CXZPR3FL --max-items 5
```

## Security Considerations

### 1. S3 Bucket Security
- **Public Access**: Blocked
- **Bucket Policy**: CloudFront-only access
- **Encryption**: SSE-S3 enabled

### 2. CloudFront Security
- **HTTPS Only**: Redirect HTTP to HTTPS
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **Origin Access**: OAC (Origin Access Control)

### 3. Environment Variables
- **API Keys**: Never commit to repository
- **Sensitive Data**: Use AWS Secrets Manager for production

## Monitoring and Logging

### CloudFront Logs
```bash
# Enable access logs
aws cloudfront update-distribution \
  --id E1V533CXZPR3FL \
  --distribution-config file://cloudfront-config.json
```

### S3 Access Logs
```bash
# Enable bucket logging
aws s3api put-bucket-logging \
  --bucket engentlabs-frontend \
  --bucket-logging-status file://logging-config.json
```

## Cost Optimization

### CloudFront Optimization
- **Price Class**: PriceClass_100 (US, Canada, Europe)
- **Cache Policy**: CachingOptimized for static assets
- **Compression**: Enabled for text-based files

### S3 Optimization
- **Storage Class**: Standard (frequent access)
- **Lifecycle**: Move to IA after 30 days if needed
- **Versioning**: Disabled to reduce costs

## Backup and Recovery

### S3 Backup Strategy
```bash
# Create backup bucket
aws s3 mb s3://engentlabs-frontend-backup

# Sync current deployment
aws s3 sync s3://engentlabs-frontend/labs/ s3://engentlabs-frontend-backup/labs/
```

### Rollback Procedure
```bash
# Rollback to previous version
aws s3 sync s3://engentlabs-frontend-backup/labs/ s3://engentlabs-frontend/labs/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1V533CXZPR3FL \
  --paths "/*"
```

## Future Enhancements

### 1. CI/CD Pipeline
- GitHub Actions for automated deployment
- Environment-specific deployments (staging/production)
- Automated testing before deployment

### 2. Monitoring
- CloudWatch alarms for availability
- Performance monitoring with Real User Monitoring
- Error tracking and alerting

### 3. Security
- WAF (Web Application Firewall) integration
- Rate limiting and DDoS protection
- Security scanning in CI/CD pipeline

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monthly**: Review CloudFront access logs
2. **Quarterly**: Update dependencies and security patches
3. **Annually**: Review and update deployment scripts

### Emergency Contacts
- **AWS Support**: Available through AWS Console
- **Backend Team**: For API-related issues
- **DevOps Team**: For infrastructure issues

---

## Quick Reference

### Deployment Commands
```bash
# Full deployment
npm run deploy:engentlabs

# Build only
npm run build

# Deploy to S3 only
aws s3 sync dist/ s3://engentlabs-frontend/labs/ --delete

# Invalidate CloudFront only
aws cloudfront create-invalidation --distribution-id E1V533CXZPR3FL --paths "/*"
```

### Important URLs
- **Production**: https://www.engentlabs.com/
- **S3 Bucket**: s3://engentlabs-frontend/
- **CloudFront**: Distribution ID: E1V533CXZPR3FL

### Configuration Files
- **Build Config**: `vite.config.js`
- **Package Config**: `package.json`
- **Deployment Script**: `scripts/deploy-engentlabs.ps1`
- **Infrastructure**: `infrastructure/main.tf`
