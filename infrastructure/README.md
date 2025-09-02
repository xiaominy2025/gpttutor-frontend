# CloudFront Infrastructure Setup for EngentLabs Frontend

This directory contains infrastructure scripts to set up a CloudFront distribution for hosting your React frontend from S3.

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Existing S3 bucket** with your built frontend files
3. **ACM certificate** in `us-east-1` covering:
   - `engentlabs.com`
   - `www.engentlabs.com`
   - `*.engentlabs.com`
4. **AWS Account ID** (12-digit number)

## Quick Setup (Recommended)

### Option 1: AWS CLI (Simplest)

1. **Update the configuration** in `setup-cloudfront.sh`:
   ```bash
   S3_BUCKET_NAME="your-actual-bucket-name"
   ACM_CERT_ARN="arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
   AWS_ACCOUNT_ID="123456789012"
   ```

2. **Run the setup script**:
   ```bash
   chmod +x infrastructure/setup-cloudfront.sh
   ./infrastructure/setup-cloudfront.sh
   ```

3. **Configure DNS** in Namecheap using the output values

### Option 2: Terraform

1. **Copy and update variables**:
   ```bash
   cp infrastructure/terraform.tfvars.example infrastructure/terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize and apply**:
   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

## Configuration Details

### What Gets Created

✅ **S3 Bucket Policy**: Restricts access to CloudFront only  
✅ **CloudFront Distribution**: Optimized for React SPA  
✅ **Custom Error Responses**: 403/404 → `/index.html` (SPA routing)  
✅ **SSL/TLS**: Uses your ACM certificate  
✅ **HTTP → HTTPS**: Automatic redirect  
✅ **Compression**: Enabled for better performance  
✅ **IPv6**: Enabled  
✅ **Caching**: Optimized for static content  

### Security Features

- **Origin Access**: S3 bucket only accessible via CloudFront
- **HTTPS Only**: All HTTP requests redirected to HTTPS
- **TLS 1.2+**: Modern security protocols
- **No Public S3 Access**: Bucket locked down

### Performance Features

- **Edge Caching**: Global CDN distribution
- **Compression**: Gzip compression enabled
- **HTTP/2**: Modern protocol support
- **Price Class**: Uses most cost-effective regions

## DNS Configuration

After setup, configure these DNS records in Namecheap:

```
ALIAS  @     → [CLOUDFRONT_DOMAIN]
CNAME  www   → [CLOUDFRONT_DOMAIN]
CNAME  *     → [CLOUDFRONT_DOMAIN] (optional)
```

See `namecheap-dns-setup.md` for detailed instructions.

## Integration with Deployment Script

After setup, update your deployment script with the output values:

```bash
# In your deployment script
S3_BUCKET_NAME="your-bucket-name"
CF_DISTRIBUTION_ID="E1234567890ABC" # From setup output
```

## Cost Estimation

- **CloudFront**: ~$0.085 per GB transferred (first 10TB)
- **S3**: ~$0.023 per GB stored
- **ACM**: Free for public certificates
- **Estimated monthly cost**: $5-15 for typical usage

## Troubleshooting

### Common Issues

1. **Certificate not found**: Ensure ACM certificate is in `us-east-1`
2. **S3 access denied**: Check bucket policy and permissions
3. **DNS not working**: Wait for propagation (up to 48 hours)
4. **HTTPS errors**: Verify certificate covers all domains

### Verification Commands

```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Test S3 access
aws s3 ls s3://YOUR_BUCKET_NAME/

# Check certificate
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN
```

## Support

For issues:
1. Check AWS CloudFront console for distribution status
2. Verify DNS propagation with `dig` or online tools
3. Test S3 bucket access and permissions
4. Review CloudFront error logs if available
