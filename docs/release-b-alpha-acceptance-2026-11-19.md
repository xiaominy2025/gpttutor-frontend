# Release B Alpha authenticated acceptance — 2026-11-19

This report supersedes the pending authenticated-test status in the earlier execution report. It records owner-attended Alpha testing, not production authorization. Both implementation PRs remain draft.

## Sources and bounded execution

Frontend runtime: `5658560a879d1d032fba38330d3f913a2fd107a7`; source-only header amendment: `5a1740c611b4c37947d1ac94f9bbcbb6e45a88a6`. Tree runtime: `9e64a6889d041007ffd40e5738db3f9b07987224`. Existing immutable Lambda versions platform4/Tree15 and retained enabled web artifacts were reused. No runtime code, dependencies, new app versions, or web uploads were needed for this retry.

Owner approved the exact three-field Alpha response-header amendment and the existing 7 route/inline-policy plus 6 guard resources. Change sets were reviewed as Add-only. Fresh encrypted snapshots preceded each retry. The guard code hash matched the reviewed artifact; six negative guard cases passed in the earlier retry and were not rerun in the Student-only retry. The latter again verified the same code and designated canary digest before opening admission.

The earlier failure was edge transport configuration: forced no-referrer suppressed the trusted form Origin, and forced static CSP rejected backend nonce scripts. The approved Alpha-only change honors backend Referrer-Policy/CSP while retaining static fallback policies and existing Origin checks. No Administrator MFA or Student authentication policy was weakened.

## Live authenticated results

- Existing enabled Advanced account: one email code per isolated browser context; Explore→Tree handoff succeeded without another credential prompt. Advanced/approved status and matching membership subject remained unchanged. Refresh persisted the session. Actual directory launch button succeeded without another email.
- Explore header logout: next protected account AND project-list GET returned401 in two existing Tree tabs before refresh. An independent browser context stayed signed in with Advanced access. Separate Administrator MFA session remained authorized.
- Tree header logout: shared logout returned200 with participating-browser scope; Explore and Tree session endpoints then showed signed out. Refresh did not resurrect the prior native session.
- Administrator: owner manually completed existing MFA login; read-only settings200. Student logout preserved Administrator access. Administrator logout returned200 and settings then returned401. No Administrator user-management/settings mutations were allowed.
- First-time Student: owner-controlled disposable inbox was proved absent in Cognito, MEMBERS and legacy invitation records before creation. Guarded admission opened only for that designation, under a 15-minute automatic-close watchdog. Successful verification returned finish200, login200, authorize200 and callback303. Default Student membership and no Advanced entitlement verified on both applications; refresh persisted. Admission closed immediately afterwards.
- Student Advanced-access request: exactly one approved canary request returned pending; Student role and advanced=false remained unchanged. No approval or upgrade occurred.
- Returning Student: after coordinated logout, a new owner-entered email code signed the same account into Explore and Tree while new-account registration was closed. Pending request and Student permission remained. Final logout revoked both applications.

The first Student form was clicked while admission was still closed, returning the generic200 start response. The form was reset after opening the guarded window; the subsequent explicit request succeeded. Three Student-run starts and two finishes are recorded, not three successful emails. An earlier unattended window expired without creating any canary; its full rollback was separately verified before this attended retry.

## Browser protections and cleanup

Context-wide interception and service-worker blocking were installed before visiting Tree. Four project-write probes and six paid-AI probes were blocked in each run. Existing-account run blocked359 project-write attempts; Student run blocked15. Both forwarded ZERO project writes and ZERO paid-AI calls. These include intercepted autosave/recovery attempts; project-save/recovery behavior is not accepted by this test. No OTPs, credentials, cookie values or response bodies containing credentials were captured in published evidence.

All test sessions were verified signed out before rollback, and owned Chrome contexts were closed. Conditional canary cleanup verified the newly recorded canonical subject/creation time, exact Student member ownership, exact pending test request, and an empty project prefix including all object versions/delete markers. Only that disposable member/request and Cognito user were removed; existing Advanced identity/entitlement was checked unchanged afterwards. No project data was deleted.

## Required exact rollback — passed, no re-enable

- Original live aliases platform1/Tree11, exact original live and unqualified code/environments restored; shared=false and Release B flag absent.
- All mutable original Alpha Student pool fields restored; registration closed at Cognito, original LambdaConfig empty. Original application registration item enabled=true/revision5 restored only with the pool closed; that flag alone does not open signup. Separate Administrator MFA untouched.
- Full original CloudFront distribution config propagated, original LIVE viewer bytes restored, and every original response-header policy field verified. Public root and Explore HTML hashes equal original retained S3 objects.
- Original three API routes, exact original inline role policies and original boundary defaultv2/versionsv1-v3 restored. Only owned retry boundary versions removed. Both temporary stacks DELETE_COMPLETE.
- Original public health200, shared-OFF platform-session410, /admin200 and /admin/200 verified.

Alpha is intentionally back on Release A. Its older Explore sign-in placement is therefore expected and does not represent the successfully tested Release B header. No implicit reactivation follows the rehearsal. Production, DNS, homepage production assets and default branches were not changed. No PR was merged.

## Limits and next release gate

Live Alpha evidence covers the attended flows above, using one existing Advanced identity in independent contexts and a disposable identity for Student. Mobile/desktop visual and adversarial/expiry/conflict/response-loss cases retain their existing local-fixture evidence; they are not claimed as live Cognito tests. Existing email-OTP fallback has previous owner-confirmed acceptance; no extra fallback code was requested in these retries. The live canary request used the authenticated shared endpoint, not a separate UI-button acceptance. Tree shared-status does not expose requestStatus; the authoritative pending result is the platform session, while both verify advanced=false.

Production cross-subdomain header compatibility, exact production change-set/resource review and separately approved production validation remain required. This same-origin Alpha result does not authorize production or demonstrate production subdomain cookie/CSP behavior. No new architecture is proposed.

No new fixed-cost services or artifact uploads were introduced in these retries. On-demand Cognito/email, Lambda/API, DynamoDB, logs and invalidations incurred routine test usage; dollar spend has not been measured. No paid AI. The prior $1–3/month small-pilot estimate remains illustrative, not a verified bill or cap.

Evidence: `docs/evidence/release-b-alpha-acceptance/`. Existing unchanged local totals: frontend104 tests/24 files, Tree333 tests/57 files, and six local HTTPS edge-policy cases; not rerun for this evidence-only update.
