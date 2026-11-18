# Release A production preparation — not a deployment authorization

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

Offline edge diff: `node scripts/release-a-production-cloudfront.mjs SAVED_SITE_CONFIG FULL_PLATFORM_COMMIT preview LOCAL_OUTPUT`. Repeat with `publish` from the original baseline for the final proposal. JSON contains the expected baseline ETag and proposed `config`; it is not a command to apply it. Fresh ETag/current-state comparison and explicit release authorization are mandatory before AWS changes. Full-document preview entry is required while the old homepage bundle is still active. Final publication switches the default origin to the same verified release and canonicalizes apex to www. Existing `/test/*` stays unchanged.

Upload, when separately authorized, only to `engentlabs-frontend/releases/engent-release-a/FULL_PLATFORM_COMMIT/`, retaining the S3 OAC and all previous objects. The `/engent-release-a/*` viewer-request mapping strips that virtual prefix inside the versioned origin. `/explore` and descendants serve that release's index; React handles the actual path. Root public assets/podcasts exist in the same built release. No DNS change is needed.

## Single review package and gates

Authoritative companion runbook is in Tree PR #14: `docs/release-a-guard-validation-and-production-package.md` (and the earlier `release-a-preserve-registration.md`). It contains exact Alpha canary lifecycle, production inventory/environment diff, preserve-registration ordering, costs and rollback. Production guard and separate Alpha-only canary guard templates are in Tree `infra/security/`.

Current decision: NO-GO for live changes. No new account, config write, change set, merge or deployment has occurred. Required next gates are the bounded Alpha service test/authorization, refreshed complete before/after configuration review, no-replacement change sets, exact clean artifact review, monitored production cross-domain acceptance and safe rollback. Existing SNS topic has no subscribers; do not claim alert delivery works. Runtime IAM policies are complete in the templates; no new operator/admin role is proposed or authorized.

Rollback: disable UI/BFF, restore Tree alias and both saved distribution/index versions, verify original OTP/registration/admin/media. Keep the guard attached while public clients exist; if guard removal is necessary, remove only the new public clients first and verify absence. Never close original registration or delete existing users/projects. Keep PRs #7 and #14 draft.

Local verification on 2026-11-18: 29 platform tests / 12 files passed, including auth-only behavior, exact origins, identity matching, narrow policies and offline edge mapping; SAM ValidateTemplate passed. An existing deferred-budget test fixture was pinned to UTC noon so its simulated 20-minute run does not accidentally cross midnight; no Navigator runtime code changed. These are local/syntax checks, not live Cognito or CloudFront acceptance.
