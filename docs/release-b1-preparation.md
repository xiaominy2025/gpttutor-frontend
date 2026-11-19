# Release B1 preparation - Issue 9

Source preparation only. No deployment, AWS changes, user changes, merges or paid AI calls are authorized by this package. Direction: https://github.com/xiaominy2025/gpttutor-frontend/issues/6#issuecomment-7017222329 . Follow-up: https://github.com/xiaominy2025/gpttutor-frontend/issues/9 .

## Scope and source

Both repositories use codex/issue-9-b1-account-ux, stacked on codex/issue-6-shared-auth. Frontend baseline 93d3d6bb4447fdea16847bbea502821fb9f70359; Tree baseline 65e8987dd3e22f62768f6c74b76ebbf671623f8c. Final source pins are recorded in the draft PRs and Issue 9 after commit. Release A source and rollback artifacts are retained.

Explore gains Sign in / Create account / Continue as Guest. Registration deliberately uses existing Tree email verification with a fixed Return to Explore link, possibly requiring another sign-in. This is temporary compatibility, not first-party registration. Managed-login signup remains unsupported and is explained before navigation; no provider UI injection or guard weakening. A signed-in Tree user gets a return link rather than another enrollment prompt. Homepage and other coaches are unchanged.

Explore displays Tree-specific Advanced status and submits a reason (up to 500 characters) through its BFF. Identity comes only from the server session and verified platform-audience token. Tree validates the IAM caller, existing enabled Student membership and sub, then uses the existing revision-conditional request operation. No provisioning in the mutation route. Pending submissions are idempotent; new attempts are limited to three per hour per subject. Admin approval/MFA and Tree request fallback are unchanged. Advanced is never a global platform role or automatically granted by submission. User reasons are data, rendered as React text.

Label is Sign out of Explore, with disclosure that coach sessions can remain. B2 all-app/all-device logout, unified enrollment, Navigator and other coaches are deferred.

## Proposed exact AWS delta (not applied)

Account 771049112957, us-east-1. The review-only JSON files in infra/release-b1 are append specifications, NOT deployable templates and NOT replacements for existing policies.

Alpha: add one AWS_IAM route POST /internal/platform/advanced-request to API 8qmgd1ghdi, existing integration 1xwneaq. Append its exact execute-api:Invoke ARN to engent-platform-alpha-runtime. Existing template has no boundary; attached deployed boundary must be read and verified before a final executable change set. If present, append the identical grant there. Reuse engent-platform-alpha-api and decisiontree-alpha-staging-api, Student pool us-east-1_CipTwwDZb and table decisiontree-alpha-staging-Data-JH4B4OFXWER5. Explore and Tree remain on https://d6owpirihdsus.cloudfront.net ; Explore path /explore. Assets retain /engent-alpha/.

Production: add one AWS_IAM route to API eoszayfkqd, existing integration 9gaznns, in engent-release-a-prod. Append exact ARN to existing engent-platform-prod-runtime inline policy release-a-auth-only AND engent-platform-prod-runtime-boundary. Preserve every existing grant. Reuse engent-platform-prod-api and decisiontree-prod-api and their live aliases, Student pool us-east-1_Ilf34btQ0, table decisiontree-prod-data, www.engentlabs.com/explore and decisiontree.engentlabs.com. Tree runtime IAM already permits the membership transaction and AUTH_LIMIT updates; no new Tree IAM grant proposed.

No new role, Lambda function, table, Cognito client/pool/domain, DNS, certificate, distribution, CORS behavior, AI secret or monitoring resource. Publish immutable versions of the two existing Lambdas only after approval. RELEASE_B1_ENABLED must be true on both approved new versions, never defaulted true in source. SHARED_AUTH_ENABLED remains an independent gate. Existing runtime settings, secrets and role assignments must be preserved. VITE_RELEASE_B1_ENABLED is set only by the separate local B1 builders.

Frontend output uses a new immutable private release prefix in existing storage, preserving existing /engent-release-a/ production and /engent-alpha/ Alpha public asset mappings and viewer functions. Repoint only the relevant existing origin path; preserve the full distribution configuration. No destructive sync. Reuse the existing deployment operator; no new deployer permissions requested. Existing change-set guard does NOT authorize B1 automatically: prepare a separate property-level reviewed change set permitting only this new route, exact policy append, immutable code/version/flag updates. Reject unrelated changes, replacement and deletion.

## Cost estimate

Incremental fixed monthly resources: $0 proposed. No paid AI calls are introduced. Budgetary pilot allowance: under $1/month incremental for 1,000 request submissions, modest session refresh traffic and small log records, excluding existing baseline costs, unusual traffic, email delivery and taxes. This is an estimate, not a cap; Lambda duration, DynamoDB item sizes and logs remain usage dependent. At first-tier HTTP API pricing two extra API hops per submission cost approximately $0.002/1,000 submissions; two Lambda request charges approximately $0.0004, before duration/storage/logs. Reuse existing throttles and monitoring. Recheck pricing and baseline utilization before deployment. Sources: https://aws.amazon.com/api-gateway/pricing/ , https://aws.amazon.com/lambda/pricing/ , https://aws.amazon.com/dynamodb/pricing/ .

## Local verification and builds

Frontend suite: 97 tests across 22 files passed before adding the Alpha configuration test; the additional targeted configuration test is recorded in Issue 9. Tree: all 300 tests across 53 files pass with local loopback allowed; npx tsc --noEmit passes. Restricted-sandbox run failed local fetches with EACCES; the permitted local run passes. Tests cover strict reason payload, origin, verified identity, disabled/Advanced/missing users, pending idempotence, conditional conflict, bounded rate errors, no raw provider errors, fixed return URLs, feature-off compatibility and UI request semantics.

Local-only commands: node scripts/build-release-b1.mjs alpha and prod in frontend; node scripts/hosted/build-b1.mjs in Tree after a clean commit. Builders write separate ignored .artifacts/release-b1* paths, retaining A artifacts. Receipts include source pins and hashes. Frontend module guard excludes Navigator and paid AI capabilities. Both frontend variants and Tree build passed during preparation. No live B1 acceptance or visual-browser acceptance is claimed.

## Alpha acceptance gate

After specific infrastructure/test authorization: capture current templates, IAM policy versions, aliases, distribution ETags/configs and feature flags. Alpha begins with shared auth disabled (BFF live1, Tree live11); verify fresh values rather than assuming these remain current. Review/apply the exact route/policy delta and immutable builds with flags off. Smoke no-auth/feature-off denial, then enable only in isolated Alpha. Verify Guest, Student, Advanced, return links, refresh, CSRF, invalid issuer/audience, IAM denial, limits and local logout. Keep project-write and paid-AI browser blocking active. Verify original Tree OTP and Admin MFA remain functional without changing policies.

A real Student access-request submission changes a membership record; use only an expressly designated test Student/canary with approved bounded membership changes and cleanup. Do not downgrade the existing Advanced user. New registration likewise requires explicit bounded account authorization and existing guard constraints; do not reopen signup. Current mocked tests do not attest live email/registration. Do not request additional OTP attempts without a diagnostic need. No project edits/recovery writes or paid AI testing required.

## Production gate and rollback

Require Alpha evidence plus explicit B1 production approval. Re-read production drift, confirm source pins/hashes and reviewed change set. Deploy compatible Tree backend first (new route gated), then BFF, then frontend; enable only after negative and authenticated checks. Preserve Alpha-to-production behavior, changing environment literals only. Watch existing logs/alarms; redact tokens, codes, cookies, emails and reasons from evidence.

Rollback is source-reviewed but NOT live B1 tested. Disable B1 mutation capability, restore prior immutable frontend prefix and full distribution configuration, restore both pre-B1 alias versions and flags, then remove only B1 route/policy append via reviewed change set. Retain original A route, IAM permissions, user registration, Admin MFA and sessions. Never revert user membership/project data: existing pending requests remain valid in Tree. Restore Alpha to its captured auth-off state. Verify original OTP, projects read-only, Admin access, Explore and podcasts. Keep A private rollback artifacts and prior Lambda versions until acceptance.

Remaining gates: deployed Alpha boundary/drift inventory, executable narrowly reviewed change set, approved canary write scope, browser/mobile B1 review, live Alpha acceptance, then separate production approval. No claim of production readiness until those pass.
