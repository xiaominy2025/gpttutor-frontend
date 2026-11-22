# Navigator Alpha paid canary — exact package for final review

**PREPARED LOCALLY; NOT AUTHORIZED OR EXECUTED.** The owner approved the completed master OFF/ON test and requested this package afterward. That approval does not authorize a provider call, private canary installation, public activation or Production change. The artifact is an armed, short-lived review build, not a deployment.

## Exact review pins

- Source: **`e7df18b50c67d3f3a495a2755957a36a11867173`**; unchanged core runtime `934f2fd837423c45d77082566ba5f55a50df4771`. Server guard/journal handoffs `f58c149` / `397023d`; operator handoff `78a219a`, independently reviewed and corrected for actual AWS qualified `$LATEST` ARN and credential metadata version pin.
- Package/binding ID: **`navigator-paid-review-0c65ff78-c369-47ad-983f-ecf1a7bd9a8b`**. The manifest field called `approval` is a binding identifier, **not authorization**.
- Exact plan SHA256: **`b63b1c45fbda12b7ee5e30db461a2542d4d6d03296ffafbf3f41af090728d116`**.
- Exact manifest SHA256: **`cd07edb4288266a8548e5d709cdb1f1868421d8323b6c8ef7ee02f064721da64`**.
- ZIP SHA256: **`89f6991ea83ed7a793c78276c1b0255bbd006e623c571739a1227b0b6bf91530`**, 311,806 bytes; base64 **`ifaZHqg+16eTx4J2wbAlW70AbmI8Vxc5oSJ7C2v5FTA=`**.
- Local artifact: `.artifacts/navigator-paid-review-0c65ff78-c369-47ad-983f-ecf1a7bd9a8b/canary.zip`. No S3 upload or Lambda installation/invocation occurred during preparation.
- Window: **Nov 21, 2026, 7:51:06–8:51:06 p.m. CST**, i.e. **2026-11-22 01:51:06.234–02:51:06.234 UTC**. Maximum one hour, one UTC month. Expiry fails closed. Do not execute an expired package or silently re-date/rebuild it; refresh the review pins if approval arrives later.

The exact plan and manifest bytes are in `final-acceptance-evidence/paid-canary-review-plan.json` and `paid-canary-review-manifest.json`. No secret, user identity, cookie, transcript or API credential is embedded. Source-file blob pins and the explicit finite write set are included in the plan.

## Proposed owner approval scope

One synthetic four-interaction run, **at most four sequential paid OpenAI requests**, no retries and a **$0.03 incremental AI ceiling**. No public traffic or user account is involved. Public Navigator stays OFF1 throughout. This package does not authorize global master toggles, HTML/alias/version publication, IAM/Cognito/DNS changes, another Coach, Production, secret changes or PR merges.

Only these execution operations would be permitted after approval:

1. Read-only identity/configuration/ledger/credential-metadata preflight against the exact baseline below. Stop on drift or a prior execution journal/canary row.
2. Conditionally replace **only Navigator `$LATEST` code** with this exact ZIP, leaving `STAGE=alpha`, `NAVIGATOR_ENABLED=false` and the public alias unchanged. Capture the acknowledged post-install private revision; require that hash/revision/configuration before every invocation.
3. One direct IAM bootstrap invocation (no model), followed by up to four one-shot direct `$LATEST` invocations with fixed synthetic chemistry messages. Thus **five Lambda invocations maximum**, **four paid generations maximum**. No public Navigator route, Student sign-in or project operation.
4. Allow only the reviewed `NAVIGATOR#` operational/usage/continuation/canary records through the unchanged runtime. Spend must be metered; real quota/budget records are not mocked or reset during this paid acceptance.
5. Stop on any failure, unknown outcome, usage discrepancy or ownership loss. Preserve the journal, spent amounts and uncertain holds. Conditionally restore the original private code and verify OFF1/master ON11. No uncontrolled retries, ledger resets or refunds.

## Baseline and independent safeguards

- Account **771049112957**, region **us-east-1**, function **decisionnavigator-alpha-api**, role **decisionnavigator-alpha-runtime**. Existing API/CloudFront/IAM remain untouched.
- Public alias **live → immutable OFF1**, revision **`9545575c-3a9c-4163-96cd-98f747a769e0`**, no traffic weights.
- Original private code SHA256 base64 **`HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`**, revision **`1dee8842-b467-4aa4-8ea0-2fe808d644c1`**. These were re-read during package preparation after the successful master test.
- Master **ON / revision11**, checked strongly before each private invocation and again by the server immediately before dispatch. Client preflight and invocation are not atomic; require an exclusive operator change window. ON remains necessary, never sufficient.
- Dedicated existing **`/decisionnavigator-alpha/openai-api-key`**, Standard SecureString **v3**. Metadata-only DescribeParameters runs before each invocation; the operator never reads its value. Runtime alone retrieves it. No duplicate or other Coach credential. Existing HMAC parameter retained.
- Fixed OpenAI **Responses** endpoint, model **gpt-6-luna**, Standard/default tier, `store:false`, no tools, no streaming. Maximum **12,000 serialized UTF-8 bytes** and **1,500 output tokens** per request.
- Independent canonical **$10/month**, Guest **2/minute / 5/day**, IP **20/day**, actor concurrency1/global2. Wait **at least61 seconds after paid turn2** before turn3; do not probe/relax rate limits.
- Every actual final serialized body is checked/reserved before its single fetch. Existing server pricing conservatively charges **$0.125/M input** and **$0.50/M output** (including cache-write ceiling, no assumed discount). At the maximum, reserve2,378 microdollars each, **$0.009512 for four**, below the separate hard ceiling30,000 microdollars ($0.03). This is conservative application accounting, not an invoice. Primary pricing rechecked: [OpenAI GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

## Durable execution, metering and rollback

`scripts/execute-navigator-paid-canary.mjs` defaults to refusal without an explicit mode. `--prepare` is read-only AWS plus local building. The separate `--execute-owner-approved <exact-plan-path> <plan-sha256>` mode must not be used until the owner explicitly approves this execution scope. It verifies source-file blob pins, artifact hash, target/baseline and live window, then exclusively creates the one designated `.artifacts/navigator-paid-canary/alpha-initial-execution/execution-journal.json`. An existing execution file blocks another attempt. Do not bypass it by choosing another directory or deleting it.

The operator uses one SigV4 fetch per AWS operation, explicit synchronous `$LATEST` / LogType None / no redirects / finite deadline. No SDK or application retry loop. HTTP200 alone is insufficient: require no Lambda function-error header and exact executed version. The fixed operator journal fsyncs pending before each invocation step (including its pacing/preflight), validates the successful step/usage/receipt, and fsyncs sanitized acknowledgement before advancing. Cookies, synthetic history, continuations and raw receipts stay only in process memory. A restart or lost result ends the run.

The server's durable **`NAVIGATOR#CANARY#ALPHA-INITIAL`** row provides independent atomic slot/reservation enforcement across processes. It has no TTL/reset. Known usage must settle the canonical monthly ledger and canary ledger before another turn. Unknown transport/usage/accounting retains conservative holds and stops. The one-time predecessor receipt prevents guessing the next step after a lost response. Final reconciliation requires exactly four acknowledged paid receipts, matching cumulative usage/spent delta, zero outstanding reservations and complete canary state. If any check fails, stop and preserve the evidence; do not assume zero spend.

Restoration uses revision CAS only while the current private code matches the owned artifact. The original versioned S3 ZIP is fixed in the plan (existing artifact bucket, source934f2fd key, version **`qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n`**). An ambiguous invoke waits for a bounded possible execution tail before restoration. After restoring, wait for original code readiness and verify unchanged OFF alias/master11. If code ownership or master revision changed, stop/reconcile rather than overwrite. No alias move or global OFF is needed for this paid test.

## Verification and honest remaining risks

- Six focused provider-free master-core tests passed and the real hosted OFF10/ON11 checks passed. Eleven operator cases were validated with mocks, including the actual qualified `$LATEST` configuration shape, drift, credential-version drift, response loss, execution-version mismatch, pacing and ledger reconciliation. Existing guard/journal tests and actual private-code restorations remain separate evidence; they were not all rerun unnecessarily.
- CLI syntax and no-argument refusal checked. Armed artifact built locally and byte hashes verified. **The execution CLI has not been run against AWS with this artifact**, and no live canary/model response is claimed.
- Key **format/runtime access**, browser cookie/IP and master gates have passed. **Provider key validity, permitted model and live coaching quality remain unproven**. The first separately approved paid request would test them. An authorization error, response-model mismatch, invalid structured output, oversized later history or usage anomaly ends the run without retry; it may complete fewer than four calls.
- Account/user sessions and Administrator MFA are not part of anonymous canary execution. No new accounts/entitlements or credential copies. No fixed new AWS fee; normal small existing Lambda/DynamoDB/SSM usage applies outside the $0.03 AI cap and is not invoice-reconciled.

**Await the owner's explicit paid-canary approval. Public activation remains a separate later release.**
