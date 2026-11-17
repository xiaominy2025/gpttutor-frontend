# Shared authentication implementation and approval package

Implements [Engent Labs Issue 6](https://github.com/xiaominy2025/gpttutor-frontend/issues/6) and the approved policies in [Decision Tree Issue 13](https://github.com/xiaominy2025/ai-decision-tree/issues/13). This package is for code review and local testing. AWS execution requires the owner's next approval.

## Reconciled baselines

Frontend starts at published `2e855f7d9937a038ed22e47bbe4e50949bd58f0c`. The release receipt records index SHA-256 `5A3A447F79AD28B3206F08D6666598CD548CBB18E0ACE234C5A4F9869B95EFDC`; live www references `index-H-cv3Vta.js`. Default main and the detached old review checkout are older. Changes here add optional account and Navigator UI only on /explore.

Fresh read-only metadata on November 17 confirms production Tree Lambda live version 2 describing `ee91caffcf4a77854073d97934c8978458af773d`, and Alpha version 10 describing `0c6a786c009398ec6aa15982ffdb20836a19d4ce`.

Comparison of those exact source commits found identical Cognito integration, persistent sessions, account entitlements, Administrator MFA, project recovery and AI usage controls. Production adds hosted health semantics, explicit production credential-source validation, infrastructure/release tooling, and tree draft monetary-unit and branch-cost instructions. The shared-auth Tree branch starts at production, which contains the Alpha playback improvements in its ancestry, and preserves all these differences. Apply that common code baseline to isolated Alpha before production rollout. Distinct pools, tables, keys, origins and budgets are intentional environment differences.

## Implemented flow

The public homepage continues to render without platform sign-in. `VITE_SHARED_AUTH_ENABLED=true` adds optional account entry and Navigator to /explore. The platform API also needs `SHARED_AUTH_ENABLED=true`; Navigator has its own `NAVIGATOR_ENABLED` gate. All default to disabled.

Authorization uses code grant, S256 PKCE, state, nonce and a five-minute server transaction bound to a Lax host cookie. Tokens stay server-side in the TTL state table. A separate Strict host session cookie lasts at most 30 days, refreshes access tokens server-side and cannot be resurrected by a concurrent logout. Exact issuer, client and token use are verified. Successful token exchange is followed by the existing Tree account-directory checks. Subject IDs, existing verified accounts and project ownership continue to use the existing pool.

Tree's separate draft implements its own host session with its OAuth client and retains direct email OTP and existing sessions. Existing Administrator pool, MFA and management routes use their existing flow. Platform session display grants only Student platform permissions; Tree Advanced is an explicitly Tree-scoped entitlement. Every signed-in platform request and Tree protected request checks the authoritative account status. A suspended account receives a denial.

Sign out of this tool clears that server session and attempts refresh-token revocation, then ends the managed-login browser session. Other coach sessions can remain active. No global sign-out is claimed.

## Navigator accounting

Navigator uses only its own Standard SecureString. The private JSON value has OPENAI_API_KEY and an independently random IP_HMAC_SECRET of at least 32 characters. No provider credential is embedded in frontend assets, Lambda environment variables, logs or this repository.

The UTC monthly admission cap is $10, with no rollover. A single atomic transaction reserves the monthly amount and global, actor and IP allowances. Guest defaults are five replies per day, two per minute, one concurrent and 20 per IP per day. Account defaults are 20/day, five/minute and one concurrent. Global concurrency is two. Configuration is server-owned. Messages are bounded to 2,000 characters, history to six messages of 1,000 characters, and total provider output to 400 tokens. The request token upper bound uses UTF-8 bytes plus framing and configured prices.

Reservations settle against their admission month even across midnight. Repeated settlement is idempotent. Unknown usage, network failure and crashed workers retain or charge the full reservation. Expired concurrency leases release concurrency but never refund uncertain spend. An unexpected cost above reservation pauses that month's state. Storage or pricing failures deny requests. No provider retries are enabled. User daily limits count admitted attempts, including ambiguous calls.

Metrics trigger 50/80/100 alarms. Alerts use at-least-once metric delivery with a conditional per-month marker, so retries can repeat a metric without skipping a notification after a process crash. The 100 alert also indicates admission exhaustion when the remaining budget cannot cover a conservative reservation. This application budget cannot cap unrelated provider-key use, request/log/storage billing, or tariff changes.

## Resource proposal

`infra/platform/template.yaml` creates the following in us-east-1, in a new engent-platform-prod stack.

- One on-demand TTL DynamoDB table named engent-platform-prod-state, containing sessions and quota state.
- One AWS-prefix managed-login domain engent-platform-prod-771049112957 on the existing Student pool us-east-1_Ilf34btQ0. Managed login version 2 and default client branding support the existing passwordless methods.
- Two public OAuth clients named engent-platform-prod and engent-tree-prod-shared, plus their default managed-login branding. Existing confidential OTP client remains.
- One Lambda engent-platform-prod-api, arm64 Node 22, 512 MB, 28-second timeout and reserved concurrency two; runtime role engent-platform-prod-runtime and 14-day log group.
- One HTTP API, its default stage, integration/route and Lambda invocation permission.
- Three CloudWatch alarms and two usage metrics, using existing topic decisiontree-prod-AlarmTopic-aTZwTdkMddZO. Fresh read-only metadata shows no subscriptions. The proposal adds an email subscription with the owner-confirmed address as a deployment parameter; the owner must confirm the SNS email before alert acceptance.
- One separately owner-populated Standard SecureString /engent-platform-prod/navigator-credentials with alias/aws/ssm.

Platform client callback is https://www.engentlabs.com/api/platform/callback and logout is https://www.engentlabs.com/explore. Tree client callback is https://decisiontree.engentlabs.com/api/shared/callback and logout is https://decisiontree.engentlabs.com/. Scopes are openid, email and aws.cognito.signin.user.admin. Implicit grants are disabled. Client IDs are deployment outputs, never guessed.

The existing www distribution E1V533CXZPR3FL gains one custom API origin and /api/platform/* behavior. Cache policy is CachingDisabled (4135ea2d-6df8-44a3-9df3-4b5a84be39ad). Origin request policy is AllViewerExceptHostHeader (b689b0a8-53d0-40ab-baf2-68738e2966ac). Cookie and Origin forwarding support host sessions and CSRF checks. Keep existing origins, /test/*, SPA fallback and media paths. `scripts/platform-cloudfront.mjs` modifies only a saved config locally, refuses an existing conflicting behavior and leaves execution to the approved release.

Tree API eoszayfkqd gains only POST /internal/platform/entitlements protected with AWS_IAM. Its live Lambda additionally verifies the expected platform role identity, exact route, platform client token, verified email, stable subject and registration/entitlement rules. It returns only caller subject, enabled state and Tree Advanced/AI entitlement. The browser cannot choose an arbitrary account. The existing Tree runtime role gains DeleteItem only for SHARED#* session keys in its existing table. No platform role can read Tree tables, projects, admin APIs or Tree credentials.

## Exact IAM files

Run `node infra/platform/iam.mjs .artifacts/platform-approval` to generate literal JSON policies and Lambda/CloudFormation trust documents. Run `node scripts/platform-approval.mjs` to generate the proposed change manifest. These commands never call AWS. Runtime invoke ARN is exactly:

`arn:aws:execute-api:us-east-1:771049112957:eoszayfkqd/$default/POST/internal/platform/entitlements`

The runtime DynamoDB, SSM and logs grants name only the new platform resources. PutMetricData is restricted to Engent/Platform/prod. The AWS-managed SSM key uses its service default authorization; no broad explicit kms:Decrypt grant is added. Changing to a customer-managed key would require a separate exact key ARN, encryption-context and ViaService review.

The deployer can pass only engent-platform-prod-cloudformation to CloudFormation. Execution can pass only engent-platform-prod-runtime to Lambda. Exact CloudFront update rights name only E1V533CXZPR3FL, and the saved-config diff constrains the intended change. Runtime trust is lambda.amazonaws.com and execution trust is cloudformation.amazonaws.com. Deployer trust names the read-only-verified existing operator arn:aws:iam::771049112957:user/engentlabs-cli. It is included for the owner to review before IAM attachment. No administrator policy or parent-domain cookies are required.

New API IDs and OAuth client IDs are allocated by AWS. Initial API creation is restricted by the Application request tag and region. Subsequent API operations require the same Application resource tag. Effective child-resource tag behavior must be tested in isolated Alpha before permission attachment to production. Do not broaden to unrestricted API wildcards after a failure. Re-render the policy with the physical API ARN if a provider requires exact child IDs. CloudFormation provider calls, managed-login branding permissions and IAM tag conditions remain service-side validation gaps. Static IAM validation does not prove effective permissions.

The checked-in Tree SAM delta is the exact additive proposal for its stack. It preserves the direct OTP client and existing project/Admin resources. A real CloudFormation change set is intentionally not created here because that is an AWS write. After approval, package immutable artifacts, create unexecuted change sets, inspect every action and reject replacement of existing identity/data resources before execution.

## Cost estimate

At low pilot volume plan $0–$5/month incremental AWS, including approximately $0.90 gross for two custom metrics and three standard alarms before allowances, plus usage for Lambda, HTTP API, DynamoDB, logs and SES. Managed-login client/domain reuse introduces no new pool, custom certificate, NAT, WAF or dedicated KMS key. Cognito MAU allowances are account-wide. Navigator admits up to $10 per UTC month of conservatively estimated OpenAI usage and uses a separate credential from each coach. Prices, model access and notification destination must be verified before enabling paid Alpha tests.

Sources are [Cognito managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html), [IAM route authorization](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-access-control-iam.html), [API Gateway authorization resource keys](https://docs.aws.amazon.com/service-authorization/latest/reference/list_apigateway.html), [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/) and [SSM tiers](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html).

## Alpha, production and rollback procedure

1. Review both draft PRs, this resource manifest, literal IAM JSON, frontend source receipt and Tree baseline differences. Keep all feature flags off.
2. Obtain owner approval for exact Alpha changes. Reference the existing Alpha Student pool us-east-1_CipTwwDZb and Tree API 8qmgd1ghdi. Use engent-platform-alpha names, an Alpha-only Explore HTTPS origin, separate clients/domain, table, Navigator parameter, budgets and notification destination. Alpha backend must use the reconciled Tree commit. A missing Alpha site target is an environment prerequisite to supply, not permission to route Alpha to production.
3. Create and inspect unexecuted change sets and exact IAM attachments. Check role and callback isolation, default flags and absence of replacements. Execute only the approved Alpha changes. Save complete prior CloudFront config with ETag, immutable frontend files and Tree code/alias receipt.
4. Validate existing OTP sign-in, confirmed users without re-verification, first shared login and SSO launch, Guest manual tools, standard AI, Tree-specific Advanced, Admin MFA, project autosave/recovery and account isolation. Verify cross-site callback cookies, replay rejection, origin checks, sign-out and concurrent refresh/logout. Suspend a synthetic account and confirm immediate request denial. Use only separately approved synthetic users and paid calls.
5. Test Navigator actor/minute/IP/global limits, simultaneous reservations, UTC month rollover, uncertain provider outcomes, storage failure and alert delivery. Record configured prices and actual billed token usage. Review effective API child permissions and SSM decryption before production.
6. Obtain production approval. Use the exact same tested code and production-specific parameters. Add domain/clients and platform stack, then Tree routes with the old flow still present, then CloudFront behavior. Enable new backend routes before the optional Explore UI. Enable Navigator last after credential/limit/notification checks. No marketing homepage gate.
7. For code rollback, first disable the Explore feature flag and Navigator, then restore the prior frontend and Tree Lambda release receipts. Restore the previous CloudFront config with the current ETag if its diff remains confined to this feature. Existing user pools, subjects, data and original OTP clients persist. Keep TTL session records until natural expiry. Never delete users or projects as part of rollback. Re-run OTP/Admin/project recovery smoke checks.

## Local validation and outstanding checks

Unit/integration tests use mocked providers and an in-memory transactional store. They cover callback binding/replay, nonce validation, host-cookie attributes, concurrent logout/refresh, atomic budget admission, uncertain settlement in the original month, quota exhaustion, account suspension and unavailable storage. Tree tests cover IAM-route/caller rejection and caller-only entitlement results. Frontend and Lambda builds and template lint run locally.

Real Cognito managed login, cross-origin browser cookies, live existing-account/Advanced/Admin flows, SES, SSM/KMS decryption, exact effective IAM permissions, and paid model interactions require separately approved Alpha. The proposal is code-complete for draft review, with these deployment gates open.


### Proposed execution commands after owner approval

Build with `npm ci`, `npm run build:platform`, and `npm run build`. Copy production.example.json to a gitignored local parameter file and insert only deployment outputs and the confirmed notification address. Enter the Navigator credential JSON privately in SSM after approval.

Package the platform using the existing immutable artifact bucket and a new platform prefix. Use the scoped platform profile and pass the dedicated execution role. The following creates an unexecuted change set and therefore belongs to the next AWS approval.

```powershell
sam package --template-file infra/platform/template.yaml --s3-bucket decisiontree-prod-artifacts-771049112957-us-east-1 --s3-prefix platform/APPROVED_SHA --output-template-file .artifacts/platform-packaged.yaml --region us-east-1 --profile engent-platform-production
$platformParams = Get-Content .local-tools/platform-production-parameters.json -Raw | ConvertFrom-Json
$overrides = $platformParams.PSObject.Properties | ForEach-Object { $_.Name + '=' + [string]$_.Value }
sam deploy --template-file .artifacts/platform-packaged.yaml --stack-name engent-platform-prod --region us-east-1 --profile engent-platform-production --role-arn arn:aws:iam::771049112957:role/engent-platform-prod-cloudformation --capabilities CAPABILITY_NAMED_IAM --tags Application=engent-platform-prod --parameter-overrides $overrides --no-execute-changeset
```

The parameter overrides come from the reviewed local configuration JSON. That file contains resource identifiers and flags only. Execute the exact reviewed change-set ARN only after approval. Save its processed template, resources, ETag and rollback receipts. Tree updates use its separately reviewed SAM template and existing release tooling.

The distribution's existing 403/404 fallback maps to the marketing entrypoint. Platform handlers deliberately use 401 for denied requests and 410 for disabled/unknown platform features, preventing that fallback from turning an account/API failure into HTML with HTTP 200. No change to existing SPA error routing is proposed.

The November 17 SNS read shows the proposed existing topic has no subscriptions. The new confirmation-required email subscription in this template is required for alarm acceptance. Email delivery and any IAM provider-action gaps remain Alpha gates. The application resource manifest and literal policies are checked in under infra/platform/approval for review.

Final local verification: 56 platform tests pass, frontend and bundled Lambda builds pass, and SAM lint passes. Six IAM policy documents returned no Access Analyzer findings. Effective permissions and real browser/AI flows remain unverified until approved Alpha testing. External npm dependency audit was rejected by automatic approval review because it submits private dependency metadata; no audit pass is claimed.
