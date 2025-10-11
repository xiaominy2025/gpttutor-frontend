# 🚀 Namecheap Quick Fix: Redirect to WWW

## 🎯 Goal
Redirect `engentlabs.com` → `www.engentlabs.com` using Namecheap's URL redirect feature.

**Time**: 10-15 minutes  
**Complexity**: Very Easy ⭐  
**No AWS changes needed!**

---

## ⚡ Quick Implementation (Namecheap Dashboard)

### **Step 1: Login to Namecheap (2 minutes)**

1. Go to [namecheap.com](https://www.namecheap.com)
2. Click **Sign In**
3. Go to **Domain List**
4. Find **engentlabs.com**
5. Click **Manage**

---

### **Step 2: Check Current DNS Setup (2 minutes)**

1. In domain management, click **Advanced DNS** tab
2. Look at your current records

**Expected current setup**:
```
Type    Host    Value                           TTL
A       @       <CloudFront IP or AWS>          Automatic
A       www     <CloudFront IP or AWS>          Automatic
CNAME   www     <CloudFront domain>             Automatic
```

**Note**: We need to change the root domain (`@`) to redirect.

---

### **Step 3: Enable URL Redirect (5 minutes)**

#### Option A: Using Namecheap Redirect Service (Easiest)

1. In **Advanced DNS** tab
2. Find the **A Record** for **Host: @** (root domain)
3. Delete or modify this record

4. Add **URL Redirect Record**:
   - Click **Add New Record**
   - **Type**: `URL Redirect Record`
   - **Host**: `@`
   - **Value**: `https://www.engentlabs.com`
   - **Redirect Type**: `Permanent (301)`
   - **TTL**: Automatic

5. Click **Save all changes** (green checkmark)

#### Option B: Using Redirect Settings (Alternative)

If URL Redirect Record isn't available:

1. Go to domain management page (not Advanced DNS)
2. Look for **Redirect Domain** section
3. Enable redirect:
   - **Source**: `engentlabs.com`
   - **Destination**: `https://www.engentlabs.com`
   - **Type**: `301 Permanent`

---

### **Step 4: Keep WWW Record Unchanged (1 minute)**

Make sure your `www` CNAME record stays pointing to CloudFront:

```
Type    Host    Value                                       TTL
CNAME   www     <your-cloudfront-domain>.cloudfront.net     Automatic
```

**Example CloudFront domain**: `d111111abcdef8.cloudfront.net`

**Don't change this!** This makes `www.engentlabs.com` work.

---

### **Step 5: Wait for DNS Propagation (5-15 minutes)**

DNS changes take a few minutes to propagate:
- **Namecheap**: Usually 5-15 minutes
- **Globally**: Up to 1 hour (worst case)

---

## 🧪 Testing After Implementation

### Test 1: Wait 5 Minutes, Then Test

Open PowerShell and run:

```powershell
# Test if DNS has propagated
nslookup engentlabs.com

# Test the redirect
$response = Invoke-WebRequest -Uri "http://engentlabs.com" -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Host "Status: $($response.StatusCode)"
Write-Host "Redirects to: $($response.Headers.Location)"
```

**Expected**:
```
Status: 301
Redirects to: https://www.engentlabs.com
```

### Test 2: Browser Test

1. Open browser (incognito mode)
2. Type: `engentlabs.com/labs`
3. Press Enter
4. **Expected**: URL bar changes to `https://www.engentlabs.com/labs`
5. **Expected**: App loads and works!

### Test 3: Different URLs

Test all variations redirect correctly:
- ✅ `engentlabs.com` → `https://www.engentlabs.com`
- ✅ `http://engentlabs.com` → `https://www.engentlabs.com`
- ✅ `https://engentlabs.com` → `https://www.engentlabs.com`
- ✅ `engentlabs.com/labs` → `https://www.engentlabs.com/labs`
- ✅ `engentlabs.com/labs?query=test` → `https://www.engentlabs.com/labs?query=test`

---

## 📋 Current DNS Configuration Check

### What Your DNS Should Look Like After Setup

```
Type              Host    Value                                   TTL         Purpose
------------------------------------------------------------------------------------
URL Redirect      @       https://www.engentlabs.com             Automatic   Redirect root to www
CNAME             www     dxxxxx.cloudfront.net                  Automatic   Point www to CloudFront
TXT               @       [verification records if any]          Automatic   Domain verification
```

---

## ⚠️ Important: Keep CloudFront Configuration

**Don't change anything in CloudFront!**

Your CloudFront distribution should keep serving both:
- `engentlabs.com` (for the redirect to work)
- `www.engentlabs.com` (main app)

The CloudFront certificate should include both:
- `engentlabs.com`
- `www.engentlabs.com`

This way:
1. User visits `engentlabs.com`
2. Namecheap redirect sends them to `www.engentlabs.com`
3. CloudFront serves the app from `www`
4. App makes API calls with `Origin: https://www.engentlabs.com`
5. Lambda CORS allows `www.engentlabs.com` ✅

---

## 🔧 Backend Team Action Required

After DNS redirect is set up, backend team should verify Lambda CORS:

```bash
aws lambda get-function-url-config \
  --function-name engent-v1666-img \
  --region us-east-2 \
  --query 'Cors.AllowOrigins'
```

**Should show**: `["https://www.engentlabs.com"]`

**If not configured**, update it:

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

Or via AWS Console:
1. Lambda → `engent-v1666-img` → Configuration → Function URL
2. Edit CORS → Allow origins: `https://www.engentlabs.com`
3. Save

---

## 🎉 Why This Is The Best Solution

### Advantages
✅ **Super Simple**: Just Namecheap dashboard changes  
✅ **No AWS Changes**: Don't touch CloudFront or Lambda@Edge  
✅ **Fast**: 10-15 minutes total  
✅ **Clean**: One canonical domain  
✅ **SEO Friendly**: 301 redirect is perfect for SEO  
✅ **Works Everywhere**: DNS-level redirect covers all paths  

### vs. CloudFront Function
| Feature | Namecheap Redirect | CloudFront Function |
|---------|-------------------|---------------------|
| Setup Complexity | ⭐ Very Easy | ⭐⭐⭐ Medium |
| Time to Implement | 10-15 min | 30 min |
| AWS Knowledge Required | None | Yes |
| Code Required | No | Yes |
| Maintenance | None | Function management |

---

## 🚨 Troubleshooting

### Issue: "URL Redirect Record" option not available
**Solution**: 
- Use the domain-level redirect (not Advanced DNS)
- Or contact Namecheap support to enable URL redirects

### Issue: Redirect not working after 15 minutes
**Solution**:
- Check DNS propagation: https://www.whatsmydns.net/#A/engentlabs.com
- Clear browser cache or use incognito
- Try `http://` instead of `https://` (redirect handles both)

### Issue: SSL certificate error
**Solution**:
- Make sure CloudFront certificate includes BOTH domains:
  - `engentlabs.com`
  - `www.engentlabs.com`
- Certificate must be in **us-east-1** for CloudFront

### Issue: Still getting CORS errors after redirect
**Solution**:
- Verify you're seeing `www.engentlabs.com` in browser URL bar
- Check browser console - should show `Origin: https://www.engentlabs.com`
- Verify Lambda CORS includes `https://www.engentlabs.com`

---

## 📞 Step-by-Step Action Plan

### For You (Namecheap Owner) - 10 minutes
1. ✅ Login to Namecheap
2. ✅ Go to Advanced DNS for `engentlabs.com`
3. ✅ Add URL Redirect Record: `@` → `https://www.engentlabs.com` (301)
4. ✅ Save changes
5. ✅ Wait 15 minutes
6. ✅ Test redirect in browser

### For Backend Team - 5 minutes
1. ✅ Verify Lambda CORS includes `https://www.engentlabs.com`
2. ✅ If not, update CORS configuration
3. ✅ Test API endpoint returns CORS headers

### For You (Testing) - 5 minutes
1. ✅ Visit `engentlabs.com/labs`
2. ✅ Confirm redirects to `www.engentlabs.com/labs`
3. ✅ Test app functionality
4. ✅ Verify no CORS errors in console

---

## ✅ Success Checklist

After implementation:

- [ ] Namecheap URL redirect configured (@ → www)
- [ ] DNS propagation complete (15 min wait)
- [ ] `engentlabs.com` redirects to `www.engentlabs.com` (301)
- [ ] Browser shows `www.engentlabs.com` in URL bar
- [ ] Lambda CORS configured for `www.engentlabs.com`
- [ ] App loads successfully
- [ ] No CORS errors in browser console
- [ ] Can submit questions successfully
- [ ] All app features work

---

## 💡 Quick Reference

**What to add in Namecheap Advanced DNS:**

```
Type: URL Redirect Record
Host: @
Value: https://www.engentlabs.com
Redirect Type: 301 Permanent
TTL: Automatic
```

**What backend needs to verify:**

```bash
Lambda CORS AllowOrigins: ["https://www.engentlabs.com"]
```

---

## 🎯 Timeline

| Step | Time | Who |
|------|------|-----|
| Configure Namecheap redirect | 5 min | You |
| DNS propagation | 5-15 min | Automatic |
| Verify Lambda CORS | 5 min | Backend Team |
| Test and verify | 5 min | You |
| **TOTAL** | **20-30 min** | **Team** |

---

**This is your fastest path to fixing the CORS issue!** 🚀

No complex AWS configurations needed - just a simple DNS redirect in Namecheap and a quick Lambda CORS verification.

---

**Document Created**: October 10, 2025  
**DNS Provider**: Namecheap  
**Approach**: DNS-Level Redirect  
**Status**: Ready to implement now!


