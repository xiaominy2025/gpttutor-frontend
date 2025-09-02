#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?Set S3_BUCKET}"
: "${CF_DISTRIBUTION_ID:?Set CF_DISTRIBUTION_ID}"

echo "== Build frontend =="
npm run build || npm run build --if-present

# Vite uses dist/, CRA uses build/
OUTDIR="dist"
[ -d "build" ] && OUTDIR="build"

echo "== Upload to S3 bucket: $S3_BUCKET =="
aws s3 sync "${OUTDIR}/" "s3://${S3_BUCKET}/" --delete

echo "== Invalidate CloudFront distribution: $CF_DISTRIBUTION_ID =="
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*"

echo "✅ Deployment complete"
