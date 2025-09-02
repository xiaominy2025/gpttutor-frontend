#!/bin/bash

# Engent Labs Frontend Deployment Script
# This script builds and deploys the frontend to www.engentlabs.com/labs/

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-"production"}
DISTRIBUTION_ID=${2:-"E1V533CXZPR3FL"}
S3_BUCKET=${3:-"engentlabs-frontend"}
S3_PATH=${4:-"labs"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Engent Labs Frontend Deployment...${NC}"
echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}S3 Bucket: $S3_BUCKET/$S3_PATH${NC}"
echo -e "${CYAN}CloudFront Distribution: $DISTRIBUTION_ID${NC}"
echo ""

# Step 1: Clean and build the project
echo -e "${YELLOW}📦 Step 1: Building production bundle...${NC}"
echo -e "${GRAY}  Cleaning existing dist folder...${NC}"
rm -rf dist/

echo -e "${GRAY}  Running npm run build...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}  ✅ Build completed successfully${NC}"

# Step 2: Verify build output
echo ""
echo -e "${YELLOW}🔍 Step 2: Verifying build output...${NC}"

if [ ! -d "dist" ]; then
    echo -e "${RED}  ❌ dist folder not found after build${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}  ❌ index.html not found in dist folder${NC}"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo -e "${RED}  ❌ assets folder not found in dist folder${NC}"
    exit 1
fi

# Check for CSS and JS files
CSS_COUNT=$(find dist/assets -name "*.css" | wc -l)
JS_COUNT=$(find dist/assets -name "*.js" | wc -l)

if [ $CSS_COUNT -eq 0 ]; then
    echo -e "${RED}  ❌ No CSS files found in dist/assets${NC}"
    exit 1
fi

if [ $JS_COUNT -eq 0 ]; then
    echo -e "${RED}  ❌ No JS files found in dist/assets${NC}"
    exit 1
fi

echo -e "${GREEN}  ✅ Build verification passed${NC}"
echo -e "${GRAY}  CSS files: $CSS_COUNT${NC}"
echo -e "${GRAY}  JS files: $JS_COUNT${NC}"

# Step 3: Deploy to S3
echo ""
echo -e "${YELLOW}☁️ Step 3: Deploying to S3...${NC}"
S3_URI="s3://$S3_BUCKET/$S3_PATH"
echo -e "${GRAY}  Syncing to: $S3_URI${NC}"

aws s3 sync dist/ "$S3_URI" --delete

if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ S3 deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}  ✅ S3 deployment completed successfully${NC}"

# Step 4: Invalidate CloudFront cache
echo ""
echo -e "${YELLOW}🔄 Step 4: Invalidating CloudFront cache...${NC}"
echo -e "${GRAY}  Creating invalidation for all paths...${NC}"

INVALIDATION_RESPONSE=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*")

if [ $? -ne 0 ]; then
    echo -e "${RED}  ❌ CloudFront invalidation failed${NC}"
    exit 1
fi

INVALIDATION_ID=$(echo "$INVALIDATION_RESPONSE" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}  ✅ Invalidation created: $INVALIDATION_ID${NC}"

# Wait for invalidation to complete
echo -e "${GRAY}  Waiting for invalidation to complete...${NC}"
while true; do
    sleep 10
    STATUS_RESPONSE=$(aws cloudfront get-invalidation --distribution-id "$DISTRIBUTION_ID" --id "$INVALIDATION_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"Status": "[^"]*"' | cut -d'"' -f4)
    echo -e "${GRAY}  Status: $STATUS${NC}"
    
    if [ "$STATUS" = "Completed" ]; then
        echo -e "${GREEN}  ✅ CloudFront invalidation completed successfully${NC}"
        break
    elif [ "$STATUS" != "InProgress" ]; then
        echo -e "${RED}  ❌ CloudFront invalidation failed with status: $STATUS${NC}"
        exit 1
    fi
done

# Step 5: Verification
echo ""
echo -e "${GREEN}✅ Step 5: Deployment Summary...${NC}"
echo -e "${CYAN}  🎯 Target URL: https://www.engentlabs.com/labs/${NC}"
echo -e "${GRAY}  📦 Build: dist/ folder deployed${NC}"
echo -e "${GRAY}  ☁️ S3: $S3_BUCKET/$S3_PATH${NC}"
echo -e "${GRAY}  🔄 CloudFront: Invalidated (ID: $INVALIDATION_ID)${NC}"
echo ""
echo -e "${GREEN}🚀 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "${GRAY}  1. Wait 2-3 minutes for CloudFront to propagate changes${NC}"
echo -e "${GRAY}  2. Test in incognito/private browser window${NC}"
echo -e "${GRAY}  3. Hard refresh (Ctrl+F5) if changes not visible${NC}"
echo -e "${GRAY}  4. Clear browser cache if needed${NC}"
