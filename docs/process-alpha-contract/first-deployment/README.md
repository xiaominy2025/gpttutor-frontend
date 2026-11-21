# First controlled Alpha deployment: paused before publication

## Result

Process is NOT hosted at /process/ yet. Execution stopped at the required material-change boundary. No CloudFront configuration, BFF code/alias, Tree, production, DNS or Explore activation was changed. No credentials were provisioned, live email codes requested, or paid AI called. Owner specifically instructed that no development/production key be reused; a dedicated SecureString remains deferred.

Both reviewed commits were pushed to isolated branches: Homepage b097a787d652d093bfb72f0f70303518b06ec876 (`codex/process-shared-platform-contract`) and Process43a29b11ba903070cd5da24e90b9995c8078a52f (`codex/process-alpha-platform-integration`). No merge.

## Reconciliation, review and actual writes

Live Alpha account771049112957/us-east-1 matched the captured baseline: CloudFront E1C4AJI9FUE47B ETagE2X3YF2TXT154O, BFF live4, Tree live17, unchanged origins/behaviors. No Process resources/parameter/route existed. Bucket versioning enabled and artifact prefixes absent. No unexpected edge drift.

50 immutable source-hash-verified objects (66,151,502 bytes total) were uploaded create-only to isolated prefixes in `decisiontree-alpha-staging-frontend-vnhhrwadnpad`. No prior objects overwritten. API ZIPs are outside CloudFront-readable releases/*: `artifacts/decisionprocess-alpha/43a29b11ba903070cd5da24e90b9995c8078a52f/api.zip` and `artifacts/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876/api.zip`. Frontends staged under reviewed Process/platform release prefixes, not activated.

Actual change sets were generated and reviewed before execution: `decisionprocess-alpha` exactly12 Add actions; `engent-process-alpha-shared` exactly2 Add actions; no replacements or existing resource modifications. Parameters AIEnabled=false and SessionContractVerified=false. Both were executed within the approved plan.

Shared stack CREATE_COMPLETE: IAM route `db6s346`, POST /internal/coaches/process/session on API8qmgd1ghdi -> BFF integrationpnnbk27; exact BFF Lambda invocation permission `engent-process-alpha-shared-ProcessSessionInvokePermission-VxWD9VfS8Gvz`. BFF remains version4 and does not yet implement the new contract. Unsigned calls deny403. These two source-owned additions remain staged; no need to recreate them on a future retry.

Process stack ROLLBACK_COMPLETE. CloudFront rejected the OriginRequestPolicy allowlist containing x-amz-content-sha256 with HTTP400. This service-side constraint was not caught by ValidateTemplate, policy simulation, offline tests or change-set generation. The original preparation was therefore insufficient to prove that forwarding configuration deployable.

The transient Process entry function, Lambda OAC and log group were deleted by CloudFormation rollback. Usage table is marked DELETE_SKIPPED in stack metadata due Retain, but a direct DynamoDB DescribeTable returned ResourceNotFoundException; do not mistake the physical-name metadata for a verified surviving table. No Process Lambda or role was created. No manual cleanup or data deletion was performed. Exact events, change sets and resource identifiers are in adjacent JSON evidence.

A separate package metadata error was identified before BFF deployment: manifest/proposal said index.handler, while the bundle exports handlerEntry and the live function uses index.handlerEntry. The intended deployment would preserve the existing handler. Local packager/proposal metadata is now corrected; reviewed runtime source is unchanged and no BFF update occurred.

## Required revised forwarding review

Do not simply remove payload hashing, weaken authorization, or silently substitute all-cookie forwarding. AWS documents that Lambda Function URL POST/PUT requires the client body hash: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html .

A proposed alternative is custom header behavior allExcept with Host and Authorization excluded, retaining only __Host-engent-email in CookiesConfig, no query forwarding, disabled caching, always-sign OAC and application body-hash verification. AWS documents allExcept as a valid policy mode: https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginRequestPolicyHeadersConfig.html . This could retain the12-resource count, but BROADENS viewer-header forwarding compared with the reviewed strict allowlist. It requires owner approval and service/end-to-end verification; it has NOT been applied or claimed proven. See infra/process-alpha/forwarding-revision.proposed.json.

After approval, reconcile final failed-stack/retained-resource state again, prepare an explicit failed-stack recovery/recreation plan without deleting data, review the revised actual change set, and test hashed/missing/tampered POST/direct-origin denial with AI OFF before further rollout. Keep the already-created shared route/permission; do not create duplicates. Fresh config/ETag and alias revisions must still be rechecked before BFF/edge updates. No arbitrary whole-distribution rollback or Tree change.

## Verification and remaining gates

After rollback, existing Tree root, Explore, and Homepage Alpha documents all returned200. Platform/session and shared/email/status returned signedIn:false without cookies. The new private route rejected unsigned POST403. CloudFront ETag and BFF4/Tree17 aliases remained unchanged. No existing user sessions or project data were read or changed. These are public smoke checks, not live email authentication.

Process static assets/navigation/refresh/fonts/Save/Open/Guest/API-origin checks remain NOT RUN hosted, because /process/ was not published. Existing offline results remain valid as offline evidence only. No live SSO or paid AI acceptance was attempted.

Cost: actual OpenAI spending$0. New API route/permission have no fixed monthly charge.50 S3 PUTs and ~66MB staged storage imply roughly$0.00025 request cost and ~$0.0015/month storage at ordinary S3 Standard assumptions, before applicable free tiers. Temporary CloudFront resource creation does not imply request traffic. These are estimates, not an AWS billing measurement; no paid AI or provisioned capacity enabled.

Remaining approval: revised header-forwarding security scope and the reviewed retry/recovery plan. Dedicated Alpha credential and any future genuine SSO/paid-AI acceptance remain separate gates. Do not treat this report as deployment success.

Local verification after recording the failure and metadata correction: 126/126 platform tests passed; focused proposal/metadata checks 4/4 passed. No runtime-source change was introduced by this report.
