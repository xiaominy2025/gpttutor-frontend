# Production migration package — original preparation

Navigator and Forecasting execution is now recorded in [Production completion](production-completion.md). Scenario remains OFF and outside that release. Do not reuse old AWS revisions from this preparation.

Approved architecture: [Issue11 comment7175153308](https://github.com/xiaominy2025/gpttutor-frontend/issues/11#issuecomment-7175153308). This package follows the owner's Alpha-first instruction; it does not authorize or execute a Production change. Refresh AWS revisions immediately before any later execution.

## Frozen application artifacts

- Platform quota implementation: `1dd858e2600bd70931468a064f86acdfc6982bc3`; Production compatibility entry/build addition: `93ec771b1fe8a973bd4110e4b6952201350bdba9`. Build with `node scripts/build-ai-light-quota.mjs` from the reviewed commit. Output manifest lists every bundled input. Production bridge ZIP SHA256 `2b47d6f844d90bb34fbd45c693ce3de51c6ffc1a4aae3332c60cf9b4822f7f22`; final clean ZIP `983456bd2cb420990d2d0a8e50b1265feb14b4ca1de25cadac96b877bbe9c80e`. Final clean bundle rejects legacy financial dependencies at build time.
- Forecasting: `853ed3fe4fa0d73a231dfba53cb4e6c50e5e9e59`, ZIP SHA256 `c955f80cea9d5629d17b696062edc70b3aa3eb7cfa8a5c018415e9e80752352d`, handler `forecasting-quota-lambda.handler`. Same stage-bound code ZIP as Alpha; Production configuration is `FORECASTING_ENVIRONMENT=production`, `FORECASTING_MODE=live`. No pilot dates or monetary limits. Owner handoff is in Issue16.
- Scenario: `c6d91c58e347ab8e2724aa65b30b964b3fcfe7ff`, Production ZIP SHA256 `8baf0ff944b59523b69d6e6b0ad3b632cfb47fd2c01fce30f12c8d6c79c43ebd`, handler `index.handler`. Only exact `SCENARIO_QUOTA_MODE=live` enables AI. Default OFF. Owner handoff is in Issue25. The v2 handler has no financial lifecycle and retains existing prompt/model/factual validation.

Local artifacts are under `.artifacts/ai-light-quota/93ec771/{production-bridge,production}/`; Coach-owned manifests and ZIP paths are in their issue handoffs. Source, package hashes and runtime configuration must agree; do not simply relabel an Alpha deployment as Production.

## Exact existing targets and required deltas

Region us-east-1, account771049112957. Existing API `eoszayfkqd`, existing table `decisiontree-prod-data`. No new functions, API, table, bucket, key, queue, scheduler, dashboard, DNS or CloudFront policy needed.

**Navigator/platform:** existing `decisionnavigator-prod-api:live` currently4. Preserve Node22,256MB,29s and reserved2. Publish a reviewed immutable compatibility version, retain a Navigator-only OFF variant, and conditionally move its existing alias. Preserve `STAGE=prod`, `NAVIGATOR_ENABLED=true`; release-only `NAVIGATOR_AI_ENABLED=false` disables Navigator AI while retaining Guest bootstrap and Scenario v2 admission. This is not another Administrator switch. The single master gate remains authoritative.

Final IAM target: existing `decisionnavigator-prod-runtime` / inline `navigator-prod-runtime`, [prepared policy](../../infra/ai-light-quota/navigator-policy-prod.json). Only quota, concurrency, Scenario access-token and signed-turn prefixes remain; actual replay prefix is `NAVIGATOR#NAVIGATOR#TURN#*`. Master, exact SSM parameter and own logs remain. Apply the narrowing only after old private Scenario financial operations are retired. The standalone template expresses the final state; do not use a one-shot stack update to remove needed compatibility before the sequence below.

**Forecasting:** existing `forecasting-prod-api:live` currently4. Preserve Node22,256MB,25s,reserved2, master, exact own HMAC and shared provider parameter scopes. Briefly quiesce only Forecasting to OFF1, drain bounded executions, conditionally carry existing current-day/minute/visitor/IP/global counters from `FORECASTING#PROD` into new own `FORECASTING#PROD#QUOTA` and `#QUOTA#VERIFY` rows. Do not reset allowances or alter old financial records. Replace own state permission with exact quota keys; remove canonical monthly-budget grants. Publish provider-blocked verification and immutable live quota versions through the established operator. No shared-budget transaction remains.

**Scenario:** existing `scenario-prod-api:live` currently1/OFF; private diagnostic4 remains a separate v1 milestone. Preserve Node22,256MB,25s,reserved2 and existing `scenario-prod-runtime` rights: own logs, `/decisionnavigator-prod/openai-api-key`, exact private execute-api invoke. No direct DynamoDB or Guest HMAC grant. Reuse existing public `POST /api/platform/scenario/management-perspective` and private `POST /internal/coaches/scenario/ai`. The latter remains AWS_IAM with exact Scenario role/API/Origin bindings. V2 is a message-contract version, not a new public endpoint.

All provider keys remain existing raw SecureStrings. No change to Tree/Process JSON credential objects, authentication, entitlements, projects or budgets. Navigator/Scenario share the existing Guest proof; Forecasting retains its own existing proof. Native provider usage/notifications replace application dollar accounting; no new provider credential or application financial service.

## Execution sequence for a later approved milestone

1. Refresh source/artifact/configuration/IAM/alias ownership, master state and scoped rollback references. Preserve historical records in existing private versioned storage, accounting for existing DynamoDB TTL. Do not make legacy monetary reconciliation a runtime or migration gate.
2. Publish the platform compatibility baseline supporting unchanged private v1 and new quota-only v2. Move Navigator's own AI path to quota-only. Validate a Navigator-only OFF variant that preserves Scenario admission and Guest proof.
3. Migrate Forecasting independently with counter carry, exact reduced IAM and actual-role provider-blocked verification. Its progress need not wait for Scenario's independent diagnosis.
4. **Scenario diagnostic boundary:** do not change its approved v1 private diagnostic package, financial adapter contract or required permissions while its 502 investigation is ongoing. Do not treat a new no-accounting runtime as proof that the previous 502 is fixed. Complete the separately authorized diagnostic/acceptance disposition first. No diagnostic paid request is authorized by this package.
5. After that boundary is closed, verify Scenario's v2 contract through the existing private API with a provider-free actual-role probe, drain only its old execution, publish its own immutable v2 version and perform the specifically authorized focused functionality acceptance. Preserve factual guards; no retry on uncertainty.
6. When all live/rollback paths use v2, publish the clean platform composition, preserve its compatible Navigator-only OFF rollback, and remove financial IAM prefixes/compatibility. Freeze old money data; no currency migration, settlement, refund or ongoing reconciliation.
7. Report exact live versions and focused evidence. Any Explore activation belongs to the separately accepted Coach publication; this backend simplification does not implicitly publish Scenario or change Home/Explore assets.

## Focused acceptance and rollback

Reuse Alpha/previous accepted analytical, SSO, MFA, exports, prompt and UI evidence. Verify Production-specific Origin/API/proof/role/parameter bindings, fresh master failure/OFF behavior with mocks or approved targeted controls, request/IP limits, contention, replay and bounded expiry. Test that optional usage absence and exhausted/missing historical money rows cannot block a valid quota-only reply. Model/request/output bounds and reply validation still apply.

Use provider-blocked actual-role tests first. If a paid smoke is needed, authorize and execute one bounded fictional request per changed path with fixed model/input/output and no retries. Native provider reporting is the spend record; do not recreate acceptance-time financial ledgers. Keep pending Scenario diagnosis entirely separate.

Rollback is per-Coach OFF or the reviewed last-good quota-only immutable version, using the current alias revision. Navigator rollback must retain Scenario v2/private proof; do not restore a pre-bridge bundle. Forecasting/Scenario OFF1 preserves deterministic/local workflows. Never restore old monetary IAM or financial runtimes automatically, replay charges, clear quotas or reset data. Source/model/schema changes outside this package require their own relevant review.

## Actual resource/cost scope and remaining verification

Zero new service resources proposed. Existing three functions/aliases, two quota-only role-policy reductions and quota rows in the existing table are sufficient; Scenario's role is unchanged. Normal immutable versions/private artifacts add storage only. No new fixed infrastructure subscription. Fewer DynamoDB operations are expected; no unmeasured bill-saving claim.

OpenAI notification settings could not be verified because the available Platform browser requires login. Verify the existing project/key mapping, notification recipients and notification-only intent in that account. Do not turn that into a new application deployment gate or silently alter unrelated organization policies. No native provider settings were changed here.
