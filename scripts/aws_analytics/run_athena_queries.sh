#!/usr/bin/env bash
set -euo pipefail

ATHENA_DB="engentlabs_analytics"
ATHENA_RESULTS="s3://engentlabs-frontend/athena-results/"
WORKGROUP="primary"

sql=$(sed -e "s|\${ATHENA_DB}|${ATHENA_DB}|g" scripts/aws_analytics/athena_sample_queries.sql)
tmpfile=$(mktemp)
printf "%s" "$sql" > "$tmpfile"

aws athena start-query-execution \
  --query-string file://"$tmpfile" \
  --work-group "$WORKGROUP" \
  --query-execution-context Database="${ATHENA_DB}" \
  --result-configuration OutputLocation="${ATHENA_RESULTS}" >/dev/null

echo "Submitted sample queries (see Athena results)."

