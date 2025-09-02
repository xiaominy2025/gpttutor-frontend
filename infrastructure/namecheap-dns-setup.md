# Namecheap DNS Configuration

After creating your CloudFront distribution, configure these DNS records in Namecheap:

## Required DNS Records

### 1. Root Domain (ALIAS Record)
```
Type: ALIAS
Name: @ (or leave empty)
Value: [YOUR_CLOUDFRONT_DOMAIN_NAME]
TTL: Automatic
```

### 2. WWW Subdomain (CNAME Record)
```
Type: CNAME
Name: www
Value: [YOUR_CLOUDFRONT_DOMAIN_NAME]
TTL: Automatic
```

### 3. Wildcard Subdomain (Optional - CNAME Record)
```
Type: CNAME
Name: *
Value: [YOUR_CLOUDFRONT_DOMAIN_NAME]
TTL: Automatic
```

## Example Configuration

If your CloudFront domain is `d1234567890abc.cloudfront.net`, your DNS records would be:

```
ALIAS  @     → d1234567890abc.cloudfront.net
CNAME  www   → d1234567890abc.cloudfront.net
CNAME  *     → d1234567890abc.cloudfront.net (optional)
```

## Steps in Namecheap

1. Log into your Namecheap account
2. Go to **Domain List** → **Manage** for `engentlabs.com`
3. Click **Advanced DNS**
4. Add the records above
5. Save changes

## Verification

After DNS propagation (can take up to 48 hours):
- ✅ `https://engentlabs.com` should work
- ✅ `https://www.engentlabs.com` should work
- ✅ `https://any-subdomain.engentlabs.com` should work (if wildcard is configured)

## Notes

- **ALIAS vs CNAME**: Use ALIAS for root domain, CNAME for subdomains
- **TTL**: Use "Automatic" for fastest propagation
- **Propagation**: Can take 15 minutes to 48 hours
- **SSL**: Your ACM certificate will handle HTTPS for all domains
