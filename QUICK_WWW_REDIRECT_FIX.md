# ⚡ Quick Fix: Redirect to WWW (Skip Dual-CORS)

## 🎯 Strategy
Instead of temporarily allowing both domains in CORS, just **redirect all traffic to www** immediately. This is cleaner and faster!

**Result**: 
- Users visit `engentlabs.com` → Auto-redirect to `www.engentlabs.com` 
- Lambda CORS stays simple (www only)
- No temporary configuration needed

---

## 🚀 Implementation (30 minutes total)

### **Step 1: Create CloudFront Function (10 minutes)**

This runs at the edge, redirects before reaching your app.

#### 1.1 Go to AWS Console
1. Navigate to **CloudFront** → **Functions**
2. Click **Create function**

#### 1.2 Function Configuration
- **Name**: `redirect-to-www-engentlabs`
- **Description**: `Redirect engentlabs.com to www.engentlabs.com`
- **Runtime**: CloudFront Functions

#### 1.3 Function Code
Copy and paste this code:

```javascript
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    
    // Redirect non-www to www
    if (host === 'engentlabs.com') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { 
                    value: 'https://www.engentlabs.com' + request.uri + (request.querystring ? '?' + request.querystring : '')
                },
                'cache-control': {
                    value: 'max-age=31536000'  // Cache redirect for 1 year
                }
            }
        };
    }
    
    // For www, continue normally
    return request;
}
```

#### 1.4 Save and Publish
1. Click **Save**
2. Click **Publish** tab
3. Click **Publish function**
4. Copy the Function ARN (you'll need it)

---

### **Step 2: Associate Function with CloudFront (10 minutes)**

#### 2.1 Open Your CloudFront Distribution
1. Go to **CloudFront** → **Distributions**
2. Find your distribution: **`E1V533CXZPR3FL`** (or search for `engentlabs`)
3. Click on the Distribution ID

#### 2.2 Edit Behavior
1. Go to **Behaviors** tab
2. Select the **Default (*)** behavior (check the box)
3. Click **Edit**

#### 2.3 Add Function Association
1. Scroll down to **Function associations**
2. Under **Viewer request**:
   - **Function type**: CloudFront Functions
   - **Function ARN/Name**: Select `redirect-to-www-engentlabs`
3. Click **Save changes**

#### 2.4 Wait for Deployment
- Status will show "Deploying"
- Wait 2-5 minutes for deployment to complete
- Status will change to "Enabled"

---

### **Step 3: Verify Lambda CORS (5 minutes)**

Make sure Lambda CORS is configured for www:

```bash
aws lambda get-function-url-config \
  --function-name engent-v1666-img \
  --region us-east-2 \
  --query 'Cors'
```

**Should show**:
```json
{
  "AllowOrigins": ["https://www.engentlabs.com"],
  "AllowMethods": ["GET", "POST", "OPTIONS"],
  "AllowHeaders": ["Content-Type", "Authorization"]
}
```

**If it doesn't include www.engentlabs.com**, update it:
```bash
aws lambda update-function-url-config \
  --function-name engent-v1666-img \
  --region us-east-2 \
  --cors '{
    "AllowOrigins": ["https://www.engentlabs.com"],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "MaxAge": 86400,
    "AllowCredentials": false
  }'
```

---

### **Step 4: Test the Redirect (5 minutes)**

#### Test 1: Browser Test
1. Open browser (use incognito/private mode)
2. Go to: `http://engentlabs.com/labs`
3. **Expected**: URL bar changes to `https://www.engentlabs.com/labs`
4. **Expected**: App loads and works perfectly

#### Test 2: Direct Test (No Redirect)
1. Go to: `https://www.engentlabs.com/labs`
2. **Expected**: App loads directly (no redirect)
3. **Expected**: No CORS errors in console

#### Test 3: Command Line Test
```powershell
# Windows PowerShell
$response = Invoke-WebRequest -Uri "https://engentlabs.com/labs" `
  -MaximumRedirection 0 `
  -ErrorAction SilentlyContinue

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Location: $($response.Headers.Location)"
```

**Expected Output**:
```
Status Code: 301
Location: https://www.engentlabs.com/labs
```

#### Test 4: Full User Flow
1. Visit `engentlabs.com/labs` (without https://)
2. Should redirect to `https://www.engentlabs.com/labs`
3. App loads
4. Try asking a question
5. **Expected**: Everything works, no CORS errors

---

## 🎯 Why This Works

### Flow Diagram
```
User types: engentlabs.com/labs
    ↓
CloudFront receives request
    ↓
CloudFront Function checks host
    ↓
Host is "engentlabs.com" → Return 301 redirect
    ↓
Browser redirects to www.engentlabs.com/labs
    ↓
CloudFront receives request (www)
    ↓
Host is "www.engentlabs.com" → Continue normally
    ↓
Serve app from S3
    ↓
App makes API calls with Origin: www.engentlabs.com
    ↓
Lambda CORS allows www.engentlabs.com ✅
    ↓
Everything works!
```

---

## ✅ Success Checklist

After implementation, verify:

- [ ] `engentlabs.com` redirects to `www.engentlabs.com` (301)
- [ ] `engentlabs.com/labs` redirects to `www.engentlabs.com/labs`
- [ ] URL bar shows `www.engentlabs.com` after redirect
- [ ] App loads successfully on www domain
- [ ] No CORS errors in browser console
- [ ] Can submit questions successfully
- [ ] All app functionality works
- [ ] CloudFront distribution status shows "Enabled"

---

## 🔍 Troubleshooting

### Problem: Redirect not working
**Solution**: 
- Wait 5 more minutes (CloudFront deployment takes time)
- Clear browser cache or use incognito mode
- Check CloudFront distribution status (should be "Enabled")

### Problem: Redirect loop
**Solution**:
- Verify function code only redirects non-www to www (not both ways)
- Check the `if` condition: `if (host === 'engentlabs.com')`

### Problem: 403 Forbidden after redirect
**Solution**:
- Check S3 bucket policy allows CloudFront access
- Verify CloudFront OAC is configured

### Problem: CORS errors on www
**Solution**:
- Verify Lambda CORS includes `https://www.engentlabs.com`
- Run the CORS verification command in Step 3

### Problem: Function not triggering
**Solution**:
- Verify function is **published** (not just saved)
- Check function is associated with **Viewer request** event
- Check association is on **Default (*)** behavior

---

## 📊 Comparison with Two-Phase Approach

| Approach | Time | Steps | Complexity | Cleanup Needed |
|----------|------|-------|------------|----------------|
| **Two-Phase** (original) | 1 hour + 2 days | 3 phases | Medium | Yes (Phase 3) |
| **Quick Redirect** (this) | 30 min | 1 phase | Low | No ✅ |

**Quick Redirect Wins**: Faster, simpler, no cleanup needed!

---

## 💡 What if I Don't Have AWS CLI Access?

### Use AWS Console Only

#### For Lambda CORS:
1. Go to **Lambda Console** → Find `engent-v1666-img`
2. Go to **Configuration** → **Function URL**
3. Click **Edit** on the Function URL
4. Under **Cross-origin resource sharing (CORS)**:
   - **Allow origins**: `https://www.engentlabs.com`
   - **Allow methods**: `GET, POST, OPTIONS`
   - **Allow headers**: `Content-Type, Authorization`
   - **Max age**: `86400`
5. Click **Save**

All other steps use the console (as described above).

---

## 🎉 Benefits of This Approach

1. **Immediate Fix**: No waiting for backend team to update CORS twice
2. **Clean Configuration**: Lambda CORS stays simple (www only)
3. **SEO Friendly**: 301 redirect properly signals canonical domain
4. **Cache Friendly**: Redirect is cached at edge (fast for users)
5. **No Cleanup**: One-time setup, done forever
6. **Professional**: `www.engentlabs.com` is your canonical domain

---

## 📞 Who Does What

| Task | Owner | Time |
|------|-------|------|
| Create CloudFront Function | DevOps/Infrastructure Team | 10 min |
| Associate with CloudFront | DevOps/Infrastructure Team | 10 min |
| Verify Lambda CORS | Backend Team | 5 min |
| Test redirect | Frontend (You) | 5 min |

**Total**: 30 minutes with clear ownership

---

## 🚀 Ready to Go?

**Next Steps**:
1. Share this guide with your DevOps/Infrastructure team
2. They implement Steps 1-2 (CloudFront redirect)
3. Backend team verifies Step 3 (Lambda CORS)
4. You test Step 4
5. Done! ✅

This is the fastest, cleanest path to fixing your CORS issue. No temporary configurations, no cleanup needed later!

---

**Document Created**: October 10, 2025  
**Approach**: Quick WWW Redirect (Skip Dual-CORS)  
**Time**: 30 minutes  
**Status**: Ready to implement


