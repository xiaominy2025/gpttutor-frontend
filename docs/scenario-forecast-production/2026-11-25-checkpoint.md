# Coordinated Production checkpoint — November 25, 2026

This is a partial release, not a successful Scenario AI publication. No PR was merged.

## Published and preserved

- Forecasting export UI source `f6cecfd3d2effb11d6c6c80164f7651d0b0ceab9` is served at https://www.engentlabs.com/forecasting/. Existing AI runtime4 is unchanged. HTML SHA256 `4af14a5882e03851df7132b297fdbf7b925b501db54b077f2feccc2a3a3e9956`.
- Scenario deterministic workspace source `70292461332f1bcfe4d242ad41e13cb94c6c2760` is installed, unlinked, at https://www.engentlabs.com/scenario-analysis/. Its AI is OFF after failed acceptance.
- Homepage/Explore HTML remains the prior Process release; Scenario still says Coming Soon. All39 podcasts reused; no MP3 uploaded.
- Navigator Production adapter source `0c8a922` is immutable live4; prior3 retained. It delegates original Navigator behavior and adds the fixed Production Scenario admission binding, using the same existing monthly row and master control.
- Tree6, Process3, BFF5, Forecasting4 remain unchanged. No credentials created, copied, rotated or exposed. Master remains ON. Alpha changes are separately owned and recorded by Forecasting.

## Acceptance and costs

Hosted Guest tests passed at1440/1024/768/390, direct navigation/refresh, project Save/Open, original workbook preservation, Excel exports and PDF generation for both workspaces. See `guest-checks.json` and `export-checks.json`. Forecasting PDF visually passed. Scenario PDF visual inspection found invalid separator/missing-preference glyphs; Coach owner confirmed mixed encoding and prepared frontend-only fix `bc7c164`, not published by this checkpoint.

Actual-role provider-free controls passed9 checks, zero model calls. This probe uses synthetic ingress context and does not independently prove browser IP provenance. No new paid retries were performed to fill that gap.

Exactly one Scenario paid UI request returned502. Immediate conditional rollback restored `scenario-prod-api:live` to OFF1. Cost326 micro-USD ($0.000326), no retained holds, canonical spend1870→2196. See `stopped-paid-canary.json`. Response body was not retained; the post-settlement narrative gate is a hypothesis, not a proven cause. Local diagnostic-only source `16bcbbb` preserves public guards and records no narrative or sensitive request content; not installed. Further paid execution is stopped pending disposition of this genuine acceptance failure.

Existing authenticated browser session was unavailable (Explore showed Guest). Optional signed-in hosted check remains pending; no account or registration changes made.

Incremental resources: dedicated Scenario Lambda256MB/25s/concurrency2, fourteen-day log group, Lambda role, versions/alias, two existing HTTP API routes/integration and exact invoke permissions. No new table, API, bucket, provider credential or DNS. Existing combined $10/month ceiling remains. These services use request/storage pricing; there is no new provisioned recurring capacity. Exact future AWS bill depends on traffic; no fixed monthly dollar claim is inferred from smoke use.

## Conditional rollback boundaries

Do not reset or refund spending ledgers. Do not replay stopped canary journals.

1. Scenario AI rollback already executed: live1, revision `ec9ef1fd-919b-4df8-bee2-0f96a067039b`; live3 retained but must not be reactivated without resolving acceptance failure.
2. Forecasting HTML current version `nxcqomeP9YFrNpWO5OMzopKstbnJzOga`, ETag `eb8c49a5d2267ec3c0884f1857309833`, writeId `0ed3bc38-794f-4c04-a8ae-f21a79fee14d`. Recheck all ownership fields before any rollback. Retrieve prior version `uiUKbsDMfmwKRryJSY4qzgtJ9rNPjWUb` of the same S3 key, verify SHA256 `0ef840186f69065b74466ae884850818844c5a5e7184f2ec553de05b2198e65a`, then conditionally put its bytes with IfMatch of the verified current ETag, no-cache HTML and new rollback metadata. Never overwrite a different release's HTML.
3. Bucket `engentlabs-frontend`, prefix `releases/engent-release-a/d6ca341656d1a246ca3c2d7d3ce44ca822876949`; Forecasting key `forecasting/index.html`. Immutable assets may remain.
4. Navigator adapter independent rollback: verify live4 hash `VGd6r2hQHsrx1yofiNNWtfDvxnMnMpAtSfkuvnZ8F5M=` and alias revision before conditional live→3. First ensure Scenario remains OFF. Preserve all accounting. Never restore old alias/configuration blindly.
5. Viewer function `engent-release-a-prod-explore` new hash `4421dac166c4c37a35f6480fdbb67abb85623dd8db75157dab3f16a2a03aaab6`; captured prior hash `da34f4ebd38df2ecad3fb26cf2838ad2d5fb59b8874b996e0479dee1c80c8a9a`. Conditional function rollback restores only two Scenario entry mappings; all other routes unchanged.
6. Root HTML never promoted; no root rollback necessary. Workspace-only invalidation receipt is recorded separately; no general cache purge.

Execution journals, original HTML bytes, complete S3 asset receipts and guarded operators remain under `.artifacts/scenario-forecast-production/` locally. Tracked receipts here contain no credentials, cookies, IP addresses or user project data.

## Remaining work

Resolve Scenario AI failure with its owner before public activation. Review encoding-only frontend correction. Complete Forecasting Alpha permanent monthly admission under the owner's instruction to remove trial dates/$1 limits; preserve historical charges and canonical monthly ceiling. Record final Alpha cutover independently of this Production checkpoint.

## Forecasting Alpha follow-up completed

The owner-requested removal of obsolete restrictions is installed: `forecasting-alpha-api:live` version11, alias revision `7e3dc9be-a179-4470-af2d-d6f2ace886fe`, final source `490482ae355dc7dd9c1153a171d92d764b58e93f`. Final ZIP SHA256 `7ff1b45426b5350b3250add61439f7a5291c5562d8ccd501272f1f224e1844b0`; Lambda CodeSha256 `f/G0VCa1NQsyUK3WFDn3pSkcVWLYzNUBJy8fIk4YRLA=` independently read. Final source adds the provider-free restricted probe to reviewed e809364; live mode leaves the probe inactive. Only environment setting is `FORECASTING_MODE=live`: no pilot/start/end/IP variables. The prior Advisor prompt and provider remain unchanged.

85 focused tests passed. Actual-role provider-blocked bootstrap/reservation/settlement passed; public Guest bootstrap200. No provider call made; narrative generation was not retested. Alpha canonical monthly spent4402 unchanged; historical2585 micro-USD held separately for reconciliation, with archived pilot unchanged and no automatic refund. One permanent shared $10 UTC calendar-month allowance, existing visitor/IP/concurrency/master safeguards and conditional rollover apply. OFF1 retained for independent alias rollback. Production runtime4 unchanged.

Authoritative receipt: https://github.com/xiaominy2025/gpttutor-frontend/issues/16#issuecomment-7173766040 . Workspace invalidation `I7J81YXMLZEWCOWNTFAAT79U9S` completed. Scenario failure remains unresolved and OFF.
