# 🌐 Implementation Guide: Redirect to WWW Domain

## 🎯 Goal
Make `www.engentlabs.com` the primary domain, with automatic redirect from `engentlabs.com`.

**Result**: Users visiting `engentlabs.com` will be automatically redirected to `www.engentlabs.com`

---

## 📋 Two-Phase Implementation

### **Phase 1: Immediate Fix (Today - 5 minutes)**
Add both origins to Lambda CORS so the site works from both domains while we implement the redirect.

### **Phase 2: Implement Redirect (This Week - 30 minutes)**
Set up automatic redirect from non-www to www, then simplify CORS.

---

## 🚀 Phase 1: Immediate Fix (Backend Team)

### Action Required
Update Lambda CORS to allow BOTH domains temporarily:

```bash
aws lambda update-function-url-config \
  --function-name engent-v1666-img \
  --region us-east-2 \
  --cors '{
    "AllowOrigins": [
      "https://engentlabs.com",
      "https://www.engentlabs.com"
    ],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "MaxAge": 86400,
    "AllowCredentials": false
  }'
```

### Test Phase 1
After applying:
1. Visit `https://engentlabs.com/labs` → Should work ✅
2. Visit `https://www.engentlabs.com/labs` → Should work ✅

**Timeline**: 5 minutes  
**Status**: Unblocks users immediately

---

## 🔄 Phase 2: Implement WWW Redirect

### Implementation Options

#### **Option 2A: CloudFront Function (Recommended - Fastest)**

CloudFront Functions run at edge locations for minimal latency.

**Step 1: Create CloudFront Function**

1. Go to **CloudFront Console** → **Functions**
2. Click **Create function**
3. Name: `redirect-to-www`
4. Add this code:

```javascript
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    
    // If request is to non-www, redirect to www
    if (host === 'engentlabs.com') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: 'https://www.engentlabs.com' + request.uri }
            }
        };
    }
    
    // Otherwise, continue with request
    return request;
}
```

5. Click **Save**
6. Click **Publish** → **Publish function**

**Step 2: Associate with CloudFront Distribution**

1. Go to **CloudFront Console** → **Distributions**
2. Select your distribution (ID: `E1V533CXZPR3FL`)
3. Go to **Behaviors** tab
4. Edit the **Default (*)** behavior
5. Scroll to **Function associations**
6. Under **Viewer request**:
   - **Function type**: CloudFront Functions
   - **Function ARN**: Select `redirect-to-www`
7. Click **Save changes**
8. Wait 2-3 minutes for deployment

**Step 3: Test Redirect**

```bash
# Test redirect
curl -I https://engentlabs.com/labs

# Expected output:
HTTP/2 301
location: https://www.engentlabs.com/labs
```

Or visit in browser - should automatically redirect to www version.

---

#### **Option 2B: Lambda@Edge (More Complex, More Features)**

If you need more complex logic (not needed for simple redirect).

**Step 1: Create Lambda@Edge Function**

1. **Region**: Must create in **us-east-1** (requirement for Lambda@Edge)
2. **Runtime**: Node.js 20.x
3. **Function Name**: `redirect-engentlabs-to-www`

Code:
```javascript
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const host = headers.host[0].value;
    
    if (host === 'engentlabs.com') {
        return {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                'location': [{
                    key: 'Location',
                    value: `https://www.engentlabs.com${request.uri}`
                }],
                'cache-control': [{
                    key: 'Cache-Control',
                    value: 'max-age=3600'
                }]
            }
        };
    }
    
    return request;
};
```

4. **IAM Role**: Lambda@Edge execution role
5. **Publish** as a new version

**Step 2: Associate with CloudFront**

1. Go to **CloudFront** → **Distribution** → **Behaviors**
2. Edit default behavior
3. **Lambda Function Associations**:
   - **Event Type**: Viewer Request
   - **Lambda Function ARN**: Your Lambda@Edge function ARN with version
4. Save and wait for deployment (5-10 minutes)

---

#### **Option 2C: DNS-Level Redirect (Simplest if Supported)**

If your DNS provider (looks like you might be using Route 53 or Namecheap) supports URL forwarding:

**For Route 53:**
Not directly supported - use CloudFront method above.

**For Namecheap or similar:**
1. Go to DNS settings
2. Look for "URL Redirect" or "URL Forwarding"
3. Set up:
   - **From**: `engentlabs.com`
   - **To**: `https://www.engentlabs.com`
   - **Type**: Permanent (301)

**Note**: This only works if both domains are pointing to the DNS provider's redirect service, not directly to CloudFront.

---

## 🧪 Testing Phase 2

### Test Redirect Works

**Test 1: Browser Test**
1. Open browser
2. Type `http://engentlabs.com/labs` (or https)
3. Press Enter
4. URL bar should change to `https://www.engentlabs.com/labs`

**Test 2: Command Line Test**
```bash
# Windows PowerShell
$response = Invoke-WebRequest -Uri "https://engentlabs.com/labs" -MaximumRedirection 0 -ErrorAction SilentlyContinue
$response.StatusCode  # Should be 301
$response.Headers.Location  # Should be https://www.engentlabs.com/labs
```

**Test 3: cURL Test**
```bash
curl -I https://engentlabs.com/labs

# Expected output:
HTTP/2 301
location: https://www.engentlabs.com/labs
```

### Test User Flow
1. User types `engentlabs.com` in browser
2. Automatically redirects to `www.engentlabs.com`
3. App loads and works perfectly
4. All API calls work (CORS configured for www)

---

## 🧹 Phase 3: Cleanup (After Redirect is Working)

Once the redirect is confirmed working for 24-48 hours:

### Simplify Lambda CORS

Update Lambda CORS to only allow the primary (www) domain:

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

**Why we can do this**: Since `engentlabs.com` now redirects to `www.engentlabs.com`, the browser only ever makes API calls from the www origin.

---

## 📊 Implementation Timeline

| Phase | Task | Duration | Who |
|-------|------|----------|-----|
| Phase 1 | Add both origins to Lambda CORS | 5 min | Backend |
| Phase 1 | Test both domains work | 5 min | Frontend/You |
| Phase 2 | Implement CloudFront redirect | 30 min | DevOps/Infrastructure |
| Phase 2 | Test redirect works | 10 min | Frontend/You |
| Phase 2 | Monitor for 24-48 hours | 2 days | Team |
| Phase 3 | Simplify CORS to www only | 5 min | Backend |
| Phase 3 | Final testing | 10 min | Frontend/You |

**Total Active Time**: ~1 hour  
**Total Calendar Time**: 2-3 days (including monitoring)

---

## ✅ Success Criteria

After full implementation:

- [ ] `engentlabs.com` automatically redirects to `www.engentlabs.com` (301)
- [ ] `www.engentlabs.com` loads app successfully
- [ ] All API calls work from www domain
- [ ] Browser console shows no CORS errors
- [ ] Lambda CORS simplified to single origin
- [ ] Google search results gradually consolidate to www domain
- [ ] Analytics show all traffic to www domain

---

## 🔗 SEO Benefits

301 redirects properly signal to search engines:
- `www.engentlabs.com` is the canonical domain
- Link equity from non-www transfers to www
- Prevents duplicate content issues
- Consolidates rankings to one domain

---

## 📝 Update Marketing Materials

After implementing, update:
- [ ] Business cards → `www.engentlabs.com`
- [ ] Email signatures → `www.engentlabs.com`
- [ ] Social media profiles → `www.engentlabs.com`
- [ ] Documentation → `www.engentlabs.com`
- [ ] README files → `www.engentlabs.com`

---

## 💡 Recommended Approach

**Best Path Forward**:
1. **Today**: Phase 1 (5 min backend fix, unblocks users)
2. **This Week**: Phase 2 Option 2A (CloudFront Function - fastest, simplest)
3. **After 48 Hours**: Phase 3 (cleanup CORS)

---

## 🆘 Troubleshooting

### Issue: Redirect Not Working
- **Check**: CloudFront distribution deployment status (can take 5-10 min)
- **Check**: CloudFront function is published and associated
- **Clear**: Browser cache and try incognito mode

### Issue: Redirect Loop
- **Check**: Function only redirects non-www → www (not both ways)
- **Check**: No conflicting redirects in application code

### Issue: CORS Errors After Redirect
- **Check**: Lambda CORS includes `https://www.engentlabs.com`
- **Check**: Redirect is 301 (not 302 or 307)

---

## 📞 Next Steps

1. **Immediate**: Share Phase 1 commands with backend team
2. **Today**: Verify both domains work after Phase 1 fix
3. **This Week**: Implement Phase 2 (CloudFront Function recommended)
4. **After 48h**: Clean up with Phase 3

---

**Document Created**: October 10, 2025  
**Strategy**: Option A - Redirect to WWW  
**Status**: Ready to implement


