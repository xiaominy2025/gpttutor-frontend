# CloudFront Infrastructure Implementation Steps

## ✅ Step 1: Prerequisites Check

Before starting, verify you have:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws sts get-caller-identity
   ```

2. **Existing S3 bucket** with your frontend files
   ```bash
   aws s3 ls s3://your-bucket-name/
   ```

3. **ACM certificate** in us-east-1 covering:
   - `engentlabs.com`
   - `www.engentlabs.com`
   - `*.engentlabs.com`
   ```bash
   aws acm list-certificates --region us-east-1
   ```

4. **AWS Account ID** (12-digit number)
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

## ✅ Step 2: Update Configuration

Edit `infrastructure/setup-cloudfront.sh` and update these values:

```bash
# Replace with your actual values
S3_BUCKET_NAME="your-actual-s3-bucket-name"
ACM_CERT_ARN="arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
AWS_ACCOUNT_ID="123456789012"
```

### How to find your values:

**S3 Bucket Name:**
```bash
aws s3 ls
# Look for your bucket name in the list
```

**ACM Certificate ARN:**
```bash
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`engentlabs.com`].CertificateArn' --output text
```

**AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

## ✅ Step 3: Run the Setup Script

### On Linux/macOS:
```bash
chmod +x infrastructure/setup-cloudfront.sh
./infrastructure/setup-cloudfront.sh
```

### On Windows (PowerShell):
```bash
bash infrastructure/setup-cloudfront.sh
```

## ✅ Step 4: Configure DNS in Namecheap

After the script completes, you'll see output like:

```
📋 Distribution Details:
   Distribution ID: E1234567890ABC
   Domain Name: d1234567890abc.cloudfront.net

🌍 DNS Configuration for Namecheap:
   Type: CNAME
   Name: www
   Value: d1234567890abc.cloudfront.net

   Type: ALIAS
   Name: @ (or leave empty for root)
   Value: d1234567890abc.cloudfront.net
```

### DNS Records to Add in Namecheap:

1. **Log into Namecheap**
2. **Go to Domain List** → **Manage** for `engentlabs.com`
3. **Click Advanced DNS**
4. **Add these records:**

```
Type: ALIAS
Name: @ (or leave empty)
Value: [YOUR_CLOUDFRONT_DOMAIN]
TTL: Automatic

Type: CNAME
Name: www
Value: [YOUR_CLOUDFRONT_DOMAIN]
TTL: Automatic

Type: CNAME
Name: *
Value: [YOUR_CLOUDFRONT_DOMAIN]
TTL: Automatic (optional)
```

## ✅ Step 5: Update Your Deployment Script

After setup, update your deployment script with the new values:

```bash
# In scripts/deploy-prod.sh and scripts/deploy-prod.ps1
S3_BUCKET_NAME="your-bucket-name"
CF_DISTRIBUTION_ID="E1234567890ABC" # From setup output
```

## ✅ Step 6: Test the Setup

### Test CloudFront Distribution:
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test the CloudFront domain
curl -I https://YOUR_CLOUDFRONT_DOMAIN
```

### Test DNS (after propagation):
```bash
# Test root domain
curl -I https://engentlabs.com

# Test www subdomain
curl -I https://www.engentlabs.com
```

## 🎯 Success Criteria

Your setup is successful when:

✅ **CloudFront distribution is deployed**  
✅ **S3 bucket policy restricts access to CloudFront**  
✅ **SSL certificate is attached and valid**  
✅ **DNS records are configured in Namecheap**  
✅ **https://engentlabs.com loads your frontend**  
✅ **https://www.engentlabs.com loads your frontend**  
✅ **SPA routing works (e.g., /labs/decision-making)**  

## 🔧 Troubleshooting

### Common Issues:

1. **Certificate not found**
   - Ensure certificate is in `us-east-1` region
   - Verify certificate covers all required domains

2. **S3 access denied**
   - Check bucket policy was applied correctly
   - Verify bucket exists and is accessible

3. **DNS not working**
   - Wait for DNS propagation (up to 48 hours)
   - Verify DNS records are configured correctly

4. **CloudFront not serving content**
   - Check distribution is deployed
   - Verify origin is accessible

### Verification Commands:

```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket YOUR_BUCKET_NAME

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test S3 access from CloudFront
aws s3 ls s3://YOUR_BUCKET_NAME/

# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1
```

## 📁 Files Created

The infrastructure setup creates these files:

- `infrastructure/setup-cloudfront.sh` - Main setup script
- `infrastructure/s3-bucket-policy.json` - S3 bucket policy template
- `infrastructure/cloudfront-config.json` - CloudFront configuration template
- `infrastructure/main.tf` - Terraform alternative
- `infrastructure/README.md` - Detailed documentation
- `infrastructure/IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- `infrastructure/namecheap-dns-setup.md` - DNS configuration guide

## 🚀 Next Steps

After successful setup:

1. **Deploy your frontend** using the updated deployment scripts
2. **Test all functionality** including SPA routing
3. **Monitor CloudFront metrics** in AWS console
4. **Set up monitoring** for distribution health

## 💰 Cost Estimation

- **CloudFront**: ~$0.085 per GB transferred (first 10TB)
- **S3**: ~$0.023 per GB stored
- **ACM**: Free for public certificates
- **Estimated monthly cost**: $5-15 for typical usage

## 🆘 Support

If you encounter issues:

1. Check AWS CloudFront console for distribution status
2. Review CloudFront error logs
3. Test S3 bucket access and permissions
4. Verify DNS propagation with online tools
5. Check the troubleshooting section above
