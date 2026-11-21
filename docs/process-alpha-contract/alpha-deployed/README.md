# Decision Process Coach: first controlled Alpha deployed

Date: November20,2026 (America/Chicago). Hosted URL: https://d6owpirihdsus.cloudfront.net/process/ . Guest workbook is available; AI is DISABLED. Explore still shows Coming Soon. No production or DNS changes, merge, paid OpenAI call, or live email-code test.

## Reviewed source and actual rollout

Process source `db4a554248fef3fd601401370e6c98797163b22c` on codex/process-alpha-platform-integration applies only the separately approved allExcept forwarding and exact SSM configuration on top of reviewed43a29b1. Homepage/BFF runtime source remains `b097a787d652d093bfb72f0f70303518b06ec876`. Both isolated branches pushed; no default-branch merge. Workbook, prompts/scoring and file schema unchanged.

The failed Process stack was ROLLBACK_COMPLETE. Direct service checks proved no retained usage table, runtime role or function existed; only the failed empty stack record was removed. No retained data was deleted. The two successful shared resources were reused unchanged (route db6s346 and existing scoped permission); no duplicates.

Revised AWS change set `retry-alpha-20261121-db4a554` contained exactly12 Add actions, no replacements/modification of unrelated resources, AIEnabled=false, SessionContractVerified=false. Reviewed before execution; stack is CREATE_COMPLETE. New Process API ZIP staged create-only with source/hash/S3 version; existing frontend files verified byte-identical and not overwritten.

Shared CloudFront delta was constructed from fresh config and ETag. Removing its two new origins/three new behaviors and reversing only the source-pinned Alpha platform origin yields the previous config exactly; verified again after deployment. Existing Tree, Explore rewriting/security policies, Admin, default behavior and other distribution settings preserved. CloudFront status Deployed. Process-only invalidation I6BXP4056MTW4AC3Y7VJ1USN4B completed the new-path publication.

BFF code updated to reviewed package, existing handler index.handlerEntry/role/timeouts unchanged. Effective LIVE environment was preserved: unpublished $LATEST omitted RELEASE_B_EMAIL_ENABLED, so copying $LATEST would have regressed existing authentication. The published version preserves live flags and adds only PROCESS_SESSION_ENABLED=true. Conditional alias move4->5 used captured revision; Tree remains version17 and its frontend origin unchanged.

## Actual resources

Process stack: arn:aws:cloudformation:us-east-1:771049112957:stack/decisionprocess-alpha/d8f62040-e54c-11f1-9b3d-12ffe237e6cb.

- Lambda decisionprocess-alpha-api, version1/live;512MB ARM,80s, reserved concurrency3.
- Function URL https://xfn2ffdvfjtycxmdwp4dvwqbne0gyzsc.lambda-url.us-east-1.on.aws/ (AWS_IAM; direct unsigned access denied).
- Runtime role decisionprocess-alpha-runtime; log group /aws/lambda/decisionprocess-alpha-api,14-day retention.
- Usage-only on-demand encrypted table decisionprocess-alpha-usage, retained on rollback; no projects or identity records.
- Lambda OAC E20HAUVZUE4EYS, always-sign SigV4.
- Origin request policy5b3427df-a863-4910-aefa-0fc34d69c444.
- Process entry CloudFront Function arn:aws:cloudfront::771049112957:function/decisionprocess-alpha-entry.
- Live alias, immutable version and TWO distribution-scoped Function URL/invoke permissions complete the12 resources.

Shared stack engent-process-alpha-shared remains CREATE_COMPLETE with exactly2 resources. Existing distribution E1C4AJI9FUE47B; BFF live5; Tree live17. No new bucket, pool, API, certificate, project store, NAT, Secrets Manager service or KMS key. Exact identifiers/policies/source hashes in final-inventory.json.

## Credential configuration — METADATA ONLY

Owner-created `/decisionprocess-alpha/openai-api-key`, account771049112957/us-east-1, SecureString, Standard, version1, text, alias/aws/ssm. Metadata verified using DescribeParameters and DescribeKey only. We did NOT call SSM GetParameter, decrypt, retrieve, display, copy or log the value. No Tree/development/production credentials modified.

Process entry references this exact name and expects the raw key in the SecureString, not the former JSON credential object. Future read occurs server-side only after authentication and both feature gates. IAM grants GetParameter only its exact ARN; KMS Decrypt uses the existing managed key with ssm.us-east-1.amazonaws.com ViaService and the exact new parameter encryption context. No parameters-by-path or wildcard credential grant. Deployed-role simulation with explicit KMS context allowed the Process parameter and denied the tested Tree parameter; no attached managed role policies. Simulations do not prove successful decryption/provider authentication, neither of which was attempted.

Both AI_ENABLED=false and SESSION_CONTRACT_VERIFIED=false verified on deployed version1. The API's mode=live identifies the hosted adapter, not permission to use AI; aiEnabled=false is authoritative. Existing development ledgers are untouched.

## Hosted security findings

allExcept excludes Host and Authorization. Only __Host-engent-email cookie is allowed; query forwarding none; API uses the existing managed CachingDisabled policy, always-sign OAC and dual SourceArn-scoped permissions. Viewer Authorization is not used as identity. Lambda trusts system-provided invokedFunctionArn/requestContext, never header lookalikes; subject and role come only from signed server-to-server session verification, not request headers/body. Viewer-supplied Origin and fetch metadata serve only rejection checks, never authorization grants.

Actual no-cookie security results:
- Status200: guest, aiEnabled=false.
- Valid exact UTF-8 hash (including non-ASCII text):401 at application authorization. This proves the signed POST reaches the application without relaxing Guest access.
- Missing hash403 and tampered body403: rejected by origin signature validation before application authorization.
- Forged identity/trusted-context-lookalike headers401; no privilege granted.
- Wrong Origin403; direct Function URL GET/POST403; unsigned internal IAM route403.

Independent application hash mismatch, feature-gate and forged-header defenses also covered offline. No synthetic successful AI responses were substituted in hosted acceptance. Positive authenticated-cookie transport, real Student root revocation and actual paid execution remain untested gates, not inferred from these Guest results.

## Hosted Guest acceptance and visual inspection

Actual Edge1280x900 and390x844, fresh anonymous contexts. Automatic Guest, AI actions disabled; local JSON Save/download and Open/import; refresh recovery; deterministic ratings75/50; Objectives/Analysis/Human Judgment navigation; Decision Review/PDF export; /process/fonts/NotoSans-Regular.ttf200; direct deep link and refresh; no document overflow. All browser POSTs/external origins blocked and NONE attempted. No console page errors or unexpected HTTP failures. Tree's expected anonymous /api/session401 is explicitly classified, not hidden.

Both Process screens visually inspected. Existing Explore illustration/title/description/podcasts/ComingSoon and section anchor preserved; Tree Decision Map loads; Alpha Homepage1.1.0 header/main content loads without POST. Tests use synthetic local projects, not user project data; nothing autosaves to S3. Hosted tests force portable JSON download/import; native file-handle permission prompts are not retested with real OS pickers and retain previous offline coverage.

Prior test setup used an invalid rating label, correctly rejected by file validation; corrected to the approved vocabulary. No product validation was weakened. Offline Process146/146 and6 policy simulations passed before deployment. Reproducible no-sign-in/no-AI hosted scripts are scripts/test-process-alpha-guest.mjs and scripts/test-process-alpha-security.mjs, gated by --approved-alpha; set PROCESS_CHECKOUT. Evidence/screenshots adjacent.

## Cost and remaining gates

Actual OpenAI calls/spending0. Standard parameter and existing managed SSM key introduce no new fixed service. New Lambda has reserved, not provisioned, concurrency; DDB on-demand and usage-only;14-day logs. Existing bucket/distribution/API reused. Staged artifacts roughly70MB including retry ZIP; S3 storage is only a few tenths of one cent/month at Standard assumptions. For a small Guest pilot allow about$1–3/month incremental AWS usage depending on traffic/logging, before applicable free tiers; not a measured billing total or hard AWS cap. AI operating limits remain$10/month/$1globalday/$.50Studentday,50 requests/day,6 starts/minute,1Student/3global, but AI is OFF.

Before enabling AI: explicit approval for genuine hosted shared-session/return/revocation tests; positive signed Process-role session transport and cookie behavior; actual DynamoDB atomic limits/concurrency/timeout recovery validation; credential read/decryption/provider authentication under separate approval; reverify pricing/reservations; bounded paid-test authorization. The configured monthly cap is not spending authorization. No60-second model-duration call was run;80/90/95s configuration verified only. Explore activation is a later Homepage-owned action after acceptance. Native picker permissions also merit owner acceptance.

## Guarded rollback

Disable Process AI/session gates first if unsafe (AI already off). Capture FRESH edge config/ETag and BFF alias revision; verify current ownership/source matches this release. Restore ONLY Process edge additions and the captured Alpha platform origin, not an old whole config over other owner edits. Conditionally move BFF live back to captured version4 if no later owner update, preserving unrelated roles/data/sessions; old code ignores expiring navigation intents. Keep Tree/version17 untouched. Remove only owned Process routing/associations as needed before separately approved resource cleanup; retain usage table, credential and audit records. Never refund unknown usage/reset counters or delete user/local files. Staged immutable assets can remain. Rollback is documented, not exercised against the now-working Alpha.

Final Homepage regressions:126/126 passed; paired offline contract replay against Processdb4a554 passed with six local signed transports and zero network/provider calls. BFF live5 flags SHARED_AUTH_ENABLED/RELEASE_B_EMAIL_ENABLED/PROCESS_SESSION_ENABLED all true; Process-only invalidation Completed.

Screenshots: [Guest desktop](process-1280.png), [Guest mobile](process-390.png), [preserved Explore](explore-1280.png), [Alpha Homepage](homepage-1280.png).
