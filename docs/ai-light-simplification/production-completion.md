# Production migration — Navigator and Forecasting

Navigator compatibility retirement and Scenario publication subsequently completed. See [Scenario quota-only completion](../scenario-forecast-production/scenario-quota-production-completion.md). The versions and pending boundary below describe the earlier independent Navigator/Forecasting release.

Executed November 25, 2026 under the owner's direct Production authorization, following the approved Playbook amendment. Alpha and the separate Scenario diagnostic milestone are preserved.

## Published versions and source

- Navigator: `decisionnavigator-prod-api:live` → **5**, source `93ec771b1fe8a973bd4110e4b6952201350bdba9`, compatibility ZIP SHA256 `2b47d6f844d90bb34fbd45c693ce3de51c6ffc1a4aae3332c60cf9b4822f7f22`. Node22,256MB,29s,reserved concurrency2. Independent Navigator-only OFF **6** preserves Guest bootstrap and private Scenario admission.
- Forecasting: `forecasting-prod-api:live` → **6**, source `853ed3fe4fa0d73a231dfba53cb4e6c50e5e9e59`, ZIP SHA256 `c955f80cea9d5629d17b696062edc70b3aa3eb7cfa8a5c018415e9e80752352d`. Handler forecasting-quota-lambda.handler, Node22,256MB,25s,reserved concurrency2. Exact Production/live configuration; no pilot dates or monetary fields. Independent OFF **1** retained.
- Scenario: public **OFF1**, private diagnostic **4** retained, no provider invocation or Explore activation. Navigator's temporary bridge preserves the unchanged v1 diagnostic contract and new v2 quota contract. Its legacy financial permissions are intentionally not narrowed until that separate diagnostic boundary is closed. Navigator's own public paid path uses quota-only controls and never reads financial rows.

Production URLs remain [Explore/Navigator](https://www.engentlabs.com/explore) and [Forecasting](https://www.engentlabs.com/forecasting/). No frontend, route, CloudFront, DNS, credential, authentication, account, entitlement or project changes.

## Focused acceptance

- 33 focused runtime/security/revision/IAM regressions passed; final IAM suite3/3 after adding complete-policy preservation coverage. Prior Alpha analytical and prompt/model evidence reused.
- Navigator: hosted Guest bootstrap, Secure/HttpOnly cookie, no proof401, input bounds, signed continuation and one live anonymous AI response passed. Exactly one provider request, no retries. Private OFF6 denies paid requests503 and wrong Origin403 without provider calls.
- Forecasting: old own-state revision checked after OFF1 execution drain; create-only security rows carry current-day counters exactly, source row unchanged. Existing visitor/IP/global quotas retained, no reset. Actual-role private provider-blocked verification passed Origin, trusted-network, missing proof, bootstrap, oversized body, two fixture responses and third-request rate denial. Private ingress was synthetic; established unchanged hosted network-provenance evidence reused. Public Guest bootstrap/cookie/no-store, missing proof401 and one live anonymous AI response passed. Exactly one provider request, no retries.
- Browser review: Explore remains Guest-accessible; Navigator opens its existing dialog without authentication. Forecasting sample data generates a forecast and enables Excel/PDF actions. No browser AI submission repeated the HTTP smoke; no user project touched.
- Existing CloudFront custom-error fallback masks public wrong-Origin403 as200 HTML. No cookie or API authorization is issued. Tests distinguish this HTML fallback from valid JSON; direct runtime Origin403 was verified. No infrastructure change made for this existing behavior.

## Controlled correction

Forecasting's reviewed IAM JSON was a statement fragment, not a complete role policy. The initial provider-free probe failed closed at bootstrap because applying it alone removed credential/master/log rights. Public Forecasting was OFF1; no provider call or acquisition occurred. Restored the exact four existing nonfinancial statements and retained only the new security-quota data statement, then read back and passed the full eight-check probe. Failed evidence retained. The complete policy is checked into infra/ai-light-quota/forecasting-policy-prod.json with a regression asserting exact preservation and absence of financial grants. No access expansion beyond the original role.

## History, costs and monitoring

Five historical Production records (2,923 bytes) privately archived in existing decisiontree-prod-artifacts-771049112957-us-east-1. Key releases/ai-light-history/20261125/21f463d73792ac61f80814519ae085eb693539dcb659e892f490854ecc44eb8a.json; VersionId o6ppsVQqytl_3p9RnT.73BEkbEHqg49O. Original records unchanged; no monetary reconciliation, refund, rollover or replacement accounting. This is a historical snapshot, not retirement of Scenario's separate diagnostic records.

Zero new service resources or fixed-cost infrastructure. Two provider requests total; provider-native billing is authoritative, and no application financial tracker was created. Exact billed cost and existing OpenAI notification recipients remain unverified without provider-account login. This is an operational follow-up, not an application accounting gate. No provider settings changed.

## Independent rollback

Navigator: read current live alias revision, conditionally set FunctionVersion6 with that exact RevisionId; Guest proof/Scenario contracts stay available. Forecasting: same guarded alias procedure targeting OFF1, preserving deterministic/local workflows and all quotas. Never automatically restore old paid financial runtimes or broaden IAM. Known-good quota-only versions remain immutable. Existing journals record pending-write status and CloudTrail ownership; no blind retries on ambiguous writes.

Scenario Production quota integration remains a separate handoff. Do not promote its v2 runtime, retire the v1 bridge, narrow Navigator financial permissions, or activate its Explore launch until its unresolved502 acceptance has an independently accepted disposition. Keep OFF1 and diagnostic4 available. Alpha remains Navigator8/Forecasting13/Scenario6.
