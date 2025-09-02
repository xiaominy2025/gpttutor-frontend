#!/usr/bin/env bash
set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID="7710-4911-2957"
ATHENA_DB="engentlabs_analytics"
ATHENA_TABLE="cloudfront_logs_json"
ATHENA_RESULTS="s3://engentlabs-frontend/athena-results/"
CF_LOG_S3="s3://engentlabs-frontend/AWSLogs/${ACCOUNT_ID}/CloudFront/cloudfront-logs/"
WORKGROUP="primary"

aws s3api put-object --bucket engentlabs-frontend --key "athena-results/" >/dev/null

sql=$(sed \
  -e "s|\${ATHENA_DB}|${ATHENA_DB}|g" \
  -e "s|\${ATHENA_TABLE}|${ATHENA_TABLE}|g" \
  -e "s|\${CF_LOG_S3}|${CF_LOG_S3}|g" \
  scripts/aws_analytics/athena_create_db_and_table.sql)

tmpfile=$(mktemp)
printf "%s" "$sql" > "$tmpfile"

aws athena start-query-execution \
  --query-string file://"$tmpfile" \
  --work-group "$WORKGROUP" \
  --query-execution-context Database="${ATHENA_DB}" \
  --result-configuration OutputLocation="${ATHENA_RESULTS}" >/dev/null

echo "Submitted Athena setup. Check the Athena console for completion."
