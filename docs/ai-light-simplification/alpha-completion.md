# Quota-only Alpha migration — deployed 2026-11-25

Owner approval: Issue #11 comment 7175153308. Production was not migrated.

## Deployed state

- Navigator Alpha live version 8; clean runtime source 1dd858e, ZIP SHA256 7cecd00244a47e74c66f74184fbc2dd07cd479ad8703895956a7dcf7ba19be29. Navigator-only OFF version 7 retains Guest bootstrap and Scenario admission. Final narrow runtime IAM policy read back successfully; no monthly-budget or financial-request row permissions.
- Forecasting Alpha live version 13, source 853ed3f, ZIP c955f80cea9d5629d17b696062edc70b3aa3eb7cfa8a5c018415e9e80752352d. Existing current-day quotas carried exactly without reset. Financial and expired-pilot permissions removed. OFF1 retained.
- Scenario Alpha live version 6, source c6d91c5, ZIP a8b21140f736be4140c07feaaafbca06f80c5a684aefd6200633e63cb00f7ad4. Actual-role provider-free v2 probe passed 12 checks. OFF1 retained; no direct DynamoDB grants added.

Existing Alpha master remains ON, revision 11. Production aliases/master and Tree/Process/BFF remain unchanged. No credentials, routes, DNS, CloudFront, user data, projects or frontend media changed.

## Verification

Focused platform runtime/security tests, deployment revision regression tests and IAM-prefix tests passed (125 distinct tests across focused runs). Forecasting owner reports 91 tests; Scenario reports 15. Final Navigator rerun: 10 tests passed, including a real signed-followup-to-DynamoStore key-prefix assertion. Correct replay key namespace is NAVIGATOR#NAVIGATOR#TURN#*, retaining existing state.

Hosted Navigator Alpha: Guest bootstrap 200, Secure/HttpOnly cookie, no-store, wrong Origin 403 and missing proof 401. Forecasting public bootstrap and bad-Origin checks passed. Scenario public invalid input denied; actual-role acquire/dispatch/finish and replay denials passed. Private probe ingress was synthetic, not a new browser IP proof; accepted unchanged hosted ingress evidence is reused.

No new provider calls or paid canary were run for this migration. Prompts, models, provider transport and analytical workflows are unchanged. Reused earlier accepted real-AI evidence; this release verifies the changed authorization/quota lifecycle.

## History and actual reductions

13 historical Alpha records, 10,119 bytes, archived privately in the existing versioned bucket decisiontree-alpha-artifacts-771049112957-us-east-1. Object key releases/ai-light-history/20261125/71c00ae08e52c150d76d149be3c8f89cc25fb27a0c64fc22d896b6b19ac73d64.json; VersionId 5g3k6EH.yMe.m.6hlkaxmQiZ9QgBvUAf. SHA256 equals the key filename. Original records were not modified, reconciled or deleted. Bucket has public-access blocking and no lifecycle expiration.

Clean Alpha bundles do not import financial ledgers, prices, reservations or settlement. Historical v1 source remains solely for unchanged Production compatibility/diagnostics. Navigator nominal normal request loses 3 reads and 2 writes versus the former baseline, excluding unchanged master/SSM/turn operations. Scenario paid-path private operations fall from 5 to 3. Forecasting replaces its two-row monthly financial transaction with its own security-quota CAS. No new functions, tables, APIs, secrets or security service; normal immutable versions only. No new fixed infrastructure charge; existing request/storage charges continue.

## Rollback and limitations

Use revision-guarded aliases and recorded known-good quota-only versions. Navigator OFF7 disables only its paid dispatch, retaining Scenario proof/admission. Forecasting/Scenario OFF1 are independently executable. Never automatically restore a historical financial runtime or broaden IAM; that would require a compatible coordinated rollback. Preserve live counters and all historical evidence.

OpenAI native notification settings could not yet be verified because account login is required. This is recorded as an operational follow-up, not an application accounting dependency or deployment gate. No provider settings were changed.

Production migration package is prepared in production-migration-package.md. It explicitly preserves the separate Scenario Production 502 diagnostic milestone and its OFF state; no additional diagnostic canary or Production simplification was executed.
