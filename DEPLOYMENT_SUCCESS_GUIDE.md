# 🚀 Engent Labs Deployment Success Guide

## ✅ **Proven Deployment Process**

This guide documents the exact steps that successfully deployed both the homepage and labs application on **August 28-29, 2025**. Follow these steps precisely for guaranteed deployment success.

## 🔍 **Root Cause Analysis**

### **The Problem We Solved:**
The deployment issue was caused by **incomplete deployment process**:

1. **Partial Deployment**: Only deploying to `/labs/` subdirectory, but not updating the homepage at the root
2. **Missing CloudFront Invalidation**: Not invalidating the root path `/*`
3. **Inconsistent Process**: Different deployment scripts for homepage vs labs
4. **Cache Issues**: CloudFront caching old versions of files

### **The Solution:**
**Always deploy BOTH locations and invalidate BOTH paths:**
- ✅ **Homepage**: `s3://engentlabs-frontend/` → `https://www.engentlabs.com/`
- ✅ **Labs**: `s3://engentlabs-frontend/labs/` → `https://www.engentlabs.com/labs/`
- ✅ **Invalidate**: Both `/*` and `/labs/*` paths

## 📋 **Prerequisites**

### **Required Tools**
```bash
# Verify all tools are installed and working
aws --version          # Should be 2.28.5 or higher
node --version         # Should be 18+ (we used v22.17.1)
npm --version          # Should be 8+ (we used 10.9.2)
```

### **AWS Configuration**
```bash
# Ensure AWS CLI is configured with correct credentials
aws configure list
# Should show access key, secret key, and region (us-east-2)
```

### **Required Permissions**
- S3: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`
- CloudFront: `cloudfront:CreateInvalidation`, `cloudfront:GetInvalidation`

## 🏗️ **Step 1: Build Preparation**

### **1.1 Clean Environment**
```bash
# Navigate to project directory
cd "C:\Users\xmkya\Documents\Xiaomin Folder\ThinkPal Project\gpttutor-frontend"

# Clean any existing build
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}
```

### **1.2 Verify Source Files**
Ensure these key files exist and are up-to-date:
- ✅ `src/components/Homepage.jsx` - Updated homepage with styling
- ✅ `src/App.jsx` - Updated labs application with splash screen fixes
- ✅ `src/App.css` - Updated styles for splash screen
- ✅ `src/lib/api.js` - API service with CORS fixes
- ✅ `vite.config.js` - Build configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration

### **1.3 Build the Application**
```bash
# Build the production bundle
npm run build

# Expected output:
# ✓ 212 modules transformed.
# dist/index.html                        0.64 kB │ gzip:   0.37 kB
# dist/assets/LogoSplash-BuLNSCWs.png  209.57 kB
# dist/assets/logo-CNq5NF33.png        222.47 kB
# dist/assets/index-B_ylK1Si.css        36.88 kB │ gzip:   7.85 kB
# dist/assets/vendor-DJG_os-6.js        11.83 kB │ gzip:   4.20 kB
# dist/assets/index-_8p6jLv2.js        361.41 kB │ gzip: 113.24 kB
# ✓ built in 3.10s
```

### **1.4 Verify Build Output**
```bash
# Check build contents
dir dist

# Should contain:
# ✅ index.html
# ✅ assets/ (folder with CSS, JS, images)
# ✅ courses/ (folder with metadata)
# ✅ frontend_diagnostic.js
```

## 🚀 **Step 2: Deploy Homepage (Root)**

### **2.1 Deploy to S3 Root**
```bash
# Deploy homepage to root of S3 bucket
aws s3 sync dist/ s3://engentlabs-frontend/ --delete

# Expected output:
# upload: dist\assets\vendor-DJG_os-6.js to s3://engentlabs-frontend/assets/vendor-DJG_os-6.js
# upload: dist\assets\index-_8p6jLv2.js to s3://engentlabs-frontend/assets/index-_8p6jLv2.js
# upload: dist\index.html to s3://engentlabs-frontend/index.html
# upload: dist\assets\index-B_ylK1Si.css to s3://engentlabs-frontend/assets/index-B_ylK1Si.css
# upload: dist\assets\decision-making-demo.png to s3://engentlabs-frontend/assets/decision-making-demo.png
# upload: dist\assets\logo-CNq5NF33.png to s3://engentlabs-frontend/assets/logo-CNq5NF33.png
# upload: dist\assets\LogoSplash-BuLNSCWs.png to s3://engentlabs-frontend/assets/LogoSplash-BuLNSCWs.png
# upload: dist\assets\Engent Labs Transparent.png to s3://engentlabs-frontend/assets/Engent Labs Transparent.png
```

### **2.2 Invalidate CloudFront Cache (Root)**
```bash
# Create invalidation for homepage
aws cloudfront create-invalidation --distribution-id E1V533CXZPR3FL --paths "/*"

# Expected output:
# {
#     "Location": "https://cloudfront.amazonaws.com/2020-05-31/distribution/E1V533CXZPR3FL/invalidation/I9HNTV6ONZ130PW1DRVQK5I2NR",
#     "Invalidation": {
#         "Id": "I9HNTV6ONZ130PW1DRVQK5I2NR",
#         "Status": "InProgress",
#         ...
#     }
# }
```

### **2.3 Verify Homepage Invalidation**
```bash
# Check invalidation status (replace with actual ID from step 2.2)
aws cloudfront get-invalidation --distribution-id E1V533CXZPR3FL --id I9HNTV6ONZ130PW1DRVQK5I2NR

# Wait for Status: "Completed"
```

## 🔬 **Step 3: Deploy Labs Application**

### **3.1 Deploy to S3 Labs Subdirectory**
```bash
# Deploy labs to /labs/ subdirectory
aws s3 sync dist/ s3://engentlabs-frontend/labs/ --delete

# Expected output:
# upload: dist\courses\decision\ui_metadata.json to s3://engentlabs-frontend/labs/courses/decision/ui_metadata.json
# upload: dist\frontend_diagnostic.js to s3://engentlabs-frontend/labs/frontend_diagnostic.js
# upload: dist\assets\vendor-DJG_os-6.js to s3://engentlabs-frontend/labs/assets/vendor-DJG_os-6.js
# upload: dist\assets\index-B_ylK1Si.css to s3://engentlabs-frontend/labs/assets/index-B_ylK1Si.css
# upload: dist\assets\index-_8p6jLv2.js to s3://engentlabs-frontend/labs/assets/index-_8p6jLv2.js
# upload: dist\assets\logo-CNq5NF33.png to s3://engentlabs-frontend/labs/assets/logo-CNq5NF33.png
# upload: dist\assets\LogoSplash-BuLNSCWs.png to s3://engentlabs-frontend/labs/assets/LogoSplash-BuLNSCWs.png
# upload: dist\assets\Engent Labs Transparent.png to s3://engentlabs-frontend/labs/assets/Engent Labs Transparent.png
```

### **3.2 Ensure index.html is in Labs Directory**
```bash
# Verify index.html exists in labs directory
aws s3 ls s3://engentlabs-frontend/labs/index.html

# If missing, copy it manually:
aws s3 cp dist/index.html s3://engentlabs-frontend/labs/index.html
```

### **3.3 Invalidate CloudFront Cache (Labs)**
```bash
# Create invalidation for labs
aws cloudfront create-invalidation --distribution-id E1V533CXZPR3FL --paths "/labs/*"

# Expected output:
# {
#     "Location": "https://cloudfront.amazonaws.com/2020-05-31/distribution/E1V533CXZPR3FL/invalidation/I75J9M16788FD28HCM4YDYA00O",
#     "Invalidation": {
#         "Id": "I75J9M16788FD28HCM4YDYA00O",
#         "Status": "InProgress",
#         ...
#     }
# }
```

### **3.4 Verify Labs Invalidation**
```bash
# Check invalidation status (replace with actual ID from step 3.3)
aws cloudfront get-invalidation --distribution-id E1V533CXZPR3FL --id I75J9M16788FD28HCM4YDYA00O

# Wait for Status: "Completed"
```

## ✅ **Step 4: Verification**

### **4.1 Verify S3 Contents**
```bash
# Check both locations have correct files
aws s3 ls s3://engentlabs-frontend/ --recursive
aws s3 ls s3://engentlabs-frontend/labs/ --recursive

# Both should show:
# ✅ index.html
# ✅ assets/ (with CSS, JS, images)
# ✅ courses/ (with metadata)
# ✅ frontend_diagnostic.js
```

### **4.2 Test URLs**
**Homepage:** https://www.engentlabs.com/
- ✅ Should show updated design with new logo
- ✅ Should have "Ask Smarter. Think Deeper. Apply Sharper." subtitle
- ✅ Should have updated styling and proportions
- ✅ Should have action buttons below hero section

**Labs:** https://www.engentlabs.com/labs/
- ✅ Should load the decision-making application
- ✅ Should have no CORS errors in browser console
- ✅ Should be able to submit queries successfully
- ✅ Should have centered logo on splash screen
- ✅ Should NOT show "Click anywhere to continue" text

### **4.3 Browser Console Check**
Open browser developer tools and check:
- ✅ No CORS errors
- ✅ API calls succeeding
- ✅ Assets loading correctly
- ✅ No 404 errors for images or CSS

## 🎯 **Success Criteria**

### **Homepage Success Indicators:**
- ✅ **Visual Design**: Updated styling with Tailwind CSS
- ✅ **Logo**: Engent Labs Transparent.png displayed
- ✅ **Layout**: Even spacing, proper proportions
- ✅ **Content**: Updated text and call-to-action sections
- ✅ **Responsive**: Works on mobile and desktop
- ✅ **Action Buttons**: Blue and yellow buttons below hero section

### **Labs Success Indicators:**
- ✅ **Loading**: Application loads without errors
- ✅ **API Communication**: Backend calls succeed
- ✅ **Functionality**: Can submit queries and get responses
- ✅ **No CORS**: Browser console shows no CORS errors
- ✅ **Assets**: All images and styles load correctly
- ✅ **Splash Screen**: Centered logo, no instruction text

## 🚨 **Common Issues & Solutions**

### **Issue: Homepage shows old design**
**Solution:** 
- Ensure CloudFront invalidation completed for `/*`
- Check S3 root has latest files
- Clear browser cache (Ctrl+F5)

### **Issue: Labs not loading**
**Solution:**
- Verify `index.html` exists in `/labs/` directory
- Check CloudFront invalidation for `/labs/*`
- Ensure all assets are in `/labs/assets/`

### **Issue: CORS errors in labs**
**Solution:**
- Verify backend CORS configuration (already correct)
- Check API URL in environment variables
- Ensure no mixed content issues

### **Issue: Build fails**
**Solution:**
- Check Node.js and npm versions
- Verify all dependencies installed (`npm install`)
- Check for syntax errors in source files

### **Issue: Only one location updates**
**Solution:**
- **ALWAYS deploy both locations**: root AND `/labs/`
- **ALWAYS invalidate both paths**: `/*` AND `/labs/*`
- Use the automated deployment script: `scripts/deploy-complete.ps1`

## 📊 **Deployment Summary**

### **Files Deployed:**
- **Homepage**: `s3://engentlabs-frontend/` → `https://www.engentlabs.com/`
- **Labs**: `s3://engentlabs-frontend/labs/` → `https://www.engentlabs.com/labs/`

### **Key Files:**
- ✅ `index.html` - Main application entry point
- ✅ `assets/index-B_ylK1Si.css` - Updated styles with Tailwind
- ✅ `assets/index-_8p6jLv2.js` - Updated JavaScript with CORS fixes
- ✅ `assets/Engent Labs Transparent.png` - New logo
- ✅ `assets/decision-making-demo.png` - Demo image
- ✅ `frontend_diagnostic.js` - Diagnostic script

### **CloudFront Invalidations:**
- ✅ Root: `/*` (for homepage)
- ✅ Labs: `/labs/*` (for labs application)

## 🎉 **Success Confirmation**

**When both deployments are successful, you should see:**

1. **Homepage** (`https://www.engentlabs.com/`):
   - Beautiful updated design
   - New logo and styling
   - Proper spacing and proportions
   - Action buttons below hero section

2. **Labs** (`https://www.engentlabs.com/labs/`):
   - Fully functional decision-making application
   - No CORS errors
   - Successful backend communication
   - Centered logo on splash screen
   - No "Click anywhere to continue" text

## 🚀 **Automated Deployment**

**Use the automated script for guaranteed success:**
```bash
# Run the complete deployment script
.\scripts\deploy-complete.ps1
```

**This deployment process has been tested and proven successful on August 28-29, 2025.**
