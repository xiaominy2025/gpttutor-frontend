# Forecasting production acceptance — November 22, 2026 (Central)

Published: https://www.engentlabs.com/forecasting/ and its compact launch control on https://www.engentlabs.com/explore . Anonymous Advisor AI is ON. No account is required.

## Exact sources and deployed versions

- Coach: [9173933c15ef3ec1b96a3b6b2e7efbb3ebb6c7c7](https://github.com/xiaominy2025/gpttutor-frontend/commit/9173933c15ef3ec1b96a3b6b2e7efbb3ebb6c7c7), branch `codex/issue-16-forecasting-coach`. Runtime ZIP SHA256 `14254f3bfaa1277464b0c69f96f5fdb817e1b1852707c3a3f8c93eeaf4dbf3f0`; all 13 executable modules matched committed Git blobs. The remaining package metadata entry was also checked in the Coach handoff.
- Platform directory/operator source: `69674bce8f1c51e2ce81dcbd4d3db6c4fc137ad7`. Viewer mapping source: `a74defc6fab03d164e32d7eb31eb5141bd8b9ecb`.
- `forecasting-prod-api:live` immutable version **4**, CodeSha256 `FCVPO/qhJ3RksMaflvX9uBfhsYUnB8Oj+Mk+6vTb8/A=`. Original OFF version **1** retained. Temporary restricted verification2/canary3 are not rollback baselines.
- Workspace bucket `engentlabs-frontend`, key `releases/engent-release-a/d6ca341656d1a246ca3c2d7d3ce44ca822876949/forecasting/index.html`: enabled VersionId `I66YtzlVDvIxGdhfgfkP4V2K17wDY.Ft`, ETag `77dfb4fb17539039ccad288560b94b1e`, SHA256 `2461fbd6685fe92a5065d4d5ae5e8522986f70a55eb4997e1a798ec2a662f801`.
- Directory HTML in the same release prefix: VersionId `Wt8RnFTCsaNKk8dlW._qHGDAB3Nn2fdt`, ETag `c4339fb66417d921d7742d41a803448b`, SHA256 `96b6af75546f6399526cf9ada9c4cb401d28d666cf0223a8710a7d1541ab07d8`.
- CloudFront `E1V533CXZPR3FL`, existing viewer function `engent-release-a-prod-explore`. Only Forecasting entry/slash mapping added; assets and unknown files are not masked by SPA HTML. Distribution configuration unchanged. Scoped invalidation `IBYA3TK5Y5M6HPO0EG251JP1SD` completed.

## One combined $10 monthly allowance

Navigator and Forecasting share the existing production raw credential `/decisionnavigator-prod/openai-api-key` (version3), without copying/rotating it. They also share the SAME canonical DynamoDB row `NAVIGATOR#BUDGET#YYYY-MM / STATE` in `decisiontree-prod-data`. The legacy partition name does not mean Navigator has a second allowance.

Forecasting atomically updates that row and its own `FORECASTING#PROD / STATE` quota/concurrency row in one conditional transaction. Its monthly subtotals are audit totals, not an independent $10 permission. The canonical limit is 10,000,000 micro-USD for both Coaches together per UTC calendar month. Existing spend, reservations, pause flags, metadata and Navigator leases are preserved. Settlement belongs to its admission month; unknown outcomes retain reservations and stop further unsafe dispatch. Missing previously used money state fails closed. Contention causes bounded CAS re-reads, never provider retries.

Forecasting retains 2 requests/guest/minute, 5/guest/day, 20/IP/day, 100 total/day, 1 in-flight/guest and 2 globally; Navigator retains its accepted controls unchanged. Both enforce the existing master control server-side. The Administrator master remained ON/revision1 throughout; no live global OFF toggle was repeated.

## Actual hosted acceptance and costs

- Thirteen focused production tests independently passed: shared cap race/concurrent admissions, unknown transaction outcomes, rollover, fail-closed state, quotas, exact bindings and ReleaseA account adapter. Coach owner reported79 total tests including workbooks. Two additional routing tests cover Forecasting paths and unchanged existing routes.
- Read-only policy validation: zero findings. Effective deployed policy matches the approved policy. Exact model/signing parameters only; Forecasting can write its own state and shared monthly money rows, not Navigator guest/global/conversation state, master state or Alpha/Tree/Process credentials.
- Actual-role private provider-blocked test committed and settled a real shared reservation atomically, verified raw credential format without disclosing it, and tested a master-OFF read fixture without toggling the real master. Provider calls0; shared money unchanged. Private normal code restored; public OFF1 retained during that test.
- Restricted five-minute real browser test passed CloudFront viewer-IP attribution and Secure/HttpOnly/Strict host-only cookie acceptance. OFF1 restoration passed immediately afterward. Raw IPs, cookie values and credentials were not recorded.
- Exactly **one** paid UI canary, no retries, ceiling **$0.000512**. HTTP200; real management paragraph rendered on desktop/mobile. Forecasting conservative usage charge **$0.000104** (104microUSD). Shared balance moved from289 to393microUSD; reserved0, not paused. This is provider-usage metering, not a finalized provider/AWS invoice.
- Final public Explore→Forecasting launch and anonymous bootstrap returned200/ready with zero further paid requests. Runtime4 has only `FORECASTING_MODE=live`; temporary network/window configuration is absent from this version.
- Hosted1440/1024/768/390 checks passed after publication: sample forecast, local JSON Save/Open, hard refresh, resizing, no page overflow/errors. Explore link,26px icon/44px target, hover/focus tooltip, Navigator modal/draft/focus, existing sign-in link, navigation and podcast playback passed. Screenshots are included.
- Seven standalone immutable assets and one new OFF workspace entry were staged; enabled workspace was conditionally promoted. Directory promotion uploaded only two new immutable assets, reused56 existing assets, and replaced its owned HTML conditionally. No recordings re-uploaded.
- No new fixed-price plan, new table, DNS, certificate, bucket or API was introduced. Lambda/API/DynamoDB/S3/CloudFront/log usage remains separately billed; the $10 ceiling covers model usage only. Actual incremental AWS invoice attribution is not yet available.

## Installed resource scope and preservation

New stack `forecasting-prod`, region us-east-1/account771049112957, created exactly10 additive resources: Lambda, isolated role,14-day log group, immutable OFF version, live alias, existing-API integration,2 exact POST routes and2 invocation permissions. Existing API `eoszayfkqd`, table and private release bucket reused. Only new parameter is Forecasting's signing secret `/forecasting-prod/hmac-secret`; no new provider key.

Tree production5/BFF2/Navigator3 and their alias revisions are unchanged. Forecasting Alpha9 and its expiring $1 pilot remain unchanged. Process, accounts, entitlements, projects, authentication, Administrator MFA, DNS and master settings were not modified. Process production remains blocked separately by its ReleaseB session dependency; this release does not migrate production authentication. Draft PRs remain unmerged.

## Conditional rollback

Keep the local execution journals and archived receipts; do not blindly replay publication or initialization scripts. Operators below use `.artifacts/forecasting-production` and the prepared web directory. Archived operator copies and safe receipts can be copied back to those original paths for recovery; retrieve exact immutable code from the private artifact S3 key/version in `installation.json` if needed. Never reconstruct a different ZIP and call it the original artifact.

1. AI-only emergency rollback: verify current Forecasting alias still matches version4/revision in `mode-live.json`, then run the archived operator `mode.mjs restore-off final` from the repository with its original artifact paths restored. It conditionally changes only `forecasting-prod-api:live` to OFF1. Original OFF alias restoration was exercised during acceptance. Do not change Navigator, Tree, BFF or master.
2. Workspace UI rollback: `workspace.mjs rollback` first verifies the current enabled HTML VersionId/ETag/write ownership and then restores only the pinned OFF HTML with IfMatch. Exact assets/bytes remain staged; deterministic forecasts and local projects remain usable.
3. Directory rollback, if needed: `node scripts/coordinated-production-web.mjs rollback prod-forecasting-20261122-final` verifies this release still owns the current directory HTML and restores the immediately previous Navigator production HTML. Keep assets; invalidate only reviewed paths.
4. Forecasting edge rollback, if needed: `edge.mjs rollback` verifies live/development code still equals this release's candidate, uses current IfMatch ETags, and restores only the saved prior viewer code. No whole-distribution rollback. Invalidate Forecasting paths after HTML/edge restoration as appropriate.

Stop on any ownership drift. Never roll back ledgers, spending, held reservations, sessions, accounts or project data, and never refund uncertain charges. Shared budget remains shared even when Forecasting is OFF. No destructive stack deletion is part of routine rollback.

## Reconciled preparation stops

A stale runtime ZIP was rejected before any Forecasting hosted write; corrected9173933 was checked against Git blobs, not just its manifest. Read-only CloudFront custom CLI flag handling and omitted empty-list KeyCount were corrected before their corresponding mutation. Journals retain actual write ownership; no provider request was retried. The earlier unexecuted directory plan was superseded by a fresh final manifest including `/forecasting` and `/forecasting/*` in the single scoped invalidation.
