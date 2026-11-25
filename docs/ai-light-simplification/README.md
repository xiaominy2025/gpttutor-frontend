# AI-light simplification — Phase 1 review and proposal

November 25, 2026. Proposal only; no application code, AWS resources, IAM, credentials, provider settings, data or deployed runtimes changed during this review. No model calls. The owner's new decision supersedes AI-light application financial accounting and hard spending cutoffs. Decision Tree and Decision Process are outside scope.

## Recommendation

Remove money from the AI-light request path. Retain a small, atomic abuse-control module for request counts, expiring concurrency slots and replay protection. Reuse existing Lambdas, HTTP APIs, DynamoDB tables, secrets and the Administrator master gate. Reuse a library, not a new centralized financial or admission service. Scenario already calls the Navigator-hosted private adapter; keep that secure boundary. Forecasting need not move into that adapter.

Do not implement this as `monthlyMicros = Infinity` or skip `settle()`: those changes leave quotas/concurrency dependent on financial rows and can strand locks. Separate the state machines deliberately, then remove the financial dependency entirely.

## Verified deployed baseline

Read-only AWS collection began at 21:23:08 UTC / 3:23 p.m. Central. Full function hashes, alias revisions, runtime IAM, routes and table metadata: [aws-inventory.json](aws-inventory.json). Accepted source receipts and Coach-owner reviews were compared; no secrets or user rows were read.

- Navigator Alpha: `decisionnavigator-alpha-api:live` →4; Node22,256MB,29s,reserved concurrency2. Production: `decisionnavigator-prod-api:live` →4, same resource sizing. Both compose Navigator with the environment-specific Scenario adapter.
- Forecasting Alpha: `forecasting-alpha-api:live` →11, accepted source490482a. Production: `forecasting-prod-api:live` →4, accepted source9173933. Both Node22,256MB,25s,reserved2. Alpha11 has no active pilot date/$1 cap; it uses the canonical monthly accounting adapter.
- Scenario Alpha: `scenario-alpha-api:live` →4. Production: `scenario-prod-api:live` →1/OFF after the failed acceptance. Private Production diagnostic version4 exists but is not the public alias. Its separate single-canary approval-system blocker is unchanged by this proposal.
- Existing APIs: Alpha `8qmgd1ghdi`; Production `eoszayfkqd`. Public Navigator, Forecasting and Scenario POST routes remain anonymous (`NONE` at Gateway), with runtime Guest/Origin protection. The Scenario private POST `/internal/coaches/scenario/ai` uses `AWS_IAM` and an exact Scenario role binding.
- Existing tables: `decisiontree-alpha-staging-Data-JH4B4OFXWER5` and `decisiontree-prod-data`, on-demand, `pk/sk` key schema, TTL enabled on `expiresAt`. These tables also serve unrelated applications. Do not delete them or change shared TTL.
- Provider credentials remain raw SecureStrings `/decisionnavigator-alpha/openai-api-key` and `/decisionnavigator-prod/openai-api-key`. Navigator and Scenario share Navigator Guest proof; Forecasting has its own existing HMAC/cookie. No new provider credentials or credential format changes are proposed.

### Navigator dependencies

`server/platform/budget.mjs` combines financial and abuse controls. `navigatorControls.admit()` reads a monthly budget, shared global slots, actor/day counters and IP/day counters, then transactionally reserves money while acquiring slots/incrementing counts. `settle()` transfers reserved money into spent and releases slots. Ambiguous usage can conservatively charge the reservation; overruns can pause the shared budget. `report()` reads the budget and records50/80/100 percent markers. Financial state is `NAVIGATOR#BUDGET#YYYY-MM / STATE` with `spent`, `reserved`, monetary `leases`, `paused`, `alerted` and versions.

The same store has essential nonfinancial keys: `NAVIGATOR#NAVIGATOR#GLOBAL`, `NAVIGATOR#ACTOR#…#day`, `NAVIGATOR#IP#…#day`, `NAVIGATOR#TURN#…`. The doubled global prefix follows the actual store key function. Actor/IP values are hashed; signed conversation continuations and one-time turn claims enforce the four-interaction conversation/replay rules. These controls must survive.

`navigator-runtime.mjs` calculates a reservation from prices, checks pricing availability, requires metered usage and calls financial settlement before returning the reply. Credential access, HMAC proof, exact Origin, bounded body/history, provider timeout, master recheck and reply validation are independent of accounting and stay.

Current deployed default abuse policy comes from `budget.mjs`: Guest2/minute,5/day, IP20/day, one in flight per actor, two global slots. Navigator and Scenario share this control pool. An earlier requested6/20/100 policy is not silently treated as deployed. This migration does not retune rate limits; rate-policy changes can be reviewed separately without money controls.

### Forecasting dependencies

`alpha-advisor.mjs` mixes admission/settlement and response handling. `alpha-advisor-provider.mjs` calculates prices and reservation/cost, while also providing essential input/output bounds. `production/monthly-ledger.mjs` combines daily counters/concurrency with per-month monetary state. `production/dynamo-store.mjs` atomically couples the Coach state CAS to `production/shared-budget.mjs` and the canonical monthly CAS. `production/runtime.mjs` supplies both environment bindings; Alpha uses `alpha-monthly-runtime.mjs` / `alpha-monthly-lambda.mjs`.

Own state: `FORECASTING#ALPHA` and `FORECASTING#PROD`, plus respective `#VERIFY` keys. Both environments also read/write their `NAVIGATOR#BUDGET#YYYY-MM`. Historical pilot/hold/reconciliation records are separate from active quota counts. Preserve them as history; do not carry them into the new request path.

Current Forecasting safeguards: Guest2/minute,5/day, IP20/day,100 requests/day overall, one in flight per Guest, two Coach-global;4KiB summary,2048 bounded input tokens,512 output tokens. Forecasting's concurrency pool is separate from the Navigator/Scenario pool. The existing deployment does not enforce one global two-request pool across all three Coaches; this proposal does not introduce one.

### Scenario dependencies

`hosted/advisor-handler.mjs`, `alpha-admission-client.mjs`, `alpha-admission-transport.mjs` in the Coach source call the platform via SigV4. `server/platform/scenario-alpha-admission.mjs` binds Alpha/Production separately and handles verify/master/admit/dispatch/settle. Scenario roles have no direct table or Guest-signing-secret access.

Admission creates `NAVIGATOR#SCENARIO#REQUEST#UUID` with financial states pending/admitted/dispatched/settling/settled/uncertain, fixed832micro-USD reservation, cost and attribution. It calls the same Navigator controls and canonical budget. Successful token usage is required for settlement; uncertain outcomes leave financial reservations and reconciliation work. These financial states and40-day cost journals can be retired.

Essential controls currently mixed into the adapter: exact API/stage/route/role/Origin, verified Guest cookie, trusted gateway IP, bounded model request, master gate, one-time request claim and one-shot dispatch before a short deadline. Keep these; do not turn the private route public or give Scenario direct HMAC/table access.

## Proposed runtime contract

1. Validate the exact environment, public route, Origin, Guest proof and gateway-supplied source IP. Do not trust browser forwarding headers. Preserve optional shared sign-in/header behavior; never require an account for AI-light access.
2. Validate the unchanged analytical summary and provider input/output/model bounds. No model pricing or monetary estimate is required to construct a valid request.
3. Atomically increment visitor/IP request counters and acquire an opaque, short-lived concurrency slot. Count attempts; do not refund rate quotas merely because a provider request fails. Fail closed if this security state cannot be verified.
4. Perform a fresh master check immediately before paid dispatch. Scenario retains its private one-shot dispatch authorization so an admission replay cannot dispatch twice. No automatic model retry on uncertain outcomes.
5. Return a validated Coach reply. Release the concurrency slot on confirmed completion, independently of telemetry. On ambiguous transport/lost completion, retain only a bounded lock/tombstone until its safe expiry; there is no money to hold, settle or reconcile. Keep expiry longer than the entire configured provider/Lambda request lifetime plus margin. Do not use DynamoDB TTL deletion as the lock-expiry clock.
6. Keep minimal diagnostics: fixed error/rule code, random request ID, status/latency and optional token counts. Do not persist narrative, workbook content, raw IP, cookie, credential, dollar cost, spend total or Coach financial attribution. Missing usage metadata must not by itself prevent a valid reply once financial accounting is removed; actual output size and reply safety validation still apply.

For Scenario, version the operations on the existing private route: `acquire` →opaque execution token, `dispatch` →one-shot authorization/master check, `finish` →release/retain short-lived concurrency according to confirmed/uncertain completion. The existing proof bootstrap stays. Fold redundant verify/master round trips into acquire/dispatch where safe; normal calls can fall from five private operations to three. These are security operations, not a renamed financial settlement API: no amount, currency, cost, reservation or balance fields.

Use one small shared code library for this contract and parameterized environment/Coach bindings. Navigator can invoke it locally; Forecasting can retain local quota CAS; Scenario uses its existing private adapter. Future Simulation/Optimization should reuse this pattern without adding a centralized service or financial ledger.

## Remove, retain and reduce permissions

**Remove from active AI-light code:** monthly/cumulative monetary caps; pricing arithmetic/configuration; budget initialization and UTC month rollover; financial reservation/settlement/refund code; spending-paused state and percentage markers; cost attribution journals; reconciliation/legacy-hold migration operators; financial-canary receipts/guards as a prerequisite to each release. Archive old execution evidence rather than deleting it. Retain artifact hashes, ownership/revision guards, one-request canary limits and rollback integrity.

**Keep:** provider/Guest parameters, exact read-only `AI#CONFIG` master permission, logging, public/private routes, API invoke bindings, function timeouts and reserved concurrency. Keep DynamoDB conditional writes/transactions needed for counters, locks and replay. `store.mjs` and its transaction helper are not financial-only and cannot simply be deleted. Keep signed continuations and response/factual validation.

**Navigator IAM:** current roles allow GetItem/PutItem/DeleteItem on `NAVIGATOR#*`, plus exact master read, exact two SSM parameters and own logs. After migration narrow state access to explicit conversation/replay and quota/concurrency prefixes; exclude `NAVIGATOR#BUDGET#*` and the old Scenario financial journal prefix. Preserve conditional turn-claim deletion where the original request never dispatched. A DeleteItem right needed for claims is not financial administration.

**Forecasting IAM:** remove canonical `NAVIGATOR#BUDGET#????-??` GetItem/PutItem access and the Alpha `forecasting-alpha-shared-monthly-ledger` grant after compatibility retirement. Retire obsolete pilot write grants as well. Replace mixed-state key permissions with exact quota-only partitions per environment. Keep exact own quota GetItem/PutItem (and only transaction-member permissions actually used), master read, two existing SSM parameter reads and own logs. Do not grant table scans or broad account-wide DynamoDB access.

**Scenario IAM:** preserve exact private execute-api invoke, exact environment Navigator provider-key read and own logs. No new direct DynamoDB/HMAC access. Platform IAM retains only the new nonfinancial state prefixes after retirement of the old protocol.

Proposed permission boundary, to freeze in implementation review: Navigator's existing environment table remains the sole state resource; allow only required actor/IP/global/turn prefixes and a distinct short-lived Scenario access-token prefix, never the budget or historical request-journal prefix. Forecasting uses exact new quota-only keys for its own environment instead of `NAVIGATOR#BUDGET#*`; no cross-environment access. Preserve `dynamodb:LeadingKeys` and non-null conditions, master attribute restrictions and existing exact private API ARNs. Do not add standalone financial state writes, Scan, Query, DeleteTable or credential-list permissions. Atomic DynamoDB transactions remain legitimate for security counters and locks; removing finance does not mean removing conditional concurrency guarantees.

**Resources:** no new Lambda, API, table, bucket, secret, DNS, dashboard, scheduler, queue, Redis service or spending service is needed. Reuse existing versioned artifact buckets for release/history preservation. Do not delete existing tables, SNS topics, master controls or Tree/Process monitoring. Read-only CloudWatch queries found no deployed `NavigatorBudgetPercent` metric alarms. The financial alarms/metrics in old `infra/platform/template.yaml`, `server/platform/lambda.mjs` and related proposal policies are not the live dedicated Navigator path; mark those financial portions obsolete, not as an assumed deployed cleanup task. Do not redeploy or remove the BFF to clean up old source.

## Alpha-first migration and independent rollback

1. Approve the narrow implementation plan, then build quota-only modules and unchanged-prompt Coach adapters locally. Keep this Phase1 review documentation-only.
2. Preserve exact alias/code/config/IAM/API baselines and historical financial records. Both tables have `expiresAt` TTL: leaving old rows alone is not a perpetual archive. Before existing TTL removes history, preserve financial-only historical data in the existing versioned artifact storage with appropriate access/retention. Do not disable shared-table TTL or copy unrelated user/session data. No historical export was performed in this review.
3. Coordinate a backward-compatible Alpha platform adapter supporting old Scenario operations and the new nonfinancial contract on the existing private route. Do not replace the ongoing diagnostic package or use simplification to bypass its approval gate. Freeze the exact Scenario diagnostic/acceptance boundary before its later migration.
4. Migrate Navigator Alpha, Forecasting Alpha, then Scenario Alpha independently. Briefly stop only the affected Coach's AI admission if needed; never toggle the global master just to migrate. Allow bounded in-flight execution to finish/expire. Carry forward applicable visitor/IP request counts and active replay/concurrency protection; do not reset allowances at cutover. Use separate quota-only state from old mixed financial rows where required for safe compatibility. No rebooking old costs, transferring holds or financial reconciliation is a cutover prerequisite.
5. Establish a known-good quota-only rollback baseline for each Coach and the compatible platform composition. Keep old financial records immutable. Once all three Alpha paths are verified, review the exact Production packages/IAM deltas and repeat the same small, independent sequence in Production. Do not couple this to Homepage redesign or changes to Tree/Process.
6. Remove the temporary financial compatibility branch and broad legacy finance permissions only after no live or designated rollback version depends on it. Final runtime must make zero accesses to money rows. Old code/manifests can remain archived, without being normal deployment entrypoints.

**Rollback ownership:** Navigator/platform owns the composed Lambda and private adapter; Forecasting owns its Lambda/state adapter; Scenario owns its Lambda. Revert only the failing Coach's alias/flags against exact current revisions, retaining quota/replay state and history. Immediate safe rollback is that Coach's OFF version (deterministic/local workflows remain). Then restore its last-good quota-only candidate; do not automatically reactivate old financial runtimes or require monetary reconciliation to recover service.

**Important shared-composition boundary:** once Scenario uses the new protocol, rolling Navigator back to a pre-bridge bundle would break Scenario. Retain a compatibility baseline that can revert Navigator behavior while preserving both adapter contracts. Scenario can independently revert within that baseline. Final removal of old protocol changes the rollback floor explicitly; never claim independent rollback merely because aliases are separate.

## Focused acceptance plan

- Mock provider/state first: exact Origin and environment; missing/invalid/duplicate/expired Guest proof; spoofed forwarding headers; wrong Scenario IAM caller; all denied before dispatch. Preserve server-only credential scope and fail closed on master/credential/state errors.
- Verify unchanged effective minute/day/IP limits, denied request behavior and accurate retry time where known. Confirm two independent visitors sharing an IP are not incorrectly treated as one actor. Test new-cookie churn against IP limits; no CAPTCHA/WAF/new service proposed without evidence of serious abuse.
- Concurrent requests: atomic actor/global locks, contention, stale finish token, duplicate dispatch, request completion after client timeout, bounded expiry and day boundary. Lock release must not depend on usage telemetry or finance. Check existing pool scopes rather than claiming a new platform-wide global limit.
- Navigator: four turns, signed adaptive continuations, replay rejection, keyboard/modal and reduced-motion unaffected. Forecasting/Scenario: unchanged prompt/model/analytical payload, output limits, factual guards, Guest/shared header, Save/Open, Excel/PDF and deterministic use with AI OFF.
- Prove in mocks/integration guards that budget/journal reads and writes are forbidden yet authorized AI succeeds. Exhausted/paused/missing old money rows and calendar month changes must not affect new request admission. Missing optional usage metadata must not create a financial failure; malformed response/overlong output remains safely rejected.
- Hosted Alpha provider-blocked tests on actual roles and routes, then one focused explicitly authorized model smoke per changed path if needed. No broad SSO/Admin MFA retest. No model calls authorized by this review. Do not repeat the Scenario diagnostic canary as a simplification test.
- Verify provider monitoring separately: map existing Alpha/Production keys to their OpenAI projects, inspect usage visibility and notification recipients/thresholds. This review did not access the provider account or verify alert delivery. Use notification-only policy consistent with owner direction; do not silently alter organization-wide limits affecting Tree/Process. Native quota/credit errors may still occur and need a clear unavailable message.

OpenAI distinguishes spend alerts from optional hard-limit enforcement: [provider spend-limit documentation](https://developers.openai.com/api/docs/guides/spend-limits). The existing $10 can remain a notification target only if desired; it is no longer an application acceptance threshold or shutdown rule. Alerts are not guaranteed dollar ceilings, consistent with the owner's accepted variability.

## Expected simplification and costs

- Remove three applications' monetary calculations and monthly lifecycle dependencies, plus financial admission/settlement/reconciliation operating procedures. No replacement accounting or automatic billing-report pipeline.
- Navigator can remove the budget member from admission and completion transactions plus report/threshold reads/writes. Scenario can eliminate the40-day monetary state machine and reduce private operations. Forecasting can replace a two-row financial transaction with its own quota-only conditional state update. Exact request/cost savings must be measured after implementation; no invented percentage or monthly dollar saving.
- DynamoDB remains for essential abuse protection. Fewer operations and smaller rows should reduce variable AWS work; no new fixed-cost infrastructure is proposed. Historical archive storage is small but not measured here. Provider spend may vary and is intentionally not bounded by an application ledger.
- Retain one short release record: source/artifact pins, changed bindings, focused security tests, optional authorized smoke, alias/HTML ownership and independent rollback. Stop requiring new spending manifests, usage-cost reconciliation and calendar-month checks for ordinary AI-light releases.

## Coordination, limitations and next decision

- Forecasting review: [Issue16 comment7174986320](https://github.com/xiaominy2025/gpttutor-frontend/issues/16#issuecomment-7174986320).
- Scenario review: [Issue25 comment7174982370](https://github.com/xiaominy2025/gpttutor-frontend/issues/25#issuecomment-7174982370).
- Both owners were told that financial reconciliation is not a new migration gate, old money state is history, and standard rollback must not silently restore hard cutoffs.
- Platform owns the shared guard/protocol and coordinated IAM proposal. Coach teams retain prompts, analytical code and their adapters. Simulation/Optimization need no resources now.
- Provider project/alert configuration remains unverified; no secrets were read. Scenario Production acceptance remains separately blocked, not solved by removing accounting. This review neither deploys the new architecture nor changes the ongoing diagnostic authorization.
- Next approval is the coordinated Alpha implementation/migration scope. After approval, prepare exact code revisions and least-privilege policy diffs; use existing deployment conventions. No AWS changes have been made for this review.

Playbook replacement requirements: [playbook-amendment.md](playbook-amendment.md).
