# Navigator Alpha paid canary operator transport

Source base bf18b83c5102bcd53f53d6d52134c670a9b77a75. The master OFF/ON test has now passed. An exact local review artifact/manifest is recorded in `navigator-alpha-integration/PAID_CANARY_FINAL_REVIEW.md`; no invocation or approval to spend. The master test remains outside this operator.

## Operator binding

Use createNavigatorCanaryOperator from scripts/navigator-paid-canary-operator.mjs with the exact reviewed manifest, the installed canary ZIP SHA-256 in hex, the pinned public OFF version 1 CodeSha256 in Base64, the exact post-install private revision, the current OFF live alias revision, and the master revision returned by a fresh read after coordinated restoration. Use the designated durable local journal directory and pass operator credentials in memory. Do not put AWS credentials or an OpenAI key in a manifest, script argument, shell history, or log. No command-line entrypoint is installed or run automatically.

The transport fixes the account, region, and Navigator Lambda ARN in source. Each journaled step uses one SigV4 synchronous Lambda Invoke fetch, with explicit $LATEST qualifier, LogType None, no redirects, no retry loop, and a 35-second client deadline. HTTP 200 alone is insufficient. It also requires the Lambda response to have no function-error header and report $LATEST as the executed version. A timeout is ambiguous; do not retry.

Before every Invoke, the operator verifies the exact private code digest and revision, Alpha config and disabled runtime flag, expected role and handler, public live alias pinned to version 1 with no weights, the exact OFF version digest and config, and a strongly consistent shared master ON read at the approved revision. It also uses metadata-only SSM DescribeParameters to require the existing Standard SecureString at the approved credential version (3 by default), without retrieving its value. The private configuration accepts the actual qualified `$LATEST` ARN returned by AWS. This read-only preflight is not atomic with Lambda Invoke. Keep an exclusive operator change window and stop on any ownership drift. The server guard still checks the shared master immediately before provider dispatch.

Bootstrap, cookie, fixed synthetic history, continuation, and raw receipts stay in process memory. The process waits at least 61 seconds after receiving the second successful invocation before attempting the third paid step. This preserves the existing two-per-minute Guest limit without probing or retrying. Pacing and preflight run under a pending journal entry. A restart, failed preflight or expired manifest ends the run rather than resuming.

The operator reads the canonical monthly baseline and rejects existing holds or a paused ledger. It also requires an absent initial canary row. After four acknowledged turns it performs a final preflight and reconciles the canonical spent delta and zero reserved amount against the accumulated known usage and the completed canary ledger. Returned evidence contains step numbers, token counts, request hashes and microdollar amounts only. When a call or reconciliation is uncertain, preserve the journal and both ledgers, stop, restore the exact reviewed private runtime through the separately approved ownership checks, and reconcile with read-only evidence. Do not reset, refund, or replay an uncertain run.

## Review gates

Do not assemble an armed manifest until the coordinating owner completes and reports the approved master test. The proposed paid scope is one synthetic four-interaction run, no retries, and a $0.03 allowance. Review the exact immutable public OFF pin, armed ZIP digest, one-hour-or-shorter manifest window, private install/restoration process, and any remaining credential and provider eligibility evidence before asking for that separate approval. No paid call, credential retrieval, AWS invoke, mutation, or activation was performed while preparing this source.

References: https://docs.aws.amazon.com/lambda/latest/api/API_Invoke.html
