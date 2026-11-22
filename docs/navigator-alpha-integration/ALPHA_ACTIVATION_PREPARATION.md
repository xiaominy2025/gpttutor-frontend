# Navigator Alpha — final activation approval package

**Preparation only. Navigator remains OFF; master remains ON revision 11. No deployment, AI call, infrastructure write or PR merge was performed.** The completed four-call canary is reused, not restarted. This is one coordinated Alpha release, with one owner execution approval for publication, focused checks and conditional rollback.

## Source and artifacts

- Accepted runtime and integrated web: `934f2fd837423c45d77082566ba5f55a50df4771` (frontend implementation `97193e26dcd1261a2db9a3dd31ac031b6293f852`). Current documentation/source checkout `e8929f5`; selected runtime/UI/header/auth/podcast source blobs still match accepted `934f2fd`.
- Paid acceptance: [four-call receipt](PAID_CANARY_ACCEPTANCE.md), conservative charge **$0.001315**, no retries or retained holds. Browser cookie/IP and Administrator master OFF/ON acceptance remain valid; they will not be repeated.
- Compared with deployed web `a9ebc7a`, the only frontend changes are Navigator's three existing component/style files, its lazy Explore insertion, and one scoped CSS rule putting all six initial Play controls bottom-right. Shared header/authentication, podcasts, coach availability and animation content are unchanged.
- Frozen web build receipt and every listed local file hash verified. All **31 reused asset ETags match the local content MD5**. Four new hashed assets are absent at preflight. Prior four-width UI/keyboard/reduced-motion evidence is reused because the exact artifacts match.
- Navigator development chat confirmed no source drift or material runtime blocker.
- Release: `navigator-alpha-activation-116740a7-85c4-4d22-8ecb-16476bb1fc3d`. [Exact immutable approval plan](activation/plan.json), [preparation verification and plan SHA-256](activation/verification.json), [captured rollback HTML](activation/rollback-index.html). Source and byte hashes are authoritative; repeat live preflight before writing and stop on unexpected drift.

## Proposed publication scope

Existing account `771049112957`, region `us-east-1`. **Nine planned publication mutations**, plus ordinary runtime operational records for the specifically approved smoke request and subsequent normal limited anonymous use:

1. Four create-only S3 asset uploads, `If-None-Match:*`, immutable cache headers. No bulk sync or deletion:
   - `DecisionNavigator-C2VSI8RY.js` — SHA-256 `82541fc2db092b410beb56920fec8c399d15d06f3abebcd2e31199597a34e28b`.
   - `DecisionNavigator-DnK5WxPW.css` — `81b235e1ed84dfa0007a94633b1497b16465b312c94bb8c77df004c86e14490a`.
   - `index-BFU71KGq.css` — `de3f8f5a81a2268072d040f892cb95a1365208248ed7d9a0443a4efc266617cd`.
   - `index-CAQrafnX.js` — `97914c889fbe443c48208f0cf70bb6a39ec98324067ba291b2f8e28257eb7c41`.
2. One conditional `UpdateFunctionConfiguration` on `decisionnavigator-alpha-api`, changing only `NAVIGATOR_ENABLED=false` to `true`, keeping `STAGE=alpha`. **No code upload.** Current private revision `489a5853-ae73-480a-8192-2fee5d84a27b`; code SHA-256 base64 `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`. Expected enabled configuration hash `ba9aa36b9460df90001794ac94687aba6ebb9be5d9015c82318486ad695e0872`.
3. One `PublishVersion` with the exact code hash and verified completed enabled RevisionId, followed by immutable-version verification. AWS assigns the version number; it is not guessed. Keep OFF version 1 and previous versions.
4. One conditional `UpdateAlias` for Navigator `live` only, from OFF version 1 with alias revision `9545575c-3a9c-4163-96cd-98f747a769e0` to the new verified enabled version. No weights.
5. One conditional website HTML promotion in bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, key `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled/index.html`. Current version `WCRidCoVSP8bibymptKxPZ6XWtdKAQUS`, ETag `215f398df428a3ea88631dfaa35a97d3`, original SHA-256 `d73a7ca2bf60193b750be41b3c529d812969b0c91279a7b0000100d836d51d38`. Candidate SHA-256 `dc03888c13a04bfe922ea3fe54bb55e0dd1e0761f6f9dbd13a942f4bca27b7e7`. Use `If-Match`, per-write ownership metadata and durable acknowledgements.
6. One scoped invalidation on existing CloudFront `E1C4AJI9FUE47B`: `/engent-alpha/*`, `/explore`, `/explore/*`. No distribution configuration change. Current configuration ETag `E1JYRMDPD0WRC1` and exact hash are pinned in the plan.

All four assets live under the existing website prefix's `assets/`. Preserve all 31 reused assets. Stage and verify assets while Navigator is OFF; then verify enabled immutable runtime, move its alias, promote HTML and invalidate. API becomes active shortly before the new Explore entry is visible; independent limits and the master gate already enforce that brief interval.

Published URLs remain [Alpha Explore](https://d6owpirihdsus.cloudfront.net/explore) and [Alpha Homepage](https://d6owpirihdsus.cloudfront.net/engent-alpha/). Navigator is immediately above Process, has Open Navigator and no podcast link; all six coaches remain visible. Process `/process/` and Tree `/` keep their existing launch behavior. The six existing Explore Play controls move bottom-right; playback/content/Homepage controls do not change.

## Preserved controls and infrastructure

Reuse existing API `8qmgd1ghdi`, integration `5wsf6z0` and its two anonymous Navigator routes. No API/CORS, CloudFront function, role/IAM, Cognito, DNS, credential or stack update. Read-only principal-policy simulation returned allowed for the three proposed Navigator Lambda release actions; no policy was changed. Existing role, 256MB/29-second Lambda and reserved concurrency 2 remain unchanged. A single new immutable function release version is the only new release object; no service/resource provisioning or new fixed recurring infrastructure.

Dedicated `/decisionnavigator-alpha/openai-api-key` remains v3; HMAC remains v1. No secret-value reads by the operator. Master remains ON revision 11 and is checked server-side before each paid dispatch; no global toggle. Navigator stays anonymous: no account, entitlement or project storage. Existing **$10/UTC-month**, **2 requests/minute and 5/day per visitor**, **20/day per IP**, **1 in flight per visitor / 2 globally**, signed continuation/replay protections and conservative uncertain-usage handling remain unchanged.

Canonical November spending is 1315 micro-USD, reserved=0; completed canary guard hold=0. Do not reset either ledger or any journal. Shared $10 spending pool and shared visitor limits are explicitly **deferred until the next AI-light Coach integration**. Tree/Process budgets and credentials are untouched.

Protected platform/Tree/Process live versions remain **5/18/6**, with exact alias revisions in the plan. Preserve all their application, authentication, Administrator MFA, session and project behavior. No Production, Tree, Process or shared BFF deployment.

## Focused hosted acceptance after approval

Hosted activation checks are **pending**, not claimed passed before publication. Use one isolated anonymous browser, with project/account/authentication mutations and other Coach paid routes blocked.

- Desktop 1440px and mobile 390px; quick 1024/768 resize checks. Confirm Navigator placement, all six sections/launch states, no overflow, six bottom-right Play controls, keyboard/Escape/dialog focus and reduced-motion behavior. Opening/closing Navigator must not request AI.
- Check Explore/Homepage direct navigation and refresh, existing header/Guest access and one existing podcast playback. Spot-check Tree/Process Guest landing and return navigation; do not repeat unchanged login/MFA, Save/Open or recovery suites.
- One real anonymous bootstrap/cookie exchange and **at most one** real Navigator first-turn send. Fixed non-sensitive workshop scenario is pinned in the plan. No follow-up send, automatic retry or second four-turn canary. The browser guard permits only the one exact turn request.
- **Proposed additional paid smoke allowance: $0.003 maximum**, included in the requested activation approval. Exact pinned first-turn provider request is 4975 UTF-8 bytes, with existing 1500-output-token cap and computed conservative reservation **1500 micro-USD ($0.0015)**. Capture canonical spending/reservations before and after; no reporting API exposes keys or raw cookies. Stop on errors, uncertainty, held usage, unexpected metering or competing traffic; preserve records and do not retry or invent an invoice charge.
- Recheck owned runtime/HTML versions, public routing, master ON and protected application aliases. Record screenshots and the actual bounded smoke result in Issue #11.

## Conditional rollback

Use the proven immutable-asset/conditional-HTML and Lambda alias procedures. Distinguish mutation acknowledgement from stable completed revisions; verify the expected operation in existing CloudTrail, exact code/configuration and stable ready reads before accepting ownership. The `d86d193` paid-canary executor is not an activation command: its Code-only operation assumptions must not be used for an Environment update.

On failure, first conditionally move **only the release-owned Navigator alias** back to immutable OFF version 1, using its acknowledged current alias revision. This stops new Navigator dispatches without toggling the global master; already dispatched calls cannot be recalled.

Restore captured original HTML bytes/metadata using `If-Match` only after current VersionId, ETag, release/write metadata and content hash prove ownership. Preserve all hashed assets. If the private enabled flag was changed and its completed revision/configuration are still release-owned, restore only that flag to false conditionally; verify the original configuration hash `e9e7af1b2c1560560dea073e00ab2268738540454a59ab39581fa86bb4184349`. Perform one scoped rollback invalidation if HTML was restored. Do not overwrite a foreign release, retry an uncertain mutation, delete versions/credentials or refund uncertain spending. Stop for read-only reconciliation if ownership is ambiguous.

Rollback HTML was retrieved by its exact version and SHA-256 verified. Runtime OFF1 remains available; actual private-code restoration was successfully exercised by the accepted canary. No activation or rollback write was performed during this preparation.

## Approval boundary and costs

Requested approval covers this **single Alpha activation**, its nine publication mutations, focused non-destructive hosted checks, one paid smoke capped at $0.003, and conditional rollback if required. No further architecture or routine-step approval is proposed. If approved, repeat exact target/source/state checks, execute once, and report the outcome. No merge, Production release, account/project changes or expansion of scope is included.

No new fixed service cost. Ordinary existing Lambda/API/DynamoDB/S3/CloudFront/SSM requests, release storage and invalidation usage apply; these are not invoice-reconciled. $10 limits Navigator AI consumption, not all possible AWS traffic charges. Public anonymous use after activation remains subject to the existing $10 monthly limit.

[Reference pattern for future AI-light Coaches](AI_LIGHT_COACH_REFERENCE.md) records what to reuse and what remains deferred. Existing accepted source, not new generalized infrastructure, is the basis for this launch.
