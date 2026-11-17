# Release A — minimal Alpha shared authentication approval packet

Prepared November 17, 2026 for Issue 6. This replaces the broader platform/Navigator resource proposal **for Alpha Release A only**. No architecture reapproval is requested. No AWS write, sign-in, identity/project write, deployment or paid API call has been made during preparation.

## Scope and exact URLs

- Optional Student entry, Alpha mirror of www.engentlabs.com/explore: **https://d6owpirihdsus.cloudfront.net/explore**.
- Existing Alpha Tree application: **https://d6owpirihdsus.cloudfront.net/**.
- Platform callback: https://d6owpirihdsus.cloudfront.net/api/platform/callback; logout: /explore.
- Tree callback: https://d6owpirihdsus.cloudfront.net/api/shared/callback; logout: /.
- New Alpha-only managed login: https://engent-platform-alpha-771049112957.auth.us-east-1.amazoncognito.com.

These are the exact proposed URLs, not a claim the new endpoints are deployed. The existing Alpha hostname already has public HTTPS. No production www origin, custom hostname, DNS, certificate or distribution is changed. Explore is a reserved path overlay on the existing Alpha host; the actual marketing homepage is not published there. The build-only adapter keeps the logo under /engent-alpha/assets and points the brand home link to the existing public homepage. No approved website redesign or Navigator relocation.

This is the cheapest practical integration test using existing infrastructure. Because both apps share one Alpha host, **it does not certify production cross-host cookie behavior**. Two distinct OAuth clients and host-only session names are still exercised. A later isolated cross-host validation is required before production; this packet does not authorize that release or additional hosting.

## Fresh read-only baseline

- Account 771049112957, region us-east-1; existing stack decisiontree-alpha-staging UPDATE_COMPLETE.
- CloudFront E1C4AJI9FUE47B; snapshot ETag E13V1IB3VIYZZH. Existing frontend origin path /releases/6edfbe980e269502a08f74c0048676dcd639dbb0. Existing API /api/* behavior, headers, certificate, OAC and default behavior stay intact.
- Existing HTTP API 8qmgd1ghdi; current proxy ANY /{proxy+} has no default IAM authorizer. Integration 1xwneaq invokes decisiontree-alpha-staging-api:live. The new internal route alone requires AWS_IAM.
- Tree live alias version 10, source 0c6a786c009398ec6aa15982ffdb20836a19d4ce; Lambda CodeSha256 iHsXU4Un46YBJYJdUJjRU9UOqy0ow5wtgFdOTxroOA8=.
- Student pool us-east-1_CipTwwDZb, already ESSENTIALS; PASSWORD and EMAIL_OTP allowed, MFA OFF. Existing OTP client 75pct09jh93d4gkjhbot8kgh85 is retained unchanged. No current login domain or additional clients found.
- Administrator pool us-east-1_b65OCB64G, MFA ON, PASSWORD only, 16-character minimum password. No Admin resource or MFA setting is changed.
- Existing data table decisiontree-alpha-staging-Data-JH4B4OFXWER5, pk/sk keys, on-demand billing, expiresAt TTL enabled.
- Existing recovery bucket decisiontree-alpha-staging-snapshots-6vvy32srfalt retained; no object contents or user records read.
- Existing frontend bucket decisiontree-alpha-staging-frontend-vnhhrwadnpad and artifact bucket decisiontree-alpha-artifacts-771049112957-us-east-1 both versioned. Bucket policy already authorizes this distribution to read releases/* using OAC E13FXUT5PZ1TLZ, so no bucket policy change is required.
- SES sending enabled, out of sandbox; existing sender verified. No sender/DNS/SES change. Public /api/health returns status ok, mode practice; that is not an authenticated AI readiness test and AI is outside Release A.

These metadata checks confirm configured baseline only. Actual account sign-in, entitlements, Admin MFA challenge and project recovery have not been verified live. No identities were listed or invented. Before activation, the owner must designate existing Alpha Student, Advanced and Administrator testers and an existing recovery project; production accounts are in a different pool and are not copied into Alpha.

## Required Now

First, before creating any public client, explicitly approve setting AdminCreateUserConfig.AllowAdminCreateUserOnly from false to true on Alpha Student pool us-east-1_CipTwwDZb. This prevents public self-signup through managed login. It does not create/migrate/delete users and existing-account OTP remains available, but it disables any existing Alpha self-registration flow; this is a material policy change requiring owner approval. Production and the Administrator pool are excluded. Preserve all other UpdateUserPool settings, save before/after request files and reject any other semantic diff. scripts/release-a-signup-guard.mjs prepares these files locally from a fresh description and installed CLI input skeleton; it never calls AWS. Do not execute a partial UpdateUserPool request, which can reset omitted settings.

Then use a new small stack **engent-release-a-alpha**, template infra/release-a/template.yaml. Its exact resource lines are:

1. One prefix Cognito managed-login domain on the existing Alpha Student pool.
2. Two public OAuth clients engent-platform-alpha and engent-tree-alpha-shared; one default branding resource per client.
3. One auth-only Lambda engent-platform-alpha-api, arm64 Node 22, 256 MB, 28-second timeout, reserved concurrency 2, version and live alias; one 14-day log group and runtime IAM role engent-platform-alpha-runtime.
4. One Lambda integration on existing API 8qmgd1ghdi, ANY /api/platform/{proxy+} route and its alias invocation permission.
5. POST /internal/platform/entitlements on that same API, AWS_IAM, reusing existing Tree integration 1xwneaq and the existing broad API-to-Tree Lambda permission. No extra internal integration is needed.
6. One inline policy on existing Tree role decisiontree-alpha-staging-ApiRole-tmQtkTYts533 adding DeleteItem only for SHARED#* session keys.
7. One CloudFront Function engent-release-a-alpha-explore for static-path rewriting. After stack creation, a separately reviewed saved-config patch adds one S3 origin pointing at releases/engent-release-a/PLATFORM_SHA and three behaviors (/explore, /explore/*, /engent-alpha/*) on E1C4AJI9FUE47B. API traffic keeps the existing /api/* behavior. The Tree frontend origin switches to its reviewed immutable releases/TREE_SHA prefix. No broad SPA fallback is added.

Additional deployment operations after approval: upload immutable frontend and API artifacts into those two existing Alpha buckets; publish reviewed Tree backend version and point only its Alpha live alias to it. Merge five shared-auth environment fields into Tree's existing environment privately without printing or replacing unrelated values: SHARED_AUTH_ENABLED, PLATFORM_CLIENT, SHARED_TREE_CLIENT, SHARED_LOGIN_DOMAIN, PLATFORM_CALLER_ROLE. Preserve APP_ORIGIN, pool/client IDs, tables, snapshot bucket, credentials, limits and Admin settings. No full update of the legacy Alpha stack from the newer production template: that risks unrelated drift/replacement.

Platform sessions use **PLATFORM#SESSION#... / PLATFORM#TX#...**, sk STATE, in the existing table. This Alpha-only reuse avoids another table. Its role cannot read/write Tree user, entitlement, project, OTP, Admin or SHARED# rows. Existing Tree sessions use SHARED#... with separate cookie names. No new account store or user migration.

## Deferred

No Navigator credentials/SSM parameter, IP-HMAC secret, OpenAI model configuration, AI call, budget reservations, $10 monthly budget infrastructure, CloudWatch custom metrics, budget alarms, SNS subscription or notification approval. No generic platform state table or new HTTP API. No separate artifact/frontend bucket, new distribution, DNS, ACM, WAF, NAT, KMS key or other coach resources. The older infra/platform/template.yaml is explicitly **not** the Release A deployment template.

The auth-only entry server/platform/release-a.mjs has navigator=false and requires NAVIGATOR_ENABLED=false. It imports no Navigator budget, SSM, CloudWatch or OpenAI adapter. No credential is provisioned. Existing Navigator source stays deferred and inaccessible.

## Literal IAM and OAuth

Checked-in exact JSON under infra/release-a/policies:

- runtime-policy.json: GetItem/PutItem/DeleteItem only on the existing Alpha table with ForAllValues:StringLike LeadingKeys PLATFORM#*; CreateLogStream/PutLogEvents only the new log group; execute-api:Invoke only 8qmgd1ghdi/$default/POST/internal/platform/entitlements. No Scan, Query, SSM, KMS, Admin, SES, projects or production resources.
- runtime-trust.json: Lambda service trust.
- tree-session-delta.json: DeleteItem only on existing Alpha table LeadingKeys SHARED#*.
- operator-required-policy.json: complete proposed deployment/rollback permissions, restricted to the new named stack/runtime/function/log group, existing Alpha API/pool/Tree function/role/distribution, one new CloudFront Function and release prefixes in existing Alpha buckets. Existing operator may already have these; no new deployer or CloudFormation execution role is required. No policy is attached now.

IAM cannot restrict the contents of PutRolePolicy or API route bodies. The operator policy therefore names the exact Alpha role/API; the reviewed policy JSON and change manifest constrain intended writes. Some Cognito and API provider calls still need live effective-permission validation. Static Access Analyzer is not proof of effective access. Never widen to production or administrator grants after an error. Production ARNs are absent from this packet's grants.

New client IDs are CloudFormation outputs, not fabricated values. Both clients use code grant, S256 PKCE, state, nonce, verified email and server-side token verification. Scopes openid/email/aws.cognito.signin.user.admin, COGNITO provider only, no implicit flow or client secret. Access/ID tokens 15 minutes, refresh 30 days, revocation enabled. No pool MFA/tier/password/attribute policy change. One explicit Alpha-only signup guard is required below. Existing OTP client and Administrator pool are unchanged.

Durable cookies are HttpOnly/Secure/host-only/SameSite Strict; five-minute OAuth transaction cookie is Lax for callback. Platform and Tree cookie names differ. CORS is unnecessary for the browser because APIs are same-origin; state-changing requests require the exact Alpha Origin. Tree entitlements checks require SigV4 and the exact assumed-role prefix arn:aws:sts::771049112957:assumed-role/engent-platform-alpha-runtime; caller token is verified against the platform client. No arbitrary-account lookup is exposed.

## Costs

Expected new fixed monthly charge: **$0** (on-demand Lambda, clients/domain, IAM, API routes and function, existing table/hosting; no provisioned capacity or paid plan). For a small test pilot (up to 100 existing Alpha testers, 1,000 login flows/month, 10,000 API requests and <=1 GB incremental transfer), reserve **$0–$2/month incremental AWS**; this is an estimate, not an enforced billing cap. Free allowances and existing usage are account-wide. No Cognito tier upgrade: ESSENTIALS already enabled. No new recurring Navigator metrics/alarms. OpenAI/Navigator incremental spend **$0**; paid calls prohibited.

Usage lines are Lambda requests/duration, existing HTTP API calls, namespaced DynamoDB session reads/writes, small log/S3 storage and transfers, CloudFront requests/rewrite invocations, and SES OTP email. Above-allowance Cognito MAUs remain billable; adding a second client does not create another user identity. Existing Alpha operating charges are excluded. Official pricing references checked during preparation: [Cognito](https://aws.amazon.com/cognito/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [CloudFront](https://aws.amazon.com/cloudfront/pricing/), [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [SES](https://aws.amazon.com/ses/pricing/). Reconfirm tariff/usage assumptions before execution; no spend-based control for Alpha auth is claimed.

## Test plan and permitted data effects to decide

Before activation, snapshot alias version/RevisionId, complete distribution config/ETag, release object versions/hashes, the new stack change set and existing Tree shared-auth configuration delta. Confirm existing designated Alpha identities and project ownership with the owner; do not create synthetic accounts, alter entitlements or migrate users.

1. Establish baseline with designated testers: existing email OTP sign-in, Student/Advanced permissions, Admin MFA, existing project load and recovery. No AI buttons/calls. Public metadata does not substitute for these live checks.
2. Guest can browse Explore without sign-in; no Navigator and no nonfunctional launches. Verify desktop/mobile and direct /explore and /explore/... refresh, asset prefix and brand link. Root still opens Tree.
3. Existing Student signs in through Explore; verify unchanged Cognito subject and membership. Launch /api/shared/login into Tree without another credential prompt while managed-login session is valid. Compare Student/Advanced entitlements and owned project IDs; refresh in Tree and Explore. Do not grant Advanced via platform.
4. Reject callback replay, state/cookie/nonce mismatch, wrong client/issuer, foreign Origin, anonymous/foreign-role internal invocation and attempts to use platform role for non-PLATFORM keys. Verify logout/refresh races and expired sessions. Existing revoked tokens/session-cookie behavior must be checked live; a full cross-host scenario remains deferred.
5. Verify old OTP fallback and separate Administrator MFA still work after the release and rollback. Preserve projects/snapshots and test load/recovery before any edits.

Authentication tests necessarily create/update/expire OAuth/session rows, set cookies and send OTP email; Cognito authentication may update identity timestamps. Existing sharedVerify can provision a missing membership when registration policy allows it: for this release use ONLY confirmed existing members and stop if provisioning would be required. No new account/member, entitlement mutation, test-user creation, suspension or AI usage is approved by this plan alone. A project autosave/recovery round trip would write a project/snapshot: perform only with an owner-designated disposable project and explicit permission; otherwise record live write/recovery verification pending. Do not overwrite the owner's existing work merely to test recovery.

## Deployment and rollback after specific approval

1. Approve and apply the single Alpha signup guard first; verify every other pool setting is unchanged before client creation. Existing-only Alpha testing cannot safely expose new public clients while self-signup remains enabled. Build pinned local sources using node scripts/build-release-a.mjs and the Tree hosted build with VITE_SHARED_AUTH_ENABLED=true. Hash artifacts; reject dirty or mismatched receipts. Initial Lambda flag is false. Reconcile Alpha to reviewed Tree source while preserving current Alpha environment/OTP/Admin/data settings.
2. Package only infra/release-a/template.yaml into existing decisiontree-alpha-artifacts-771049112957-us-east-1 under release-a/PLATFORM_SHA. Use CAPABILITY_NAMED_IAM and --no-execute-changeset for stack engent-release-a-alpha. Review every resource action against this packet, no replacement of any existing identity/data resource. Do not package the broader Navigator template.
3. Inspect exact service-side change set and outputs; after approved execution create clients/domain/runtime/routes while auth remains disabled. Client IDs allocated by AWS populate Tree's exact five-variable environment delta; preserve all other values. Publish the reviewed Tree code version and snapshot receipt before moving only Alpha's live alias. Verify OTP/Admin baseline again before enabling shared auth.
4. Upload frontend files without destructive sync/delete: platform web files to existing bucket releases/engent-release-a/PLATFORM_SHA, Tree files to releases/TREE_SHA. Existing releases retained. Generate the local distribution patch with scripts/release-a-cloudfront.mjs, inspect it, apply using fresh ETag only after approval. Enable backend flag through reviewed stack parameters, then verify the optional Explore entry. Never change www.engentlabs.com or production Tree.
5. Run the approved live test cases with designated testers and no paid calls; stop/rollback on baseline or security failure. Record exact new version, object hashes, outputs and results in Issue 6.

Rollback order is generated and fixture-tested with **one local command**, which never executes AWS writes:

    node scripts/release-a-rollback-plan.mjs ALPHA_RECEIPT.json ROLLBACK_PLAN.json

Receipt must name account 771049112957, distribution E1C4AJI9FUE47B, treeFunction decisiontree-alpha-staging-api, prior treeVersion (currently 10), platformStack engent-release-a-alpha, and savedCloudFront snapshot file. The plan first sets EnableAuth=false using the existing packaged stack template/outputs, then restores Tree's previous live alias with fresh RevisionId, restores the saved CloudFront config with CURRENT ETag and waits/invalidates affected paths, then verifies OTP/Admin/recovery. Retain TTL rows, clients and artifacts; no stack/user/project deletion. Keep the signup guard enabled while any new managed-login clients/domain remain: reverting it with public clients still present would re-expose signup. Restoring the old self-registration policy requires a separate approved cleanup of these new clients/domain, followed by the saved full-preservation pool request; never delete existing OTP clients or users. Code tests validate the order and Alpha guards; **a live rollback has not been exercised**. New shared sessions cease to work with the old Tree version, while the original OTP flow remains available.

No real CloudFormation change set has been created: that is an AWS write. The checked-in template, literal IAM and proposal.json are the exact local proposed change set. An owner-approved unexecuted service-side change set is the next step, not an already-passed check.

## Security risks and approval boundary

Fresh metadata also shows AdminCreateUserConfig.AllowAdminCreateUserOnly=false. Client creation itself can expose signup before application activation, so the proposed guard is a hard ordering prerequisite and an explicit owner security-policy decision, not a routine hidden change.

Remaining development dependency exceptions (14 platform / 5 Tree package-chain entries, including unpatched picomatch) are documented, not owner risk acceptance. Prior production-only audits are zero; Release A bundle metadata must also exclude those modules. Keep tools local and inputs trusted. Reusing a table/host makes Alpha cheaper but shares a failure domain with Alpha Tree; prefix IAM, independent cookies, immutable artifacts and saved-config rollback limit impact. Cross-host production parity, effective IAM/provider calls, real managed login/SES delivery, member baseline and live rollback remain open checks.

The requested decision is approval of this **specific Alpha-only resource/configuration set, the existing-only signup guard, and its non-AI verification**, subject to naming existing testers and deciding any project-write test permission. It is not approval for production, DNS, Navigator, user migration, entitlement changes, merges or paid AI. Keep PRs 7 and 14 draft.

Local preparation verification: platform 60/60 tests pass (four Release A guard/plan tests added); existing Tree suite 248/248 previously passed at unchanged ae8279e. Release A frontend/Lambda local build and SAM lint pass. Literal runtime/operator/session IAM validation returns no Access Analyzer findings. New auth bundle module inventory contains no SSM, CloudWatch, OpenAI, Navigator budget or remaining advisory module. Static validation does not replace live IAM and Cognito tests.
