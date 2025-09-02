# 🔧 Local Development CORS Fix Guide

## 🚨 **Problem**
The Lambda URL backend is configured to only allow requests from `https://www.engentlabs.com`, but local development runs on `localhost:5173`, causing CORS errors.

## ✅ **Solutions**

### **Option 1: Browser Extension (Recommended)**
1. Install a CORS browser extension:
   - **Chrome**: "CORS Unblock" or "Allow CORS: Access-Control-Allow-Origin"
   - **Firefox**: "CORS Everywhere"
2. Enable the extension
3. Refresh your local development page
4. The extension will automatically handle CORS headers

### **Option 2: Chrome with Disabled Security**
Use the provided PowerShell script:
```powershell
.\scripts\start-dev-cors.ps1
```

This script:
- ✅ Starts Chrome with `--disable-web-security`
- ✅ Creates a temporary profile for safety
- ✅ Automatically opens `http://localhost:5173`
- ✅ Allows cross-origin requests to Lambda URLs

### **Option 3: Manual Chrome Launch**
If the script doesn't work, manually launch Chrome:
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\temp\chrome_dev" http://localhost:5173

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir="/tmp/chrome_dev" http://localhost:5173

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev" http://localhost:5173
```

## 🔧 **Backend Fix for Deployment (Primary Solution)**
Update the Lambda Function URL CORS configuration for production deployment:

**Option A: Use the PowerShell script (Recommended)**
```powershell
.\scripts\fix-backend-cors.ps1
```

**Option B: Manual AWS CLI command**
```bash
aws lambda update-function-url-config `
  --function-name engent-v1666-img `
  --region us-east-2 `
  --cors '{"AllowOrigins":["https://www.engentlabs.com","https://engentlabs.com"],"AllowMethods":["GET","POST","OPTIONS"],"AllowHeaders":["Content-Type","Authorization"],"ExposeHeaders":["*"],"MaxAge":86400,"AllowCredentials":false}'
```

**Key Configuration:**
- ✅ **Production origins only**: `https://www.engentlabs.com` and `https://engentlabs.com`
- ✅ **Proper JSON formatting**: Single-line JSON to avoid parsing errors
- ✅ **Complete CORS headers**: All required methods and headers
- ✅ **Automatic testing**: Script validates the configuration

## 🚀 **Deployment CORS Fix (Primary Goal)**
1. **Fix backend CORS configuration**: `.\scripts\fix-backend-cors.ps1`
2. **Deploy frontend to AWS**: Follow your normal deployment process
3. **Test deployed application**: Visit `https://www.engentlabs.com`
4. **Verify no CORS errors**: Check browser console on deployed site

## 🚀 **Local Development (Secondary)**
1. Start your development server: `npm run dev`
2. Use browser extension or run: `.\scripts\start-dev-cors.ps1`
3. Test your application - CORS errors should be resolved!

## ⚠️ **Important Notes**
- **Never use disabled security for production browsing**
- **The temporary Chrome profile is safe and isolated**
- **Browser extensions are the safest option for regular development**
- **Backend CORS fix is the proper long-term solution**
- **AWS Lambda Function URL CORS is configured via AWS CLI, not in Lambda code**

## 🔍 **Verification**
After applying a fix, check the browser console:
- ✅ No CORS errors
- ✅ API requests succeed
- ✅ Course data loads properly
- ✅ Query functionality works

## 📋 **Backend CORS Validation**
After updating the backend CORS configuration, validate with PowerShell:

```powershell
# Test GET /health with localhost origin
(Invoke-WebRequest "https://<lambda-url>/health" `
  -Headers @{ "Origin" = "http://localhost:5173" }).RawContent

# Test OPTIONS /health with localhost origin
(Invoke-WebRequest "https://<lambda-url>/health" `
  -Method OPTIONS -Headers @{
    "Origin" = "http://localhost:5173";
    "Access-Control-Request-Method" = "GET"
  }).RawContent
```

**Success Criteria:**
- ✅ `Access-Control-Allow-Origin: http://localhost:5173` in response headers
- ✅ OPTIONS preflight requests succeed
- ✅ No CORS errors in browser DevTools
