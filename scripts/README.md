# Deployment Scripts

This directory contains deployment scripts for the GPTTutor frontend.

## Scripts

### `deploy-prod.sh` (Bash)
Production deployment script for Linux/macOS systems.

**Usage:**
```bash
S3_BUCKET=your-bucket-name \
CF_DISTRIBUTION_ID=your-cloudfront-id \
./scripts/deploy-prod.sh
```

### `deploy-prod.ps1` (PowerShell)
Production deployment script for Windows systems.

**Usage:**
```powershell
.\scripts\deploy-prod.ps1 -S3_BUCKET "your-bucket-name" -CF_DISTRIBUTION_ID "your-cloudfront-id"
```

## What the scripts do

1. **Build the frontend** using `npm run build`
2. **Upload to S3** using `aws s3 sync` with `--delete` flag
3. **Invalidate CloudFront** to serve the updated content
4. **Display success message** when complete

## Prerequisites

- AWS CLI installed and configured
- Node.js and npm installed
- Appropriate AWS permissions for S3 and CloudFront
- S3 bucket name and CloudFront distribution ID

## Features

- ✅ Automatic build detection (Vite `dist/` vs CRA `build/`)
- ✅ Error handling with early exit on failures
- ✅ Clear progress messages
- ✅ Cross-platform compatibility (Bash + PowerShell)
