# AWS Analytics Scripts for CloudFront Logs

This directory contains scripts to query CloudFront logs using Amazon Athena without needing to click through the AWS console.

## Prerequisites

1. **Confirm CloudFront logs are arriving** at:
   ```
   s3://engentlabs-frontend/AWSLogs/7710-4911-2957/CloudFront/cloudfront-logs/
   ```

2. **Install AWS CLI** and configure credentials with appropriate permissions:
   - Athena permissions
   - S3 read access to CloudFront logs
   - S3 write access to results bucket

## Configuration

Update the following parameters in each script:
- `AWS_REGION=us-east-1`
- `ACCOUNT_ID=7710-4911-2957`
- `CF_LOG_S3=s3://engentlabs-frontend/AWSLogs/7710-4911-2957/CloudFront/cloudfront-logs/`
- `ATHENA_DB=engentlabs_analytics`
- `ATHENA_TABLE=cloudfront_logs_json`
- `ATHENA_RESULTS_S3=s3://engentlabs-frontend/athena-results/`
- `WORKGROUP=primary`

## Usage

### 1. Setup Athena Database and Table

**Windows:**
```powershell
pwsh scripts/aws_analytics/run_athena_setup.ps1 -AccountId 7710-4911-2957
```

**macOS/Linux:**
```bash
bash scripts/aws_analytics/run_athena_setup.sh
```

### 2. Run Sample Queries

**Windows:**
```powershell
pwsh scripts/aws_analytics/run_athena_queries.ps1
```

**macOS/Linux:**
```bash
bash scripts/aws_analytics/run_athena_queries.sh
```

## Viewing Results

Check results in:
- **Athena Console** → Query history / Results
- **S3 Bucket** → `s3://engentlabs-frontend/athena-results/`

## Sample Queries Included

1. **Daily totals** - Request counts by date
2. **Daily unique visitors** - Unique IP counts by date  
3. **Top pages** - Most visited pages in last 7 days
4. **Status code breakdown** - HTTP status code distribution

## Notes

- Logs are treated as JSON (matches CloudFront standard log format)
- No reliance on Hive partitions - date derived from timestamp field
- Works immediately without date-partitioned paths
- Results bucket will be created automatically if missing
