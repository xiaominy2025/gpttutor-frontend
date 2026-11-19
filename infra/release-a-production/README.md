# Release A production preparation â€” not a deployment authorization

Auth-only extension of the approved Alpha implementation. Existing pool, table, API, frontend distributions and original Tree email registration are reused. No Navigator budget, AI capability, credential or account migration is added. Alpha files and existing homepage design are not changed.

## Prepared source

- `server/platform/release-a-production.mjs`: strict production binding and signed entitlements adapter.
- `server/platform/app-auth-only.mjs`: OAuth/session/logout routes only; no Navigator handler or generation path.
- `src/components/ReleaseAAccess.jsx`: existing-account optional login, canonical Tree enrollment guidance, safe direct-login fallback, validated launch/logout destinations.
- `scripts/build-release-a-production.mjs`: local immutable frontend/API artifacts and complete SHA256 receipt. Uses the approved homepage via build-time account-panel substitution; no website upload.
- `template.yaml`: auth disabled by default, exact production clients/roles/routes, narrow runtime boundary, no existing pool replacement. Guard-attached acknowledgement is not an enforcement mechanism or permission to deploy.
- `tree-boundary-delta.json`: append-only delta for the existing Tree runtime boundary, matching the inline identity-policy grant in the template. Read/merge the full baseline; do not replace that boundary with this delta alone.
- `scripts/release-a-production-cloudfront.mjs`: offline full-config preview/publication proposal, exact existing site origin/aliases/drift checks, versioned S3 prefix, new API behavior, old `/test/*`, certificates and error handling preserved.

Local build: `node scripts/build-release-a-production.mjs`. Artifacts are under `.artifacts/release-a-production/`; receipt explicitly records commit and dirty status. A dirty result is development evidence, never an approved release. No source secrets belong in templates or receipts.

Offline edge diff: `node scripts/release-a-production-cloudfront.mjs SAVED_SITE_CONFIG FULL_PLATFORM_COMMIT preview LOCAL_OUTPUT`. Repeat with `publish` from the original baseline for the final proposal. JSON contains the expected baseline ETag and proposed `config`; it is not a command to apply it. Fresh ETag/current-state comparison and explicit release authorization are mandatory before AWS changes. Full-document preview entry is required while the old homepage bundle is still active. Final publication switches the default origin to the same verified release. The function canonicalizes apex requests only when they reach CloudFront; the existing apex DNS exception is recorded in the final gate. www is the release entry. Existing `/test/*` stays unchanged.

Upload, when separately authorized, only to `engentlabs-frontend/releases/engent-release-a/FULL_PLATFORM_COMMIT/`, retaining the S3 OAC and all previous objects. The `/engent-release-a/*` viewer-request mapping strips that virtual prefix inside the versioned origin. `/explore` and descendants serve that release's index; React handles the actual path. Root public assets/podcasts exist in the same built release. No DNS change is needed for www/Tree. Existing apex HTTPS does not route to CloudFront and is outside this milestone; do not silently change Namecheap.

## Single review package and gates

Authoritative companion runbook is in Tree PR #14: `docs/release-a-guard-validation-and-production-package.md` (and the earlier `release-a-preserve-registration.md`). It contains exact Alpha canary lifecycle, production inventory/environment diff, preserve-registration ordering, costs and rollback. Production guard and separate Alpha-only canary guard templates are in Tree `infra/security/`.

Current decision: both Alpha gates passed and their cleanup completed. Production remains NO-GO until the one bounded production milestone is authorized. No production change set, deployment or merge has occurred. See the final production gate for refreshed state, artifact pins, exact write scope, attended acceptance and rollback. Existing SNS topic has no subscribers; do not claim alert delivery works. Runtime IAM policies are complete in the templates; no new operator/admin role is proposed or authorized.

Rollback: disable UI/BFF, restore Tree alias and both saved distribution/index versions, verify original OTP/registration/admin/media. Keep the guard attached while public clients exist; if guard removal is necessary, remove only the new public clients first and verify absence. Never close original registration or delete existing users/projects. Keep PRs #7 and #14 draft.

Local verification on 2026-11-18: 29 platform tests / 12 files passed, including auth-only behavior, exact origins, identity matching, narrow policies and offline edge mapping; SAM ValidateTemplate passed. An existing deferred-budget test fixture was pinned to UTC noon so its simulated 20-minute run does not accidentally cross midnight; no Navigator runtime code changed. These are local/syntax checks, not live Cognito or CloudFront acceptance.

## Final execution preparation

- Resource count correction: this source has **15 declarations**, plus the SAM-generated Lambda Version/Alias = **17 transformed resources**. The separate production guard has 7; auth/guard initial CloudFormation scope 24; revised monitoring proposal adds 3 for total27.
- Always use `scripts/release-a-production-template.mjs` after an approved upload returns an actual S3 VersionId. It preserves CloudFormation intrinsic references and materializes SHARED_AUTH_ENABLED as a literal in disabled/enabled phase templates. Parameter-only EnableAuth changes can leave the alias on the old published version; they are prohibited. Old versions and 14-day logs are retained. See https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html .
- `reviewAuthChanges` requires all 17 initial adds with exact types, rejects replacement/unknown resources, and bounds activation/disable to function+alias changes plus immutable version churn with processed-template Retain proof. Actual change sets remain an AWS write requiring owner authorization.
- `release-a-production-patches.mjs` makes preservation-only pool, append-only boundary and five-key Tree environment proposals. It does not call AWS. `release-a-asset-metadata.mjs` pins browser-playable MIME types and avoids immutable caching of unhashed entrypoints.
- The original website root index is never overwritten: publish/rollback changes the reviewed CloudFront origin pointer to/from a versioned release. Original assets/podcasts stay available. No S3 --delete.

The final source/artifact pins, fresh production receipts and explicit monitoring/end-of-pilot policy are recorded in Issue #6 and Tree `docs/release-a-production-execution-gate.md`. Real change-set diffs will be generated only within an explicitly authorized production milestone.

## Mandatory logging privacy prerequisite

The existing website logging-v2 delivery aThRgLrDEczfdnUd selects query, cookie and referrer fields and writes into the website bucket. Its bucket policy currently permits CloudFront reads across that bucket. Legacy Distribution.Logging.Enabled=false does not describe logging-v2. No historical logs were read and no exposure is asserted from log contents.

Before authentication activation, obtain authorization for the exact two existing-setting patches produced by `release-a-logging-privacy.mjs`: remove cs-uri-query/cs(Cookie)/cs(Referer) (33->30 fields, JSON/destination/suffix retained), and append a CloudFront-only deny on engentlabs-frontend/AWSLogs/* (GetObject/GetObjectVersion, exact distribution). One new non-sensitive probe object tests the deny; never retrieve an existing visitor log. Delete only the probe's recorded VersionId afterward. These are zero-new-resource prerequisites and remain on auth rollback. Existing JSON log consumers must tolerate the removed fields. No changes are made by this preparation.

## Revised sustained-public release proposal — November 19

Per Issue6 review7010413570, recommend public ON after successful attended30-minute canary, working alert delivery and named response ownership; otherwise rollback OFF. No production authorization has been granted. See the revised Tree final execution gate for the single complete approval scope, limitations and automatic rollback-supervisor prerequisites.

`monitoring.template.json` proposes a separate engent-release-a-prod-monitoring stack: exactly two metric-math Lambda Errors+Throttles alarms and one required owner-designated email subscription to the existing SNS topic. `topic-policy-append.json` is a preservation-only existing-topic policy statement scoped to CloudWatch, this account and those two alarm ARNs. No new role/topic/custom metric/scheduler. Total initial27 Adds (7+17+3), no replacements. Four standard alarm metrics cost about$0.40/month before allowances; SNS email costs$2/100000 deliveries plus request charges before allowances. Do not describe this as two billable metrics/$0.20.

Before leaving public ON: confirmed owner-authorized mailbox, actual test alarm-to-email delivery/acknowledgement, named operator with rollback access and explicit response coverage, passing real-domain acceptance and canary. Expected guard signup denials increment Errors; classify alerts and reject an unusably noisy response path. This is minimal invocation-failure monitoring, not continuous synthetic availability or a24x7 SLA. Never assume a recipient or response owner. Prepared local source only; no monitoring resources or policy changes made.
