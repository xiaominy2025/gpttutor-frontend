# Navigator production acceptance — 2026-11-22 Central

Normal runtime source `6471cee`; publication source `ccbb693`. Public Explore Navigator enabled; Lambda live version 3, rollback OFF version 1. Code SHA256 `Fs2kCYUm/lWg/u9ONFZqiLDt0oO1QG5STp+XCxz7Zjw=`. Tree5, BFF2, master ON/revision1 and Alpha preserved.

One authorized anonymous paid request succeeded: conservative metered $0.000289, zero retries/retained holds; ceiling $0.003. This is provider-usage accounting, not a finalized AWS/OpenAI invoice. Actual-role provider-free suites and browser cookie/viewer-IP acceptance passed. Raw IPs, cookies, continuation capabilities and secrets are excluded.

Hosted 1440/1024/768/390 checks passed with all mutation requests blocked: icon26/target44, keyboard tooltip, modal draft/focus, existing ReleaseA sign-in link, navigation, podcasts and no overflow/page errors. The paid smoke screenshots show a real returned reply; hosted checks did not repeat paid calls.

Production retains accepted Navigator 2/min,5/day,20/IP/day,1 visitor/2 global concurrent,4 conversation turns,$10/calendar-month. Quota-relaxation PR21 is excluded. New stack has ten additive resources using existing API/table/artifact bucket, new isolated runtime role/log group and Navigator-only signing parameter. No new paid-plan fixed service; usage costs apply and are not yet separately invoiced.

## Rollback
Use `scripts/coordinated-production-web.mjs rollback prod-navigator-20261122` only after confirming current HTML is still this release's owned VersionId/ETag. Restore saved prior icons HTML conditionally; retain immutable assets and issue the scoped invalidation. For AI-only rollback, conditionally switch decisionnavigator-prod-api:live from owned version3 to OFF1 using its freshly verified alias RevisionId. Do not restore data, reservations, ledgers, master settings, whole distributions, Tree or BFF. Preserve stopped journals.

## Stopped pre-provider diagnostics
Two validation attempts stopped at custom AWS CLI invoke argument parsing before invocation; corrected explicit Lambda invoke flags then passed. A paid preflight stopped parsing an empty successful absent-budget read; zero paid requests, OFF1 restored, parser corrected and independently reactivated before the single successful paid request. These were not retries of a provider request. Original stopped journals remain alongside successful evidence.

## Other releases
Forecasting owner approves $10/calendar-month production, not Alpha pilot extension; period-aware source handoff pending platform validation. Process production remains blocked by its Alpha ReleaseB session dependency versus preserved production ReleaseA Tree5/BFF2. No silent auth migration.
