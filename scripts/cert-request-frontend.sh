#!/usr/bin/env bash
set -euo pipefail

REGION="us-east-1"
DOMAIN="engentlabs.com"
ALTS=("www.engentlabs.com" "*.engentlabs.com")
ARN_FILE="./.acm_frontend_arn"

WATCH=0
if [[ "${1:-}" == "--watch" ]]; then WATCH=1; fi

echo "== Requesting ACM cert in ${REGION} for ${DOMAIN}, SANs: ${ALTS[*]} =="
REQ_JSON=$(aws acm request-certificate \
  --region "$REGION" \
  --domain-name "$DOMAIN" \
  --subject-alternative-names "${ALTS[@]}" \
  --validation-method DNS)

ARN=$(echo "$REQ_JSON" | jq -r '.CertificateArn' 2>/dev/null || true)
if [[ -z "${ARN}" || "${ARN}" == "null" ]]; then
  # Fallback without jq
  ARN=$(echo "$REQ_JSON" | sed -n 's/.*"CertificateArn":[[:space:]]*"\([^"]*\)".*/\1/p')
fi

echo "$ARN" > "$ARN_FILE"
echo "CertificateArn: $ARN"
echo "Saved to $ARN_FILE"

echo ""
echo "== DNS validation records =="
aws acm describe-certificate \
  --region "$REGION" \
  --certificate-arn "$ARN" \
  --query "Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}" \
  --output table

if [[ "$WATCH" -eq 1 ]]; then
  echo ""
  echo "== Watching for ISSUED status (Ctrl-C to stop) =="
  while true; do
    STATUS=$(aws acm describe-certificate --region "$REGION" --certificate-arn "$ARN" --query "Certificate.Status" --output text)
    echo "$(date '+%H:%M:%S') Status: $STATUS"
    [[ "$STATUS" == "ISSUED" ]] && break
    sleep 15
  done
fi

echo ""
echo "Tip: To reprint CNAMEs later:"
echo "aws acm describe-certificate --region $REGION --certificate-arn \$(cat $ARN_FILE) --query \"Certificate.DomainValidationOptions[].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value}\" --output table"
