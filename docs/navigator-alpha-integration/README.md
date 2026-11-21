# Navigator + Explore Alpha integration package — 2026-11-21

**Source preparation and local validation only. No deployment, AWS resource/IAM change, credential-value read, master-control change, paid request or PR merge occurred.** The current working Alpha and Production are unchanged. Hosted Navigator acceptance has not passed: no Navigator Lambda is installed yet. This package is ready for engineering/approval review, not public activation.

## Reconciled source

- Existing review: [draft Homepage PR #8](https://github.com/xiaominy2025/gpttutor-frontend/pull/8), latest Navigator source `0d5566140ae26de28a7a9659f76bd5445da2b7bf`.
- Current deployed website source `a9ebc7a9e56b5aeb9df54d7260b6058c43c7ee7c`; its publication documentation head `b5833287fabbf9744e33a17dce1ce2d987050225` is the integration base.
- Integrated candidate branch `codex/navigator-release-b-integration`, implementation `934f2fd837423c45d77082566ba5f55a50df4771` (frontend implementation `97193e26dcd1261a2db9a3dd31ac031b6293f852`). Runtime handoff from **5-Decision Navigator Development** is `b7e337e8f1fad3eb568803f15af66a0023b999f4` on `codex/navigator-alpha-runtime`, including the dispatch/replay correction `d6be6db`.
- PR #8 remains draft at its existing source head. The reconciled branch is linked for review; no force-push, draft-PR merge or replacement of another chat's branch was performed. Do not deploy the old PR #8 head: use the explicitly pinned integrated candidate.

PR #8 diverged at `f2fa3a1`, before the deployed Release B email header/session work, Process launch, shared master control and scrollbar refinement. Its `PlatformAccess` mixed Navigator with the old OAuth/account menu and gated rendering on `account.navigator`. Its original API handler also resolved account entitlements before Navigator access. The current Release B BFF intentionally excludes paid AI, SSM and Navigator budget capabilities and returns no Navigator route. A wholesale merge would regress or conflict with those boundaries.

The integration ports only the latest Navigator dialog/artwork/styles/protocol and new isolated runtime. The current Homepage, Release B header, shared-session notification, coach availability, podcasts and document-scrolling fix remain the baseline. The only existing shared-store change adds an optional key mapper with the existing default unchanged. Release B's deployed adapter does not use that new mapper. Existing auth entrypoints and scripts are unchanged.

## Visitor experience and compatibility

Navigator appears immediately above Decision Process Coach. Its existing Open Navigator dialog, welcome, watercolor marks, Objectives → Analysis → Human Judgment framework, adaptive optional follow-ups, free-form input, four-interaction limit, reset and close/reopen behavior are preserved. There is no Navigator podcast link and all six coach sections retain their order, illustration, description and launch/status behavior.

The ported component has no account lookup, sign-in, registration, entitlement check or account/logout menu. The platform header continues to work independently. All visitors, including those with a platform session, receive the same anonymous Navigator policy. A signed HttpOnly anonymous abuse-control cookie is not an account or login. Transcripts and continuation tokens remain in page memory and clear on reload; no Navigator project/transcript records are written.

On the first explicit Send, the browser POSTs `{}` as JSON to `/api/platform/navigator/session`, waits for 200, then POSTs the existing turn payload to `/api/platform/navigator`. Opening the dialog/welcome makes no Navigator request. Bootstrap reuses a valid anonymous cookie, does not call the provider and consumes no turn quota. Exact Alpha Origin is required. The browser never reads the cookie or credential. No automatic model retries were added.

Only the six Explore animations receive a scoped CSS rule moving the initial Play control bottom-right. Their content, RAF timeline, pause/resume behavior, reduced-motion stills, labels and keyboard handling are unchanged. Homepage player positioning is unchanged. Navigator is lazy-loaded behind an Alpha-only opt-in; existing auth-only/default builds exclude its client endpoint. The new `scripts/build-navigator-alpha.mjs` builds web only; `scripts/build-navigator-alpha-runtime.mjs` builds the isolated Lambda. Neither deploys anything.

## Runtime safety

The isolated anonymous handler reuses the latest four-turn protocol and canonical shared paid-AI master gate. Every provider dispatch checks the master strongly consistently; OFF/missing/invalid/timeout/error denies. ON never bypasses independent readiness, the credential, budget, quotas or concurrency. Already dispatched requests cannot be recalled. The existing Administrator interface/control is unchanged.

Guest limits stay **2 requests/minute, 5/day, 1 in flight per anonymous actor; 20/day per IP; 2 globally in flight; $10 per UTC calendar month**. Four interactions can require waiting across minute buckets. Signing in does not raise Navigator's limits. Signed continuations bind the exact transcript, caller and available follow-up questions, expire, and are consumed atomically. The inherited replay edge case was corrected: once provider dispatch may have occurred, a failed/invalid/uncertain response cannot release that turn for replay. Only confirmed pre-dispatch denials release a claim.

The provider transport has no application retry, an 18-second timeout, `store:false`, GPT-6 Luna Standard and a 1,500-output-token ceiling. Reservation uses UTF-8 request bytes plus framing and conservatively charges input at $0.125/M, including cache-write pricing, with output $0.50/M. Unknown provider/settlement outcomes retain spending holds. Budget data, replay hashes, concurrency leases and hashed actor/IP counters are the only operational state, under `NAVIGATOR#* / STATE`, with TTL. No email, entitlement, project or transcript access is granted.

## Actual read-only Alpha findings

Account `771049112957`, region `us-east-1`:

- Platform BFF `engent-platform-alpha-api:live` is version **5**, with `NAVIGATOR_ENABLED=false`. Tree remains **18**, Process **6**. Existing shared master remains **ON**, `suspended=false`, revision **9**. No setting was changed for investigation or tests.
- No Navigator Lambda, exact Navigator routes or dedicated Navigator table were found. No `engent-platform-*-state` table exists in this account inventory. Current API `8qmgd1ghdi` routes `ANY /api/platform/{proxy+}` to the BFF integration `pnnbk27`; exact future Navigator routes must override only their two paths.
- API `$default` has AutoDeploy=true, default 5 requests/second and burst 10, with no stage access-log configuration. Creating routes is a hosted mutation requiring separate approval even while the new Lambda is OFF.
- CloudFront `E1C4AJI9FUE47B` already sends `/api/*` to that API, with cookie/Origin forwarding and caching disabled. No new distribution, origin, DNS or CORS configuration is proposed. Viewer-IP attribution through CloudFront is **not yet verified**. If `requestContext.http.sourceIp` is a shared edge address, the IP quota can group unrelated visitors. Do not trust client-supplied X-Forwarded-For as a substitute.
- Existing table `decisiontree-alpha-staging-Data-JH4B4OFXWER5` has composite `pk/sk`, PAY_PER_REQUEST and enabled `expiresAt` TTL. The new namespace isolates operational state from existing account/project/session rows.
- Regional Lambda limits currently show 1,000 total and 978 unreserved executions, leaving room for the proposed reservation of two. Reconfirm immediately before any separately approved installation.
- `/decisionnavigator-alpha/openai-api-key` exists: Standard SecureString, version 1, AWS-managed `alias/aws/ssm`. Its value, format and provider/model access were **not** retrieved or verified. Current runtime expects a raw key; format compatibility is an activation gate. No duplicate credential is proposed.
- `/decisionnavigator-alpha/hmac-secret` is absent and must be provisioned separately after approval. Use a dedicated high-entropy signing secret; never reuse/copy an AI key. Retain it across releases/rollback.
- Existing Alpha artifact bucket `decisiontree-alpha-artifacts-771049112957-us-east-1` has versioning and all public-access blocks enabled. A fixed Navigator release prefix plus immutable conditional writes/version pins is proposed. No artifact was uploaded, and effective deployer write isolation still needs execution preflight.
- Final read-only verification confirmed the current website HTML version `WCRidCoVSP8bibymptKxPZ6XWtdKAQUS` and Process HTML version `OkuPZc3xyU.shza5hbTTBqCg.Oxm.Gw0` are unchanged, along with aliases/master/CloudFront configuration.

## Exact proposed AWS/IAM delta

[CloudFormation proposal](../../infra/navigator-alpha/proposal.yaml), proposed new stack `decisionnavigator-alpha`: **10 CloudFormation resources**, plus **1 separately provisioned Standard SecureString** for HMAC, for **11 new resources total**:

1. IAM role `decisionnavigator-alpha-runtime` with its inline least-privilege policy.
2. Log group `/aws/lambda/decisionnavigator-alpha-api`, 14-day retention.
3. Lambda `decisionnavigator-alpha-api`, Node.js 22, 256MB, 29 seconds, reserved concurrency 2, default `NAVIGATOR_ENABLED=false`.
4. Published Lambda version bound to the exact ZIP hash.
5. Lambda `live` alias.
6. One AWS_PROXY integration on existing API `8qmgd1ghdi`.
7. Exact `POST /api/platform/navigator/session` route, anonymous.
8. Exact `POST /api/platform/navigator` route, anonymous.
9. Route-scoped invoke permission for bootstrap.
10. Route-scoped invoke permission for turns.
11. Separately created `/decisionnavigator-alpha/hmac-secret` SecureString. The existing OpenAI parameter is reused unchanged.

No new table, API, bucket, certificate, domain, Cognito resource, dashboard, switch, SNS subscription, custom metric or alarm is proposed. No existing BFF/Tree/Process role or Lambda update is needed. Existing API routing gains only the two exact routes; its proxy/auth integration remains untouched. A future enabled version and alias transition are distinct from the default-off installation.

[Complete IAM policy](evidence/runtime-policy.json) is also embedded in the template: Get/Put/Delete only on `NAVIGATOR#*` rows in the exact existing Alpha table; a separate projected GetItem-only statement for `AI#CONFIG`, attributes `pk/sk/suspended/revision`; GetParameter only on the two exact Navigator Alpha paths; log-stream writes only to the new log group. No master writes, account/project access, Query/Scan, Cognito, entitlement invocation or unrelated secret permission. IAM narrows partition keys; source fixes `sk=STATE`. Transactions require the underlying PutItem permissions. **14 read-only custom-policy simulations passed**; this is not proof of a future role's effective boundary/SCP/KMS permissions.

Creating the named role requires a separately approved deployment principal and CAPABILITY_NAMED_IAM. The future write set needs only the new stack/resource operations, dedicated HMAC provisioning, immutable artifact upload and later Navigator-only alias publication. No such authorization is inferred from code preparation.

## Artifacts and local evidence

[Frozen release plan](release-plan.json) records clean source `934f2fd`, frontend hashes and the local Lambda ZIP. ZIP SHA-256 `1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac`; base64 `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`; size 310,143 bytes. Proposed S3 key is `releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip`. It is **not uploaded**; no S3 object version or AWS change set has been created.

- **172/172 platform tests, 32 files**, passed, including anonymous access, four-turn forwarding, forged/foreign continuation rejection, post-dispatch replay retention, fail-closed master cases, UTF-8 reservation math and composite storage keys.
- Clean Alpha web candidate, isolated Lambda and ordinary frontend builds passed. Existing Release B auth-only builder also passed with only its output directory relocated for verification; its capability-exclusion checks remain intact. Previously deployed release artifacts were not overwritten. No Navigator endpoint is emitted by the auth-only build.
- CloudFormation lint and [14 IAM simulations](evidence/iam-simulation.json) passed.
- [Local built-browser results](evidence/browser-results.json): 1440/1024/768/390, Navigator placement, six bottom-right 48px controls, keyboard playback, native dialog focus/Escape/restoration, close/reopen state, four interactions, continuation forwarding, explicit restart, refresh clearing, reduced motion, no page horizontal/nested scrolling and unchanged coach links. External analytics was blocked intentionally; no real API or paid request was forwarded.
- [Marketing regression](evidence/marketing-regression.json): 13 measurements, actual desktop window resizing, podcasts play/pause, shared email-form layout/dismissal, navigation, scrolling and legacy styling passed against local fixtures. Process and Tree source/deployments are untouched.
- Local mock screenshots: Explore [desktop](evidence/explore-1440.png) / [mobile](evidence/explore-390.png); dialog [desktop](evidence/dialog-1440.png) / [mobile](evidence/dialog-390.png). These are not hosted Navigator acceptance evidence.

## Incremental cost estimate

**Expected fixed recurring increment: $0** for the proposed configuration. It uses on-demand Lambda, existing on-demand storage/API/CDN, Standard Parameter Store and no provisioned concurrency, paid custom metrics or new alarms. Reserved concurrency is a capacity limit, not provisioned concurrency. Usage, logging, data transfer and abuse can still create AWS charges; the $10 model ledger does not cap AWS traffic costs.

Illustrative estimate, not a forecast or cost ceiling: 1,000 model turns/month at 256MB, 18 seconds average function duration; up to 1,000 one-second bootstrap calls; small DynamoDB rows. Before free credits, Lambda is about $0.08, HTTP API about $0.002 and roughly 10,000 read/15,000 write units about $0.011, plus small logs/storage/CDN requests. This is approximately **$0.10 plus those ancillary usage charges** under the stated assumptions. Larger rows, latency, traffic, denied requests or abuse change the bill. Sources: [Lambda pricing](https://aws.amazon.com/lambda/pricing/), [HTTP API pricing](https://aws.amazon.com/api-gateway/pricing/), [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/), [Systems Manager pricing](https://aws.amazon.com/systems-manager/pricing/).

The independent Navigator model ledger remains **$10/month**, including conservative reservations and uncertain holds. At 3,000 input and 500 output tokens, its conservative accounting is $0.000625 per turn, or $0.625 for 1,000 such turns. Actual usage varies. [GPT-6 Luna pricing](https://developers.openai.com/api/docs/models/gpt-6-luna) lists input $0.10/M, cache writes $0.125/M and output $0.50/M; the guard conservatively uses the higher input rate. Reverify pricing/model access before activation.

## Approval sequence and remaining acceptance gates

1. Review this source, exact IAM/template and hashes. Close the execution-preparation gaps below before approving a live/paid canary. Do not treat a source proposal as an executed AWS change set.
2. With a separate, specific **default-off infrastructure approval**, reconfirm existing Alpha HTML/aliases/master/IAM/API/CloudFront state; stop on drift. Verify two reserved executions fit the regional quota. Upload only the pinned ZIP under the exact Alpha artifact key with If-None-Match, verify body/version, and bind CodeVersion + CodeSha256. Generate/review the new stack's change set and separately provision the missing HMAC without exposing it. The default-off stack must not mutate existing auth/resources or shared settings.
3. Verify installed role/KMS/credential isolation and actual API/Origin/cookie routing. A separately reviewed unpublished, provider-blocked hosted harness is required for anonymous bootstrap, cap, concurrency and timeout negatives. Use the real budget/store modules only on isolated synthetic `NAVIGATOR#acceptance#` rows; never seed/reset/refund the real monthly ledger. Verify viewer-IP attribution through CloudFront; keep existing conservative IP protection and never trust arbitrary forwarded headers.
4. An actual **Administrator master OFF/ON** acceptance requires a separately approved short global Alpha OFF window, coordinated with Tree and Process. OFF briefly denies their new paid dispatches too. Use the existing audited MFA-protected switch, verify fresh revisions, test Navigator with provider transport blocked, restore ON under ownership checks and verify recovery. No switch was toggled here.
5. Before any **paid acceptance**, prepare/review a source-pinned execution and metering guard with durable reservations, an exact qualified invocation target, at most four sequential sends, no retries and a separate allowance. Proposed allowance is $0.03, **not authorized**. A 12,000-byte actual provider-request ceiling plus 1,024 framing and 1,500 output tokens reserves at most $0.009512 for four turns under these rates. Neither this ceiling nor the independent canary guard is installed. Stop on unknown outcomes, retain holds, reconcile actual usage against the canonical monthly ledger, and never expose a canary-only experimental target on the public alias.
6. Only after hosted security, budget/concurrency, credential, master and bounded AI checks pass, separately approve public Alpha activation. Publish only the enabled Navigator version/alias and reviewed website hashed assets/HTML, preserving the existing BFF/Tree/Process versions and AI master setting. Use the established conditional HTML ownership journal and one scoped invalidation. Verify anonymous full four-interaction flow at the four widths, signed/replay negatives without new provider dispatches, podcasts, navigation and current coaches. Production remains out of scope.

**Remaining blockers:** future effective IAM/KMS and raw-key format/model access; HMAC provisioning; viewer-IP attribution; source-pinned unpublished hosted harness/transport and durable canary guard; hosted cap/concurrency/timeout/master acceptance; actual bounded AI acceptance and separate installation/activation approval. No hosted Navigator behavior or paid quality is claimed by mocks, policy simulation, lint or historical PR #8 experiments.

## Rollback boundaries

Before a future release, capture the then-current website HTML VersionId/ETag/body and new Navigator stack/alias/route ownership. Current website baseline is `WCRidCoVSP8bibymptKxPZ6XWtdKAQUS`, ETag `215f398df428a3ea88631dfaa35a97d3`. Restore only a release-owned website HTML version with If-Match and the captured bytes; retain all immutable assets. Scope invalidation to affected website paths; do not restore a whole CloudFront configuration.

For runtime rollback, move only the Navigator alias to its reviewed OFF version using the captured revision condition, or remove only the two new exact routes if ownership is proven and the original proxy remains intact. Do not modify BFF5, Tree18, Process6, Cognito, existing IAM roles, DNS or the shared master to perform Navigator rollback. Preserve the key, HMAC, canonical ledger, spent amounts and uncertain holds across all versions. Preserve new logs/operational evidence for reconciliation; do not delete shared-table rows or assume deleting a stack refunds model spend. Unknown write outcomes stop for reconciliation rather than blind retries. The current Alpha requires no rollback because no deployment occurred.
