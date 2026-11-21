# Navigator Alpha — default-OFF installation and non-paid results

Completed under the owner's pasted approval reviewed against `b232ed5`. **Infrastructure is installed; Navigator is not publicly activated. No paid OpenAI call was made.** Hosted backend control suites passed, while actual CloudFront viewer-IP attribution and browser end-to-end bootstrap/cookie acceptance remain open. Existing Alpha applications, Production and Administrator master AI ON remain unchanged.

## Installed release

- Runtime source: `934f2fd837423c45d77082566ba5f55a50df4771`; approved documentation: `b232ed50c57d7a0f3e34254fe6b5912d200ed1a5`.
- Installation ID: `navigator-off-install-0cf387d7-a34f-47a5-8fed-7785697704f4`.
- Account/region: `771049112957` / `us-east-1`.
- Stack: `arn:aws:cloudformation:us-east-1:771049112957:stack/decisionnavigator-alpha/27182430-e5de-11f1-82be-0effda8861bf`, **CREATE_COMPLETE**.
- Reviewed/executed change set: `arn:aws:cloudformation:us-east-1:771049112957:changeSet/navigator-off-install-0cf387d7-a34f-47a5-8fed-7785697704f4/140b1a1c-0b82-4520-87b9-24712624da61`.
- Template SHA-256: `4decf69983f693b70a491c9b583d6983df13620b6259c4623bee56c60ba576c6`.
- Pinned ZIP SHA-256: `1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac`; base64 `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`.
- Existing artifact bucket: `decisiontree-alpha-artifacts-771049112957-us-east-1`; key `releases/decisionnavigator-alpha/934f2fd837423c45d77082566ba5f55a50df4771/navigator-alpha-1d1d2a0823bcc268b1dc564d076f02f8275af3eb1136a626055f643c2514f9ac.zip`; immutable version `qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n`.

Preflight verified the source, ZIP, current application HTML versions, existing aliases, CloudFront configuration, route inventory, principal permissions, new-resource absence and concurrency headroom. The create-only artifact write was followed by versioned download/hash verification. The actual change set contained **exactly ten Add operations**, no replacement/removal or unrelated modification. Before execution, ownership was checked using the acknowledged stack/change-set IDs and change-set release tags. AWS review-stage stack tags were empty until execution; an initial local guard assumption was corrected after read-only reconciliation, before execution.

Exactly the reviewed ten CloudFormation resources were created, plus the separately approved HMAC parameter:

- Lambda `decisionnavigator-alpha-api`: Node.js22, 256MB, 29 seconds, reserved concurrency **2**.
- Immutable version **1**, alias **live → 1**, no routing weights; `STAGE=alpha`, `NAVIGATOR_ENABLED=false`.
- IAM role `decisionnavigator-alpha-runtime`, with the reviewed scoped inline policy and no managed policies/permissions boundary added.
- Log group `/aws/lambda/decisionnavigator-alpha-api`, 14-day retention.
- Existing API `8qmgd1ghdi`: new integration **5wsf6z0**, targeting `arn:aws:lambda:us-east-1:771049112957:function:decisionnavigator-alpha-api:live`.
- Bootstrap route **gs0ljeu**, `POST /api/platform/navigator/session`; turn route **m2ova17**, `POST /api/platform/navigator`; two exact route-scoped invoke permissions.
- `/decisionnavigator-alpha/hmac-secret`: Standard SecureString, version **1**, `alias/aws/ssm`. Generated from 64 cryptographically random bytes entirely in memory and created without overwrite. No value, derivative signing secret or secret fingerprint was printed, logged, committed or put in deployment artifacts.

The existing `/decisionnavigator-alpha/openai-api-key` remains Standard SecureString version1 with `alias/aws/ssm`; its value was never retrieved. No second OpenAI credential was created. Actual IAM simulations deny HMAC access to the existing Alpha BFF, Tree and Process runtime roles. The new role's fourteen allow/deny simulations pass. Real hosted HMAC read/decryption and projected master reads subsequently succeeded under the new role, without exposing the HMAC value. OpenAI raw-key format and provider/model access remain unverified.

See the [sanitized exact resource/version/test receipt](installation-evidence/receipt.json), [actual-role simulations](installation-evidence/actual-role-simulation.json), and unchanged [reviewed template](../../infra/navigator-alpha/proposal.yaml).

## Hosted non-paid backend acceptance

The public alias stayed on immutable OFF version1 for the entire test. Only the new function's **$LATEST** code was conditionally swapped to a reviewed provider-blocked harness and restored afterward. No test version, alias change, route retargeting, role widening or additional resource was needed.

Harness provenance: Navigator chat commit `504635b`; ZIP SHA-256 `6183b236fb408b14e0ac9dddb9a274c2cc8147b5c124177e45cb20ff20c3cfd6`. The builder pins the runtime, protocol, budget, store and canonical master modules to reviewed `934f2fd`. The artifact excludes the OpenAI transport and OpenAI parameter path. It accepts only direct IAM-authorized `$LATEST` invocations with one fixed suite name and rejects aliases, numbered versions, API Gateway events and enabled configurations before dependency access. Its only secret read is HMAC, used in memory to derive an acceptance-only secret that cannot mint public-runtime cookies.

All **three suites passed once each** on real Lambda/DynamoDB/SSM under the installed role:

1. **Protocol:** exact-Origin/method/route denial inside the handler; anonymous bootstrap; host-only Secure/HttpOnly/SameSite=Strict cookie attributes; cookie reuse/forgery; caller-bound and transcript-bound continuations; replay rejection; four-turn closure; a real strongly consistent master ON read before each mock dispatch; known-usage settlement in synthetic state.
2. **Limits:** 2/minute and5/day visitor limits; per-IP denial and another synthetic IP succeeding; $10 cap denial with an isolated monthly row seeded at9,999,999 microdollars; per-visitor and global held-lease concurrency denial; reservation settlement. These use a controlled test clock and documentation-range IPs; they do not prove actual viewer-IP attribution or multi-container load behavior.
3. **Master/outcomes:** real ON integration for admitted mock calls, plus explicitly injected OFF/missing/invalid/read-error/master-timeout fixtures; zero mock dispatch under those fixtures; simulated unknown provider outcome charged conservatively; consumed continuation rejects redispatch. No actual global OFF change or OpenAI network timeout was induced.

All writes were scoped to fresh `NAVIGATOR#acceptance#<run>#<scenario>#... / STATE` records, with one-hour TTL. No canonical budget/replay/session/project/entitlement row was written. The canonical November ledger was captured before/after and remained identical. Synthetic rows were left to expire; no real spending ledger was reset or refunded. No test decision, cookie, continuation, HMAC or provider credential was returned in the sanitized receipts.

The temporary harness was installed/restored with fresh RevisionId conditions and digest/ownership checks. **Restoration was exercised successfully:** `$LATEST` returned to the reviewed ZIP, final revision `265f216e-c56d-480f-82e6-89610f695007`. Public `live` stayed version1 with revision `40267485-ed37-4a71-adbc-4a6c36ebb483`; its code/configuration were unchanged. No invocation was retried automatically. The [harness source/procedure](../NAVIGATOR_ALPHA_NONPAID_HARNESS.md) and focused four-test offline suite are retained for reproduction.

## Public boundary and browser regressions

[Five real HTTP probes](installation-evidence/public-off-results.json) through CloudFront and direct API Gateway verified both new routes return the expected **503 default-OFF** response, `Cache-Control:no-store`, and no cookie. A foreign-Origin probe also remained denied. These prove the installed OFF boundary/routing, not a successful browser bootstrap or active handler Origin/CORS flow.

[Existing-application browser checks](installation-evidence/hosted-results.json) passed at1440/1024/768/390, plus native desktop resizing, for16 scrolling/layout measurements, navigation, Process direct navigation/refresh/Guest access and hosted podcast play/pause. All authentication/project writes, external requests and paid AI were blocked. No such write was attempted. The candidate Navigator UI retains its earlier four-width accessibility/reduced-motion/dialog/control tests, but it was **not published** during installation.

Final protected-state checks confirm:

- Existing platform/Tree/Process aliases remain **5 /18 /6**; their code/configuration and existing API routes were not modified.
- Administrator master remains **ON**, `suspended=false`, revision **9**. No MFA, sign-in, account or entitlement change was made.
- CloudFront configuration and existing website/Process HTML versions remain `WCRidCoVSP8bibymptKxPZ6XWtdKAQUS` / `OkuPZc3xyU.shza5hbTTBqCg.Oxm.Gw0`.
- No frontend publication, invalidation, DNS, Cognito, Production, Tree/Process application or existing-role modification occurred. No paid OpenAI call or OpenAI-key read occurred.

## Costs and rollback readiness

The cost model is unchanged: no new fixed recurring service fee is expected; Lambda/API/DynamoDB/SSM/log/storage requests incur normal usage charges. The infrastructure has no provisioned concurrency, new custom metric, paid alarm, table, NAT or load balancer. **Navigator model spend for this milestone is $0**; AWS usage has not been reconciled to an invoice. The independent $10 monthly AI ledger remains intact and is not an AWS-traffic cost cap.

Safe baseline is the installed immutable **version1 OFF**. The temporary-code restoration was tested. Any future rollback must verify the current alias/function/route ownership and revisions before restoring version1 or removing only release-owned route additions. Preserve HMAC, OpenAI parameter, canonical spent amounts and uncertain holds. Do not delete the stack, shared rows or credentials as routine rollback; do not touch BFF5, Tree18, Process6, CloudFront, Cognito or the master. Restore website HTML only if a future activation actually publishes it and its then-current version is release-owned.

Private operator journals, exact AWS acknowledgements, pinned ZIPs and conditional installer/harness controllers are retained under `.artifacts/navigator-install-20261121/` and the Navigator chat's `.artifacts/navigator-alpha-acceptance/`. They contain no HMAC or OpenAI values.

## Remaining gates requiring separate scope/approval

1. **Actual client IP through CloudFront:** not verified. Public OFF responses expose no attribution; direct harness calls use synthetic IPs. The Alpha API currently has no access logging, and the account has no log resource policy. A confined observer/logging window requires a separately reviewed destination/delivery permission and temporary stage change. It can record IPs from other Alpha traffic, so it was not silently added under the ten-resource installation approval. Correlate controlled requests with independently known network egress addresses; different observed IPs alone do not prove viewer attribution. [AWS describes sourceIp as the immediate TCP peer](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-logging-variables.html). Never trust arbitrary forwarded headers as a fallback.
2. **Browser end-to-end anonymous cookie/continuation flow:** positive cookie behavior was tested inside the deployed harness, not through the public OFF route/browser. Close this with a separately reviewed, provider-blocked confined path; do not publish a mock/nonfunctional Navigator or repoint public routing to a test harness.
3. **Actual Administrator global OFF/ON:** intentionally not executed. It briefly affects new paid dispatches for Tree/Process too and requires the separately coordinated approval in the owner's instruction. Fixture OFF/missing/error tests are not a substitute for that global test.
4. **Credential compatibility and paid AI:** the value/model access of the existing OpenAI parameter remain untested. The separate [bounded paid-canary plan](PAID_CANARY_PLAN.md) proposes at most four sequential sends and $0.03, but no paid allowance or activation is authorized. Its durable metering/transport guard still requires implementation/review before execution.

The approved installation and feasible provider-blocked backend checks are complete. End-to-end acceptance and final AI-enabled Alpha publication are **not yet complete**. Keep the reviewed Navigator dialog/artwork/Explore/control changes ready for the later single coordinated activation, rather than publishing them nonfunctional now. Draft PRs remain unmerged.
