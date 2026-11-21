# Confirmed Process Alpha shared-platform contract

Status: local implementation and preparation only. No deployment, AWS writes, credentials, Explore activation, live authentication or paid AI. Branch `codex/process-shared-platform-contract`. Final local commit and immutable package manifest are provided in the Issue11 handoff.

Sources: Homepage base `c59408fba049637becdd80b5f64bda5fc9b2c834`; Process `43a29b11ba903070cd5da24e90b9995c8078a52f`; unchanged Tree authority `ffda73eb69bcd4ea4517fa575c8859be086459c6`. Reviewed Issue11 comments7053780739 and7054605251. Process consumer was exercised unchanged; no Process/Tree files or deployment aliases were modified.

## Confirmed private session RPC

`POST https://8qmgd1ghdi.execute-api.us-east-1.amazonaws.com/internal/coaches/process/session`, stage `$default`, AWS_IAM, existing BFF integration `pnnbk27`. Exact caller is `arn:aws:iam::771049112957:role/decisionprocess-alpha-runtime`; the BFF verifies the trusted API Gateway account/API/stage/assumed-role context, not caller-supplied headers. No wildcard role prefix or public-cookie path can invoke it.

Request exactly `{sessionId:<43-character opaque __Host-engent-email value>}`; JSON maximum1024bytes, no subject/role/audience override. Response exactly `{active:true,subject:<existing stable sub>,expiresAt:<Unix seconds>,audience:"process-alpha"}`. Expiry is the minimum of wrapper and existing lease/root expiry. No access/refresh tokens, credentials, email, lease, Tree entitlements or Advanced privilege in the response.

BFF consistently reads its existing PLATFORM#EMAIL wrapper, then calls its already-authorized `/internal/platform/email/session` with lease/action=read. Unchanged Tree authority freshly checks lease, root, subject binding and enabled account. Pending/inactive/revoked/disabled/missing wrappers deny401/403; authority/storage failure503. Malformed requests400/413; wrong IAM context403. No cached identity decision. Process continues to validate before EACH paid attempt; six paired offline transports demonstrate the consumer compatibility.

Process permissions remain its prepared exact execute-api ARN, own usage table, own SSM credential and own logs. No new permission to Tree/authentication/project tables. Existing BFF permissions already read its wrapper and call Tree's session authority; no additional BFF runtime/boundary grant is needed. Actual deployed IAM/boundary/edge behavior remains an acceptance gate; offline verification cannot certify it.

## Allowlisted sign-in return

Entry `/explore?entry=email&return=process`. Existing signed-in Release B users return directly only after authoritative session verification. For code sign-in, explicit bootstrap adds `?return=process`; the BFF stores only a ten-minute navigation intent in its existing preauth/session wrapper. No new table, cookie, localStorage or sessionStorage is needed. Pending state grants no Process access.

The original Tree POST handoff receives `returnTo=explore`, never a new Process enum. After active-session verification on Explore, `POST /api/platform/email/return` with same-origin JSON `{}` conditionally consumes the intent and returns only `/process/`. No arbitrary redirect field is accepted. Replay/expired/revoked intent denies, no automatic resend or redirect loop. Lost consume responses leave the user safely signed in on Explore; manually opening Process works. Concurrent tabs can consume the browser-session intent only once; this is browser-session scoped, not a guarantee of tab affinity. Other Explore visits have no return intent and stay unchanged. Existing code failures/cancel/logout and registration restrictions remain.

Server flag `PROCESS_SESSION_ENABLED` defaults off and is honored only in Alpha with existing Release B/shared-auth flags enabled. Frontend Alpha candidate uses `VITE_PROCESS_RETURN_ENABLED=true`; ordinary/production builds leave it off. Flags must be coordinated after separate deployment approval; Process AI/contract flags remain off pending hosted acceptance.

## Exact shared-platform delta

`infra/process-alpha/shared-routes.template.json`: TWO resources only: IAM route on existing API and exact `$default/POST/internal/coaches/process/session` API Gateway invoke permission on `engent-platform-alpha-api:live`. Account/region assertions prevent cross-environment use. New public return endpoint uses the existing `ANY /api/platform/{proxy+}` route and existing public BFF permission: no new resource.

Existing BFF source/version/alias release; Homepage frontend release for return adapter. Existing Tree source, deployment, fixed return list and entitlements remain unchanged. `Homepage.jsx`, its Process illustration/descriptions/podcasts/MeetYourCoach placeholder/layout/section anchor, shared header source and existing route templates remain unchanged.

`cloudfront-delta.proposed.json` carries Process's scoped non-executable overlay: two origins (private Process web prefix and IAM/OAC Function URL) and three higher-priority behaviors `/api/process/workbook/*`, `/process`, `/process/*`; API cache disabled, exact email cookie plus Origin/content/hash/request-ID forwarded, OAC always-sign. Model60s/Lambda80s/edge90s/client95s. Process-only canonical/SPA rewrite, no global error rewrite. The existing default Tree, Explore and `/api/*` settings must be preserved. Existing origin/header policy objects are reused. At later approved release, merge this delta with the Homepage origin update using ONE fresh distribution config/ETag; never overwrite the distribution with a stale Process snapshot.

No new distribution, API, identity pool, project storage or shared-session datastore. The two shared additions have no fixed monthly service charge; ordinary API/Lambda/DynamoDB usage remains metered. Process-owned resources, usage caps and costs stay with the Process preparation package.

## Validation

- 125/125 tests across27 platform test files, including existing Release B/header/session/Explore tests and new private RPC, return lifecycle, UI and routing tests.
- Complete paired contract uses unchanged Process SigV4 verifier and unchanged Tree broker: pending deny, active Student, Advanced ignored, root expiry cap, one-use return, revoked/disabled denial. All synthetic/in-memory, zero real API/OTP calls.
- Built Alpha frontend in Edge1280x900/390x844: explicit synthetic code, unchanged Tree handoff, automatic Process return, browser sessionStorage deliberately blocked, one-time consumption, revisit Explore remains on Explore; existing Process placeholder and top anchor preserved. A synthetic document navigation follows the actual Tree303 destination assertion, keeping Playwright's redirect follow-up intercepted. This is not live CloudFront/SSO evidence.
- Existing local HTTPS Release B/Tree regression passes desktop/mobile: mixed legacy/native cookies, root conflicts, lost-response logout retry, cross-tab revocation, other-device preservation and fresh roles. Header comparison now normalizes only Windows line endings; header implementation is unchanged.
- Ordinary and Alpha frontend/BFF builds pass. Reproducible source-pinned local package includes API ZIP, frontend, infrastructure proposals and SHA256 manifest; no upload/deploy command.
- Dependencies unchanged. Locked installation reports three pre-existing moderate transitive build-tool advisories (`sucrase`/`glob`/`minimatch`). No unrelated dependency upgrade was introduced. Production-only dependency audit reports zero vulnerabilities. Reassess build-tool advisories before release.

Screenshots: [desktop](explore-preserved-1280.png), [mobile](explore-preserved-390.png). Evidence: [paired contract](paired-evidence.json), [built browser](browser-evidence.json).

## Release and rollback — requires separate authorization

1. Capture fresh Alpha distribution config/ETag, API route/permission state, BFF version/alias RevisionId, flags and Homepage origin. Resolve any newer owner changes before applying this source package. No AWS-generated change set exists yet.
2. Coordinate Process stack/artifact outputs/credential privately with Process owner. Stage API ZIP outside CloudFront-readable `releases/*`; stage frontend under new immutable platform commit prefix. No object overwrite or production target.
3. After approval, create/review/execute only the two shared additions; publish BFF version and conditionally move its live alias. Enable Alpha-only Process session flag with shared-auth/Release B unchanged. Verify signed allow/deny and wrapper/root revocation before enabling Process AI. Merge scoped Process origins/behaviors and the new platform origin with fresh ETag. Record all previous values and VersionIds.
4. Guest/manual workbook first; separately authorized genuine SSO return/revocation and bounded paid AI acceptance next. Verify OAC/body signing/direct-origin denial/cookies/CORS/60-second request and unchanged Tree/Explore/Admin. Process operational $10 limit is not authorization for these tests now.
5. Explore launch remains Coming Soon in this package. Only after explicit acceptance may Homepage owner publish the separate existing-button replacement; preserve all surrounding content and navigation.

Rollback: first disable Process AI/session feature if unsafe; owner restores only its captured BFF alias/flags and Homepage origin with conditional revision/ETag checks, preserving concurrent changes. Remove only owned Process route/permission and Process CloudFront behaviors/origins when no longer in use. Never restore an old entire distribution config, roll back Tree, delete session/identity/project rows, or undo revocation. An unused navigation-intent field expires naturally and is ignored by old code. Keep Process usage/unknown-spend reservations and audit records. If an alias/config write is ambiguous, reconcile before retry. Do not reset usage to recover authentication.

Remaining gates: explicit deployment/change-set/credential authorization; fresh read-only deployed-state reconciliation; actual IAM/OAC/timeout tests; separately approved live authentication/AI validation. Contract is source-confirmed, not deployed or live-certified.
