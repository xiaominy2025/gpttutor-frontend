# Release B Alpha execution — 2026-11-19

Outcome: **authentication acceptance blocked; approved failure rollback completed and verified.** Production Release A was not changed. No merge or production/DNS deployment occurred.

Authority: Issue11 owner approval7023638164. Runtime artifacts remain frontend5658560a879d1d032fba38330d3f913a2fd107a7 and Tree9e64a6889d041007ffd40e5738db3f9b07987224. This follow-up adds only proposal/tests/evidence; no runtime source or asset changes.

## What passed

- Fresh account771049112957/us-east-1 inventory and DPAPI-encrypted local rollback snapshots. Existing operator privileges used, no new grant/role for the operator. CLI default region was us-east-2, so every action explicitly pinned us-east-1.
- Exact seven-resource route/policy and six-resource temporary guard change sets reviewed as Add-only before execution. No unexpected replacement. Full immutable ZIP/S3 version receipts retained locally.
- All20 effective deployed IAM allow/deny simulations passed. Each unsigned internal route rejected403. With B enabled, signed operator requests also rejected403 because the caller is not the BFF role. Real designated sign-in subsequently exercised successful BFF start/finish/session and pending-root cancellation; successful handoff and Advanced-request positive cases remain pending.
- Guard code hash and pool-scoped invocation policy verified; six direct-Lambda synthetic negative events rejected while both admission controls were closed. These tests did not invoke Cognito signup. Guard attached before any possible reopening, preserving every other mutable pool field. Self-signup was NEVER opened.
- OFF candidates platform3/Tree14 and ON candidates platform4/Tree15 published from exact same API ZIP bytes, independently tested, then served through existing Alpha aliases/origins. Zero destructive S3 sync; prior releases retained. Existing viewer function tested before publication. Existing immutable-index caching and required admin HTML alias objects were resolved using established deployment conventions.
- Public enabled Home, Explore, simulation cases, Tree, /admin and /admin/ passed12 desktop/mobile direct-refresh, HTML-hash and horizontal-overflow checks. Podcast played/paused. These are Guest checks, not authenticated/MFA acceptance. Full-page screenshot capture has a nested-scroll limitation; JSON results record actual assertions, not a claim of full visual acceptance.

## Attended authentication result

Owner designated the existing Advanced inbox and a separate unused canary, and approved bounded first-time testing/conditional cleanup. Read-only checks found the existing account confirmed/enabled Advanced with matching subject, and no canary Cognito/member/legacy invite. Existing Advanced was not downgraded to manufacture a Student case.

Before the application opened, a fresh isolated Chrome context blocked project POST/PUT/PATCH/DELETE, paid-AI paths and non-Alpha hosts, with service workers disabled. Four project-method and six AI-path probes were intercepted. One real email request and one real code submission occurred; no code was captured, stored, logged or published. The resulting PENDING lease proves code/token verification succeeded. A pending credential is not protected app access.

The handoff failed before activation. No second code was requested. The pending root was revoked through the real BFF:200/pending-signin-cancelled. Both participating status APIs then confirmed signed-out. The protected context closed. Zero project-write or paid-AI requests were forwarded. Existing account still confirmed/enabled Advanced with matching subject after rollback. Canary was never created; no canary cleanup or membership mutation was needed.

## Confirmed root cause

Existing Alpha-only CloudFront response policy b5d73939-4c3d-4a75-aca8-45d6bb7b1f7e, decisiontree-alpha-staging-security, forces:

- Referrer-Policy:no-referrer, Override=true.
- A static CSP with script-src 'self' and form-action 'self', Override=true.

Cookie-free real-browser reproduction from /explore generated Origin:null on POST /api/shared/email/login and received403. The same endpoint given the explicit allowed Origin returned200. Its nonce-bound, strict-origin transport headers were overwritten by the edge, which would also block the inline continuation script. This is a post-verification edge/header failure, not MFA or an invalid email code. Origin:null must remain rejected.

Only distribution E1C4AJI9FUE47B references this policy. No policy was changed during this execution. Its amendment is outside the reviewed origin/viewer-only security scope, so the stop condition was followed.

## Exact resource/configuration record

Created and then deleted by owned-stack rollback:

- engent-release-b-alpha-routes: EmailStartRoute1iu3s40, EmailFinishRoutecal8b98, EmailSessionRoutefo2ow9t, EmailHandoffRoutecpzjjet, EmailAdvancedRequestRoutedwloken; all POST AWS_IAM on API8qmgd1ghdi/integration1xwneaq. Existing BFF inline policy release-b-email-bffinvoke and Tree inline policy release-b-email-treeleasecheck.
- engent-release-b-alpha-registration: GuardBoundary engent-release-a-alpha-registration-boundary, GuardRole engent-release-a-alpha-registration-runtime, Guard engent-release-a-alpha-registration, GuardVersion (live2), GuardAlias live, CognitoInvocation. Existing14-day log group reused and retained.
- Tree boundary defaultv4 created by exact append, later reverted tov2 and only ownedv4 deleted. Originalv1/v2/v3 retained.

Retained for future reviewed retry: immutable Lambda versions3/4 and14/15, immutable S3 web/API/guard artifacts, receipts and existing guard log streams. No S3 object or existing data deletion. Existing artifact/frontend buckets only. No new fixed-cost service, pool/table/domain/distribution.

API ZIP SHA256: platform0b59ed780d63ec87dd2809f6ddec9fd31d2aeb7fc5490dedd72a92fc7444c110; Tree3139e2ea86d75f5278ec5022203c56e0956a76d1a30c924def7d71e9f0b57d5b; guard e9894ca73bb7c26dd0175d4886bb79ad5d256ec122e4ca27fcc16aca401780ca. Versioned S3 receipts remain local. Runtime deployment-guide Markdown was omitted from publication by the existing metadata allowlist.

## Rollback verification

Evidence JSON in docs/evidence/release-b-alpha:

- Live aliases restored platform1/Tree11, shared=false and B absent, exact original live code/environment. Unqualified code/environment also restored to original snapshots, preserving existing diagnostic version13 state.
- All mutable Student pool settings equal original; AdminCreateUserOnly=true, LambdaConfig={}, original Student MFA OFF. Separate Administrator MFA was never changed.
- Registration record restored byte-semantically to enabled=true/revision5, AFTER closed-pool verification and guard detach. Self-signup remains closed; the original true application flag alone does not open Cognito signup.
- Entire original distribution configuration and original LIVE viewer bytes restored and propagated; original response policy unchanged.
- Original three API routes, exact original inline role policies and boundary versions/default restored. Both owned stacks DELETE_COMPLETE.
- Public / and /explore hashes match retained ORIGINAL S3 artifacts. /api/health200; /api/platform/session410 as original shared-OFF baseline; /admin and /admin/200.
- Drift checks stopped on a changed distribution ETag during rollback. Full semantic comparison proved it resulted from our own viewer publication with only owned origin deltas; rollback resumed using the fresh ETag. No unrelated configuration was overwritten.

This was a real failure rollback, not successful SSO acceptance. Full coordinated active-session multitab logout, unrelated-device live preservation, first-time/returning Student, Advanced request, independent live Admin MFA and authenticated fallback remain uncompleted. Original fallback code/configuration and public entrypoints are restored; no further credential attempts were made.

## Concrete bounded amendment for review — NOT applied

See infra/release-b/alpha-header-policy-amendment.json. Change ONLY three existing Alpha-policy fields:

1. ReferrerPolicy.ReferrerPolicy: no-referrer -> strict-origin (origin only, no URL path/query).
2. ReferrerPolicy.Override: true -> false (honor the backend's deliberate transport policy).
3. ContentSecurityPolicy.Override: true -> false (honor backend nonce/target restrictions).

Static fallback CSP text, HSTS, HTTPS, frame/nosniff headers, cache/CORS/cookie/method settings, all Origin checks and MFA remain. Origin headers may come only from trusted application responses. No null-Origin allowance, wildcard destination, token URL or new authentication system. No runtime code changes or new AWS resources. Required additional operator action is cloudfront:UpdateResponseHeadersPolicy on this exact policy; do not install/broaden IAM automatically.

Local same-origin Alpha HTTPS tests isolate original403, referrer-only CSP failure, and complete amendment success for desktop/mobile (six cases). Proposed cases complete one synthetic-code handoff and coordinated logout using both real adapters. Production cross-origin edge-policy compatibility is a SEPARATE future gate; Alpha's same-origin static form-action policy is not claimed suitable for production subdomains.

Costs: no fixed-charge infrastructure added; only actual on-demand Lambda/API/DynamoDB/log/email, cache-invalidation and retained artifact-storage usage. No paid AI. Dollar spend is not yet measured; the approved $1–3/month small-pilot allowance remains an estimate, not a cap. Proposed amendment adds no service or fixed cost.

Specific approval needed: this exact three-field Alpha-only security-policy amendment and retry of the existing bounded Alpha package with the already designated accounts/consent, fresh inventory and the same stop/rollback gates. No production authorization is requested.
