# Decision Process Production release - 2026-11-23

**Published:** https://www.engentlabs.com/process/ . Explore launch is active. Process AI is ON for eligible signed-in Students under the independent $10/calendar-month cap. Homepage/Explore, Tree and Process use the accepted Release B shared account/session architecture. Draft PR24 remains unmerged.

## Exact versions and sources

- Homepage/Explore and corrected platform BFF: source a2c206bb59932d5db612285f4c489b2bc0b28d0f; BFF live5, code SqwEtX2zwa9L/nwxKj+EV6Zhqc6Vjt6fejY0Lt92F00=.
- Process: source c3111feeb13a8a632b82509048e9583e61e81084; live3, code vNKvfwrBdxwSraLoKGnkYhtAVGyDZuYF7+Ad2s9LMdg=, AI/session readiness true. Existing JSON SecureString /decisionprocess-prod/openai-api-key; value never exposed or rotated.
- Tree: production5-lineage source2b70c76, live6. Original cloud-project schema, subject ownership and storage retained.
- Navigator live3, Forecasting live4 and its ee38cdf header remain unchanged. Anonymous access and their combined $10 calendar-month pool preserved. Tree spending controls unchanged.
- Master remains ON/suspendedfalse, revision1. Every observed Alpha alias matches its prior baseline, including Forecasting9; no Alpha/DNS/account/project writes.

Main CloudFront E1V533CXZPR3FL and bucket engentlabs-frontend retain the existing release origin prefix releases/engent-release-a/d6ca341656d1a246ca3c2d7d3ce44ca822876949. Root HTML VersionId4DoPmpqaHxI0qY1vEL9WMclEOBDfXLq3, ETag6ed4216c06ff70a6076949f149934f9e, SHA4ef4ac76aa02d766d5a5a10c16b8f8a17c9627607fc834f8295d8f1082dfb968. Final publication added2 immutable JS assets and1 conditional HTML; all39 media reused. Scoped invalidation I2UGQTGGKRNXKTTMJHOTFFGGWC completed.

Process transport remains the isolated IAM Function URL through existing production OAC E2X0K6ASCU6K3X and Process-only origin policy79127ff3-f6b1-4f7a-bb52-d7593ed28782, forwarding only __Host-engent-email. Private Student RPC on existing APIeoszayfkqd is AWS_IAM/exact caller bound. Existing decisionprocess-prod provisioning stack and engent-release-b-prod-routes are the resource owners; no new resources in final activation. Provisioning defaults are deliberately OFF; future code releases must use pinned release operations rather than blindly reapply defaults.

## Authentication and browser acceptance actually observed

Existing owner session was reused without a code: Explore/TreeAdvanced, ProcessStudent, refresh persistent. Normal OpenProject listed3 existing recovery copies; none opened/modified/deleted. Direct /api/projects without X-Workspace-User is denied by design; it was NOT treated as a session-revocation proof.

Observed actual WWW logout acknowledgement participating-browser, then RootsignedInfalse/ProcessGuest. The retained Tree API-only tab, with its old host cookie, changed from authenticated principal to Authentication required. Only after this intentional invalidation was one fresh owner-entered code needed for canary acceptance. Advanced membership/enabled/AI eligibility reconfirmed unchanged. Fresh actual Process Student verification, TreeAdvanced and refreshed public AI-enabled status passed.

Found and corrected a real cross-host return defect: BFF callback form-action allowed Tree but blocked the303 back to its own WWW origin, leaving Continuing sign-in despite successful authentication. Independent local Chrome fixtures reproduced originalfailure/fixedsuccess. One-line fix adds only 'self' beside exactTree origin, retaining nonce-only script, strict-origin, PKCE/CSRF/root verification and fixed return allowlists. Focused15 tests passed. BFF5 was source/code/config/CloudTrail/CAS verified. Actual hosted normal existing-session handoff now returns automatically to /process/ asStudent, with no new code and no paid request. The two separately approved CloudFront override flags and all fallback/HSTS/frame/nosniff settings remain verified unchanged.

Hosted checks passed1440/1024/768/390: active Process launch, Guest headers/navigation/direct refresh, anonymous Navigator dialog, Tree refresh, no page errors; all39 audio byte-range responses matched accepted recordings. Auth negatives passed forged UI/Guest401, unsigned privateRPC403 and old native auth410. All test-browser project writes/public paid requests blocked. Admin code/pools/MFA unchanged; a new attended Administrator MFA challenge was not repeated. New-user registration was neither changed nor exercised.

## Bounded normal-runtime canary

Exactly1 objectives request,0retries, synthetic library decision only. Genuine Student/root/AI permission, fresh pre-dispatch authorization, production JSON credential access, master and real namespaced DynamoDB metering all exercised through the accepted normal runtime.1254 input/216 output tokens;3 suggestions. Conservative charge **$0.00026475**, below$0.02 cap. Reservation$0.00511875 reconciled;1 metered receipt, requestcomplete,0retained holds, user/global concurrency0. No further paid smoke call was made after public activation. Full sanitized response/usage receipt is in process-release/paid-canary.json. This is model metering, not a claim that AWS infrastructure usage has already been invoiced. No new fixed-cost infrastructure in final publication.

## Rollback

Run from repository root:

    node scripts/rollback-process-publication.mjs --check
    node scripts/rollback-process-publication.mjs --execute

The read-only check PASSED against current owned alias/HTML and byte-exact priorB HTML. Execution conditionally restores Process live2(AI OFF) and the immediately preceding B directory(ComingSoon), then scoped invalidation. Keeps BFF5/Tree6/anonymous tools/authentication/master intact. Immutable assets retained. No user/project/usage table restoration, credential changes or refunds. Stop/reconcile pending writes or drift; no blind replay. Actual rollback was not performed on the healthy release.

## Remaining operational notes

The existing global CloudFront403-to-SPA mapping can mask a forbidden response as HTML200 without a CORS grant. Browser access remains denied; this was documented, not redesigned during publication. Existing fail-closed timeout/unknown-hold recovery remains operator reconciliation only; no blind ledger reset. Tests reused accepted Alpha/provider-free coverage rather than repeating paid timeout/failure tests.

Short-lived same-origin signout/return test assets were cleaned up by exact owned VersionId/ETag. No persistent diagnostic routes, stage logging or debugger attachment. The isolated acceptance browser still blocks project writes/public AI; use the public URL in a normal browser for ordinary use. Current receipts, original root bytes, screenshots and final state are in process-release/.
