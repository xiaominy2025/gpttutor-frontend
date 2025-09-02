# ACM Certificate Setup for Frontend

This guide covers requesting and validating an ACM certificate for your frontend domains that will be used with CloudFront.

## ⚠️ Important: CloudFront Certificate Requirements

**CloudFront requires ACM certificates to be in the `us-east-1` region**, regardless of where your S3 bucket or other resources are located.

## 🚀 Quick Setup

### Option 1: Bash (Linux/macOS/WSL)
```bash
# Request certificate
./scripts/cert-request-frontend.sh

# Request certificate and watch for issuance
./scripts/cert-request-frontend.sh --watch
```

### Option 2: PowerShell (Windows)
```powershell
# Request certificate
.\scripts\cert-request-frontend.ps1

# Request certificate and watch for issuance
.\scripts\cert-request-frontend.ps1 -Watch
```

## 📋 What the Scripts Do

1. **Request Certificate** in `us-east-1` for:
   - `engentlabs.com`
   - `www.engentlabs.com`
   - `*.engentlabs.com`

2. **Save Certificate ARN** to `./.acm_frontend_arn`

3. **Display DNS Validation Records** in a table format

4. **Optional**: Watch for issuance status (updates every 15 seconds)

## 🔧 DNS Validation in Namecheap

After running the script, you'll see a table like this:

```
| Domain           | Name                                    | Value                                    |
|------------------|----------------------------------------|------------------------------------------|
| engentlabs.com   | _abc123.engentlabs.com.                | _def456.acm-validations.aws.             |
| www.engentlabs.com | _ghi789.www.engentlabs.com.          | _jkl012.acm-validations.aws.             |
| *.engentlabs.com | _mno345.engentlabs.com.                | _pqr678.acm-validations.aws.             |
```

### Steps in Namecheap:

1. **Login** to Namecheap → Domain List → Manage
2. **Go to** Advanced DNS
3. **Add CNAME Records** for each row:
   - **Host**: Copy the `Name` value (remove trailing dot if Namecheap rejects it)
   - **Value**: Copy the `Value` value (remove trailing dot if needed)
   - **TTL**: Set to "Automatic"

### Example CNAME Entry:
- **Host**: `_abc123.engentlabs.com` (remove the trailing `.`)
- **Value**: `_def456.acm-validations.aws` (remove the trailing `.`)
- **TTL**: Automatic

## ⏱️ Validation Timeline

- **DNS Propagation**: 5-30 minutes (usually 10-15 minutes)
- **ACM Validation**: 5-30 minutes after DNS propagation
- **Total Time**: 10-60 minutes typically

## 🔍 Checking Certificate Status

### Check if Certificate is Issued:
```bash
# Bash
aws acm describe-certificate --region us-east-1 --certificate-arn $(cat ./.acm_frontend_arn) --query "Certificate.Status"

# PowerShell
aws acm describe-certificate --region us-east-1 --certificate-arn (Get-Content ./.acm_frontend_arn) --query "Certificate.Status"
```

### Reprint DNS Validation Records:
```bash
# Bash
aws acm describe-certificate --region us-east-1 --certificate-arn $(cat ./.acm_frontend_arn) --query "Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}" --output table

# PowerShell
aws acm describe-certificate --region us-east-1 --certificate-arn (Get-Content ./.acm_frontend_arn) --query "Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}" --output table
```

## ✅ Success Indicators

When successful, you'll see:
- **Status**: `ISSUED`
- **Certificate ARN**: Saved to `./.acm_frontend_arn`
- **Ready for CloudFront**: Use this ARN in your CloudFront distribution

## 🔧 Troubleshooting

### Common Issues:

1. **Wrong Region**
   - ❌ Error: Certificate not found
   - ✅ Fix: Ensure certificate is in `us-east-1`

2. **Missing CNAME Records**
   - ❌ Status: `PENDING_VALIDATION` for >30 minutes
   - ✅ Fix: Check DNS records in Namecheap

3. **DNS Propagation Delay**
   - ❌ Status: `PENDING_VALIDATION` for <30 minutes
   - ✅ Fix: Wait 10-15 minutes, then check again

4. **Trailing Dots in DNS**
   - ❌ Namecheap rejects records with trailing dots
   - ✅ Fix: Remove the final `.` from Name and Value

5. **Wrong TTL**
   - ❌ Validation takes too long
   - ✅ Fix: Set TTL to "Automatic" in Namecheap

### Verification Commands:

```bash
# Check if certificate exists
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?contains(DomainName, `engentlabs.com`)].{Domain:DomainName,Status:Status,ARN:CertificateArn}' --output table

# Check validation details
aws acm describe-certificate --region us-east-1 --certificate-arn $(cat ./.acm_frontend_arn) --query "Certificate.DomainValidationOptions[].{Domain:DomainName,Status:ValidationStatus,Method:ValidationMethod}" --output table
```

## 🎯 Next Steps

Once the certificate is **ISSUED**:

1. **Use the ARN** from `./.acm_frontend_arn` in your CloudFront distribution
2. **Configure CloudFront** with alternate domain names:
   - `engentlabs.com`
   - `www.engentlabs.com`
3. **Update DNS** to point to CloudFront distribution
4. **Test** your frontend at the new domains

## 📝 Notes

- **Free Certificate**: ACM certificates are free for public domains
- **Auto-Renewal**: AWS automatically renews certificates before expiration
- **Wildcard Coverage**: `*.engentlabs.com` covers all subdomains
- **CloudFront Only**: This certificate is specifically for CloudFront use
