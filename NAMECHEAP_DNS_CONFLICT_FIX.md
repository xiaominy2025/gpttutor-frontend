# 🔧 Fix: DNS Record Conflict in Namecheap

## 🚨 Problem
You're getting this error:
```
Invalid input. ALIAS record conflicts with A, AAAA, CNAME types of records. 
Please make sure you do not have those records set up for the same hosts and try again.
```

## 🔍 Root Cause
You have **existing DNS records** for the root domain (`@`) that conflict with the URL Redirect Record.

## 🛠️ Solution: Remove Conflicting Records First

### **Step 1: Check Current DNS Records (2 minutes)**

In your Advanced DNS tab, look for any records with **Host: @** (root domain). You probably have one of these:

```
Type    Host    Value                           TTL
A       @       <some IP address>               Automatic
CNAME   @       <some domain>                   Automatic
ALIAS   @       <some value>                    Automatic
```

### **Step 2: Remove Conflicting Records (3 minutes)**

1. **Find the conflicting record** with Host: `@`
2. **Click the red X** next to that record to delete it
3. **Click "SAVE ALL CHANGES"** (green button)

### **Step 3: Add URL Redirect Record (2 minutes)**

Now that the conflicting record is gone:

1. Click **"ADD NEW RECORD"** (red button)
2. **Type**: Select "URL Redirect Record"
3. **Host**: `@`
4. **Value**: `https://www.engentlabs.com`
5. **Redirect Type**: `301 Permanent`
6. Click **"SAVE ALL CHANGES"** (green button)

---

## 📋 What Your DNS Should Look Like After Fix

### **Before (Conflicting):**
```
Type    Host    Value                           TTL
A       @       <CloudFront IP>                 Automatic  ← DELETE THIS
CNAME   www     <CloudFront domain>             Automatic
```

### **After (Fixed):**
```
Type                Host    Value                           TTL
URL Redirect Record @       https://www.engentlabs.com     Permanent (301)
CNAME               www     <CloudFront domain>             Automatic
```

---

## 🎯 Common Scenarios

### **Scenario A: You have A record for @**
```
Type: A
Host: @
Value: <IP address>
```
**Action**: Delete this A record, then add URL Redirect Record.

### **Scenario B: You have CNAME for @**
```
Type: CNAME
Host: @
Value: <some domain>
```
**Action**: Delete this CNAME record, then add URL Redirect Record.

### **Scenario C: You have ALIAS for @**
```
Type: ALIAS
Host: @
Value: <some value>
```
**Action**: Delete this ALIAS record, then add URL Redirect Record.

---

## ✅ Step-by-Step Fix

### **1. Remove Conflict (5 minutes)**
1. In Advanced DNS, find record with Host: `@`
2. Click red X to delete it
3. Click "SAVE ALL CHANGES"

### **2. Add Redirect (3 minutes)**
1. Click "ADD NEW RECORD"
2. Type: "URL Redirect Record"
3. Host: `@`
4. Value: `https://www.engentlabs.com`
5. Redirect Type: `301 Permanent`
6. Click "SAVE ALL CHANGES"

### **3. Verify Setup (2 minutes)**
Your DNS should now show:
- URL Redirect Record for `@` → `https://www.engentlabs.com`
- CNAME for `www` → `<CloudFront domain>`
- No other records for Host: `@`

---

## 🧪 Test After Fix

Wait 10-15 minutes for DNS propagation, then test:

```powershell
$response = Invoke-WebRequest -Uri "https://engentlabs.com/labs" -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Host "Status: $($response.StatusCode)"
Write-Host "Redirects to: $($response.Headers.Location)"
```

**Expected**:
```
Status: 301
Redirects to: https://www.engentlabs.com/labs
```

---

## ⚠️ Important Notes

### **Don't Delete the www CNAME Record**
Keep this record - it's needed for `www.engentlabs.com` to work:
```
Type: CNAME
Host: www
Value: <your-cloudfront-domain>.cloudfront.net
```

### **Only Delete Root Domain (@) Records**
The conflict is only with records for Host: `@`. Leave all other records alone.

### **CloudFront Still Needs Both Domains**
Make sure your CloudFront certificate includes:
- `engentlabs.com`
- `www.engentlabs.com`

This allows:
1. `engentlabs.com` → Namecheap redirect → `www.engentlabs.com`
2. `www.engentlabs.com` → CloudFront → S3 (your app)

---

## 🔍 Troubleshooting

### **Still Getting Conflict Error**
**Check**: Make sure you deleted ALL records with Host: `@` (not just one)

### **www.engentlabs.com Not Working**
**Check**: You still have the CNAME record for Host: `www`

### **Redirect Not Working After 15 Minutes**
**Check**: DNS propagation status at https://www.whatsmydns.net/#A/engentlabs.com

### **SSL Certificate Error**
**Check**: CloudFront certificate includes both `engentlabs.com` and `www.engentlabs.com`

---

## 📞 Quick Action Plan

1. **Delete** the conflicting record (Host: `@`)
2. **Save** changes
3. **Add** URL Redirect Record (Host: `@`, Value: `https://www.engentlabs.com`)
4. **Save** changes
5. **Wait** 15 minutes
6. **Test** the redirect

---

## 💡 Why This Happens

Namecheap doesn't allow multiple record types for the same host. You can't have:
- A record for `@` AND
- URL Redirect Record for `@`

You need to choose one. Since you want redirect behavior, delete the A/CNAME/ALIAS record and use URL Redirect Record instead.

---

**This is a common DNS configuration issue - easy fix!** Just delete the conflicting record first, then add the redirect. 🚀

---

**Document Created**: October 10, 2025  
**Issue**: DNS Record Conflict  
**Solution**: Remove conflicting record, add redirect  
**Time**: 10 minutes

