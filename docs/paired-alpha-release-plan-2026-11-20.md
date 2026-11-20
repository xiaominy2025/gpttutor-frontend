# Release B paired Alpha approval package — 2026-11-20

PREPARATION ONLY. No AWS deployment writes, uploads, invalidations, alias/configuration changes, sessions, live emails, user/project operations or paid AI. Production, DNS, Cognito, IAM and authentication architecture remain unchanged. FrontendPR12 and TreePR16 remain draft/open/unmerged.

## Exact approved pair and artifacts

- Frontend release source0dc4258b95a28bc93373cc1a5f2ba61e7e262a0c, implementation8054cf166f324024a6c8b64792816bc8d30860b8. Their difference is documentation/evidence only. Built from a clean Git archive using the existing build-release-b.mjs alpha --enable-local-ui convention, isolated from working/rollback artifacts.
- Tree runtime4384f652f9624fe136b337bed680ada99c83ab72; preparation-only tooling7d262205f7f5424adb6598f4d7c9f920d22478bd. Tree owner prepared/verified the exact clean package and current baseline. I did not modify Tree application/preparation source.
- Shared Header1.1.0 blob5600dfdb00b30364fb1c2699a8f58af68f72c3f7 matches both sources; matching TS interface retained.
- Frozen paired manifest SHA256 **61c0f66ab9e641d0165bf79e0d5f0de95ed4d0cc8a523521419e29afdeb3c5f9**. Exact keys, candidate bytes/hashes, actions, current baseline VersionIds/ETags and invalidation paths are in docs/evidence/paired-alpha-20261120/paired-manifest.json and approval-write-set.json.
- Local paired ZIP SHA256 **020bb21b141d7ef36533da46ea763f24272753f523d9e53fbaed3bef38983d36**,63,472,277bytes: web-only subpackages, paired manifest and approval write set. No API ZIP, secrets, account data or private rollback snapshots.
- Platform web-only ZIP f77ba97801e962d71d62bf98c5491f2a1133bdc1121579bcde20d87d7497aefa (37 files); Tree web-only ZIP4bb362561d738c67739625dfa381e40fca4482ec0187e3b68e196e5ed41e4713 (6 physical files mapped to8 S3 objects; three HTML keys share one index body).

Paired ZIP and private rollback receipts are retained in:
C:\Users\xmkya\.codex\worktrees\tree-shared-auth\ai-decision-tree\.artifacts\paired-alpha-20261120

Tree owner's independent receipt directory:
.artifacts/tree-ux-4384f65-current17-readonly-20261120

## Actual current baseline / smallest release

Account771049112957, default profile, us-east-1; CloudFront E1C4AJI9FUE47B, https://d6owpirihdsus.cloudfront.net . Keep platform Lambda engent-platform-alpha-api:live→4 and Tree decisiontree-alpha-staging-api:live→17. Both B/shared flags are true; no Lambda code/config/version/alias operation is required.

Tree backend members downloaded from live17 ZIP match the candidate exactly. Platform backend/dependency source is unchanged since accepted platform4, but the separately archived rebuild is NOT byte-identical to the deployed bundle, even after normalizing archive dependency paths. Its byte difference is not fully diagnosed, so that rebuilt API artifact is explicitly excluded. Retain the accepted deployed4 bundle. Nothing in the frontend correction requires a backend replacement. The build receipt runtimeFlagDefault=false describes packaging defaults, not the actual live state or permission to flip flags.

Reuse the versioned bucket decisiontree-alpha-staging-frontend-vnhhrwadnpad and its established paths:

- Platform: releases/engent-release-b-alpha/platform/5658560a879d1d032fba38330d3f913a2fd107a7-enabled/
- Tree: releases/engent-release-b-alpha/tree/9e64a6889d041007ffd40e5738db3f9b07987224-enabled/

Those retained prefix labels are not claims of the candidate source; manifest hashes/source pins and new object VersionIds are authoritative. No CloudFront origin/viewer/header/API configuration change or new prefix routing is proposed.

## Exact future write scope — NOT executed

Three If-None-Match:* content-hashed assets,1,158,164bytes total:

- Platform assets/index-D-POU7Hs.js
- Tree assets/index-BojFpFxi.js
- Tree assets/Administrator-R0H6Hlas.js

Four conditional HTML PutObject promotions using the captured destination If-Match ETags:

- Tree index.html
- Tree admin
- Tree admin/ (this is an independent existing S3 object; NOT admin/index.html)
- Platform index.html

All full object keys and current versions are in the frozen write set. Reuse35 verified platform objects and3 Tree objects. Retain every existing asset/version; no deletion or destructive sync. On immutable collision, read/verify identical bytes before reuse; never overwrite conflicting content. Use existing reviewed Content-Type/cache metadata conventions and capture new VersionIds, ETags and SHA256 after each put.

One coordinated CloudFront CreateInvalidation request, exact union:
/, /index.html, /admin, /admin/, /engent-alpha*, /explore*

No other AWS writes: zero Lambda/CloudFormation/IAM/Cognito/DNS/SSM/Secrets Manager/database writes or bucket/policy/distribution changes. Seven prospective S3 writes plus one invalidation request only. No new AWS service/resource or fixed monthly charge. Routine PUT/GET, versioned storage, transfer and possible invalidation usage remain; actual dollar usage is unmeasured. The62MB platform transport ZIP includes already-published media that will be reused, not re-uploaded. No paid AI or Navigator.

## Read-only preflight and rollback readiness

PASS: caller/account/region, unweighted accepted backend versions and flags; CF Deployed/current prefixes; versioning; unchanged closed Student self-signup, admission=false/revision6, empty guard configuration; separate Admin pool MFA ON; existing strict-origin/CSP override policy; five internal email routes still AWS_IAM. Full sensitive configurations saved DPAPI-encrypted locally, not published.

Platform: captured37 current object versions/bytes/ETags; real GetObjectVersion of original index matched; eight public Home/Explore/six-case routes200 matched original index bytes. Candidate37 hashes verified,35 reused/1 new asset/1 HTML promotion. Existing operator IAM simulations allowed the exact7 pair PutObject keys and CreateInvalidation without new grants. Simulation is not a guarantee of future service/SCP/bucket-policy or concurrent-write success.

Tree owner:23 focused preparation tests passed; fresh prepare/check/rollback-check passed, awsWrites0. Current17 and LATEST ZIPs, encrypted configurations and8 current Tree frontend files captured; four public Tree/Admin entrypoints match acceptedce9. Runtime17/backend flags/settings preserved. Details: PR16 comment7048527429 and Issue11 comment7048537441. Older ce9 deployment wrapper hardcodes baseline15 and MUST NOT be used for this paired release or its rollback. New read-only preflight has no execution mode.

Private A/older rollback artifacts remain retained but are NOT this release's immediate rollback target. Do not restore Lambda15, Release A or old admission flags.

## Coordinated execution after explicit approval

1. Freeze both source/artifact pins and paired manifest; no concurrent Alpha publisher. Tree owner owns Tree assets/three HTML objects; Homepage/Release B owner owns platform asset/index and the ONE union invalidation. Both owners use one paired publication journal. Reconfirm protected hashes, live4/17, all object VersionIds/ETags and candidate hashes immediately before any write. If preparation has aged, repeat read-only checks; on drift STOP rather than adopting a new baseline silently.
2. Before executing, bind/review the conditional write and rollback commands to the frozen manifest/journal and locally test key allowlists, CAS failures, partial completion, lost responses and rollback ownership. Existing preparation commands are read-only, not deployment commands; there is deliberately no deploy instruction to run under this authorization.
3. Stage both applications' hashed assets, verifying returned object version and bytes. Do not promote either app until ALL referenced assets are available. Record release-id/hash metadata and write ownership; never expand IAM automatically.
4. Tree owner conditionally promotes index.html, admin and admin/; coordinator then conditionally promotes platform index.html. Verify every new S3 version/body against manifest. Capture success/unknown outcomes explicitly; do not retry an unknown overwrite blindly.
5. Coordinator submits one six-path union invalidation and waits for completion; verify served hashes on Home/Explore/all six cases and Tree /,/index.html,/admin,/admin/. Confirm header1.1.0 and4/17 flags/configuration unchanged. Run Guest checks before any attended sign-in.
6. Run the approved protected authentication acceptance below. A failed entrypoint/security/session/work-retention gate stops acceptance and invokes only the bounded owned-HTML recovery. No production publication follows automatically. Leave successful paired Alpha enabled only under the final approval.

This is coordinated, not atomic: four HTML updates and invalidation have a short mixed-client/cache window. Both old/new UIs use the same accepted authentication protocol. Old loaded tabs can retain old UI; never force-refresh an unsaved workspace. Use fresh isolated acceptance contexts and preserve/export work before any requested reload.

## Rollback boundaries

Rollback restores the working Release B Alpha frontend bytes captured with platform4/Tree17, not an older architecture. No backend/source configuration is switched and no tokens/root sessions are restored or globally revoked by deployment rollback.

- Journal only successful receipt-owned HTML writes and their new ETags/VersionIds. Restore changed HTML in reverse promotion order using local verified baseline bytes, original metadata and If-Match of the owned current candidate ETag, creating a new S3 version. Source copies may also be retrieved by exact captured VersionId; never rely on CopySourceIfMatch as a destination CAS.
- If a destination's current version/body is unrelated or a write outcome is unknown, stop and reconcile read-only before overwriting. Revert only entries actually changed; leave untouched entries alone. Tree owner restores its three keys, coordinator its one key.
- Retain staged/new hashed assets and all original versions. Reissue the same union invalidation, wait and verify baseline public hashes and working Guest/health/Admin entrypoints. Recheck live4/17, B/shared flags and protected fingerprints. Do not change project data, open local JSON files, Cognito/IAM/DNS, signup policies, authentication sessions or production.
- Previous exact infrastructure rollback rehearsal is historical evidence; no new write/rollback rehearsal was performed in this preparation. Current rollback checks proved bytes, versions and configurations readable/unchanged, not that a future mutation cannot fail.

## Acceptance tests proposed for final approval

Local completed: frontend125/25 tests and exact archive build PASS; Tree330 unit/23 account+project browser regressions from the approved UX implementation, plus23 preparation tests PASS. Four paired built-bundle UI flows PASS (Student/Advanced × desktop/mobile): Home→Explore→Guest Tree, automatic/idempotent Guest, one synthetic code and Tree return intent, page-local logout→Guest. Assets and auth responses were fixtures; successful handoff was mocked, NOT live Cognito/nonce/HTTP303 acceptance. No real email or API/project/paid-AI call was performed. An initial broad test discovery also found the archive's duplicate tests; archive was moved outside the project and the actual125/25 regression reran successfully. No production runtime changes resulted.

After release, in isolated protected browsers, block ALL project mutations, paid-AI/voice, automatic recovery-sync and unapproved account/Admin changes before Tree opens. Use synthetic local JSON fixtures, not existing owner project files; keep profile data isolated. Owner enters newest verification code directly; do not capture codes/tokens/cookies.

1. Guest: Home/Explore/cases navigation; direct launch and refresh of Tree; Guest twice does not reset edits/tabs, no second prompt; menu toggle/outside/Escape/focus; email form immediate and no automatic email request.
2. Existing Student and Advanced separately: one-code Tree-origin sign-in returns automatically to Tree; Home→Home, Explore→Explore, cases→same case; correct coach-specific role, no upgrade, refresh persistence and no second code on coach launch. Preserve account/role/project data.
3. Sign-out from Tree stays on Tree/Guest, from source stays on its source path; errors do not falsely claim completed logout. Next protected API request in other participating tabs is denied before refresh; unrelated browser session and Administrator access remain separate. No old native-cookie resurrection.
4. Synthetic local JSON open/save, multiple in-memory tabs, optional browser recovery and Save/Discard/Cancel on genuinely unsaved work. Guest re-selection is a no-op. Save failure/Cancel must not revoke voluntary sign-out; confirmed external revocation ends protected access even if local recovery fails, without exposing previous-owner work to Guest.
5. Read-only health/static Admin checks and baseline MFA/configuration preserved. No new registration/canary, entitlement approval, existing-project cloud write, paid AI or production call.

Required live-test setup: designate existing enabled Student and Advanced accounts at approval. Do not assume the previously deleted disposable Student still exists, create another user, downgrade an Advanced user, or reopen registration. Fresh live authentication/coordinated-revocation results are pending; local fixture success is not live acceptance.

## Approval requested / stop point

Approve only this exact paired Alpha web release (three asset puts, four CAS HTML puts, one six-path invalidation), bounded owned-HTML recovery and protected attended acceptance with designated existing accounts. Routine execution remains subject to reviewed command/journal checks above; stop for new costs, broadened permissions, protected drift or security/data risk. No production, DNS, identity-policy, merge or project mutation authorization is requested or implied. No deployment writes have been performed.
