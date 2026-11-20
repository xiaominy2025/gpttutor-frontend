# Release B persistent Alpha — 2026-11-19

Owner authorization: Issue11 comment7026789533 supersedes the prior rollback-only stop state. Release B is now the persistent Alpha baseline, left ON after checks. No second rollback rehearsal, live email/OTP/MFA attempt, account creation/change, project operation or paid AI was performed in this deployment. PR12 and Tree16 remain draft/unmerged. Production and DNS untouched.

## Published baseline

- Alpha Explore: https://d6owpirihdsus.cloudfront.net/explore
- Alpha Home: https://d6owpirihdsus.cloudfront.net/engent-alpha/
- Alpha Tree: https://d6owpirihdsus.cloudfront.net/
- Alpha cases: /explore/{process,forecast,scenario,tree,simulation,optimization}/cases
- Alpha Admin: /admin and /admin/
- Account771049112957, regionus-east-1; CloudFront E1C4AJI9FUE47B.
- Frontend runtime5658560a879d1d032fba38330d3f913a2fd107a7; Tree9e64a6889d041007ffd40e5738db3f9b07987224. Documentation commits do not replace these pins.
- engent-platform-alpha-api:live→4; decisiontree-alpha-staging-api:live→15. Both SHARED_AUTH_ENABLED=true and RELEASE_B_EMAIL_ENABLED=true, confirmed again AFTER smoke checks. Existing immutable versions and assets reused; no runtime edits, new versions, artifact uploads or new credentials.
- Existing S3 frontend origins now use /releases/engent-release-b-alpha/platform/5658560a879d1d032fba38330d3f913a2fd107a7-enabled and /releases/engent-release-b-alpha/tree/9e64a6889d041007ffd40e5738db3f9b07987224-enabled. Existing Alpha viewer function updated to the reviewed source. Full distribution config matched the expected candidate and Deployed status.

## Exact AWS changes and registration protections

Stack engent-release-b-alpha-routes contains exactly seven additions: five AWS_IAM POST routes under /internal/platform/email/{start,finish,session,handoff,advanced-request}, plus the two reviewed inline policies. Original three API routes unchanged; eight routes total. Target API8qmgd1ghdi/integration1xwneaq. Complete route and IAM documents remain in infra/release-b/alpha-routes.template.json; no broader grant was installed.

Inline release-b-email-bffinvoke on engent-platform-alpha-runtime grants only the five reviewed Alpha execute-api POST ARNs. Inline release-b-email-treeleasecheck on decisiontree-alpha-staging-ApiRole-tmQtkTYts533 grants the approved constrained DynamoDB checks/deletes. Existing decisiontree-alpha-staging-runtime-boundary is now v7, exactly originalv2 plus the reviewed statements from infra/release-b/alpha-boundary-append.json. Originalv2 retained. Both inline documents verified exact;20 effective IAM simulations passed including wrong method/stage/API/keys and production denials.

Existing Alpha-only response-header policy b5d73939-4c3d-4a75-aca8-45d6bb7b1f7e: exactly three changes, ReferrerPolicy strict-origin; ReferrerPolicy.Override=false; ContentSecurityPolicy.Override=false. Every other effective field matches the original snapshot. Policy association was verified exclusive to Alpha. Backend restrictive CSP and no-referrer were observed through CloudFront on the denied authorization endpoint; static documents use strict-origin. Prior attended nonce handoff acceptance is reused; no new successful handoff transaction was initiated for this smoke.

Cognito pool us-east-1_CipTwwDZb remains AdminCreateUserOnly=true, LambdaConfig empty and ALL pool settings unchanged. No registration guard function, role, boundary, alias, version or invocation permission was created/retained. Application REGISTRATION#CONFIG is now enabled=false/revision6 (conditional transition from original true/revision5). Unknown accounts are denied before Cognito/signup/email; existing enabled member/legacy accounts can initiate USER_AUTH independently of the flag. Missing new membership cannot provision while closed; existing legacy reconciliation remains established behavior. Source review and3/3 hostedAws local tests verify these branches; earlier returning-Student live acceptance already passed with both admissions closed. No new live attempt was made here.

Seven added resources only; zero new pools/tables/domains/distributions/buckets/auth services. No temporary enrollment resources. No additional monthly fixed-price service introduced. On-demand Lambda/API/DynamoDB/Cognito/SES/log/invalidation usage and existing retained storage continue; actual incremental spend is not measured. Prior $1–3/month pilot estimate is illustrative, not a billing result or cap. No Navigator or paid-AI usage.

## Verification and evidence

Fresh DPAPI-encrypted inventory and original A configuration/code snapshots preceded all changes. Stop-on-drift checks found only expected pool LastModifiedDate from the prior rollback and Windows CRLF template encoding. All pool settings and approved normalized template SHA/Git object matched. No material drift or new permission/cost requirement was encountered.

43 published web files matched retained release hashes. Deployment-guide Markdown intentionally remains unpublished. Seven-resource Add-only change set reviewed before execution. Five unsigned internal-route requests returned403 at API Gateway; no provider/email payloads were submitted.

Read-only Chrome checks passed at1365×900 and390×844: Home/Explore/cases/Tree200, visible Guest universal header, no horizontal overflow. Source/Tree Guest status200 signedIn=false; protected account/projects/Admin settings401; health200. /admin, /admin/ and all six case pages200. Backend authorization error CSP/referrer remained effective through CloudFront. Actual header Explore Coaches → Explore and coach-specific Explore Cases → case-page clicks also passed with Guest preserved. No write request, preauth bootstrap, email, project write or paid-AI request was forwarded. Initial Tree wait-for-network-idle timed out because it polls; rendered-header readiness completed successfully without changing app code.

Prior owner-attended Advanced/Student/MFA/coordinated-logout acceptance is in release-b-alpha-acceptance-2026-11-19.md. This deployment does not repeat it or claim new authenticated acceptance. Desktop/mobile screenshots and sanitized receipts: docs/evidence/release-b-persistent-alpha/.

## Recovery command plan — retained, NOT executed

Original A artifacts and versions remain immutable. Fresh encrypted snapshots and prepared recovery scripts are retained locally in:
C:\Users\xmkya\.codex\worktrees\tree-shared-auth\ai-decision-tree\.artifacts\release-b-persistent-20261119

Scripts were syntax checked, not executed. They adapt the previously proven exact restore to this seven-resource/no-guard state. Run from the Tree checkout only if recovery is needed within approved incident scope:

1. Quiesce sign-in and establish fresh, complete participating-session revocation evidence; preserve unrelated native/Admin accounts. Supply all-revoked.json with actual allRevoked=true/adminLoggedOut=true/checkedAt within5minutes. Do not fabricate evidence or use stale prior-test receipts. If active sessions cannot be safely enumerated/revoked, stop and assess rather than silently reactivate stale A sessions.
2. pwsh -NoProfile -File .artifacts/release-b-persistent-20261119/start-rollback.ps1
   This verifies the full current owned CloudFront candidate with fresh ETag, restores original aliases1/11, confirms closed/no-guard pool without modifying Cognito, conditionally restores original registration image, restores full original edge config/viewer, reverts boundary tov2, and deletes only the owned seven-resource route stack. Stop on drift. It neither deletes users/projects nor global-signs-out existing identities.
3. pwsh -NoProfile -File .artifacts/release-b-persistent-20261119/finish-rollback.ps1
   Remove only recorded owned boundaryv7, restore original response-header policy with current ETag, invalidate Alpha/*.
4. Wait for CloudFront Deployed and the owned stack DELETE_COMPLETE, then:
   pwsh -NoProfile -File .artifacts/release-b-persistent-20261119/verify-rollback.ps1
   Recheck original public S3 hashes, Guest/Admin entrypoints and complete original response-header settings. Preserve retained S3 objects, versions, logs and all original policies. Do not create/delete the old registration guard.

This recovery plan does not itself authorize broad session/data operations. Prior exact Alpha restore was successfully rehearsed and recorded before this persistent instruction; do NOT execute another rehearsal or implicitly roll back this persistent baseline.

## Future production gate

See release-b-production-validation-plan.md. No production authorization is inferred from Alpha. Alpha remains enabled for development/testing while this separate plan is reviewed.
