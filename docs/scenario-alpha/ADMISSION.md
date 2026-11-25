# Scenario Alpha admission handoff

Homepage/Platform owns this Alpha-only extension under Issue #11 comment 7151224917 and #25 comment 7151225631. Scenario owns its runtime and hosted acceptance. Production is untouched.

The composition entrypoint `navigator-scenario-alpha-entry.mjs` delegates all existing Navigator routes to the unmodified original handler. The original Navigator runtime, budget, store and entry source are identical to accepted `934f2fd`. No new signing secret, provider key, identity store, quota or spending allowance is introduced. Navigator remains live; replacing its alias requires exact code/configuration/revision preflight and retained immutable baseline.

## Browser and private caller contracts

- Browser calls existing POST `/api/platform/navigator/session` at `https://d6owpirihdsus.cloudfront.net` with credentials same-origin. It issues/reuses the existing 24-hour `__Host-engent-navigator` cookie, Secure, HttpOnly, SameSite Strict, Path `/`. No provider calls or budget writes. Existing Student authentication remains optional and separate; a signed-in visitor uses this same anonymous proof for AI-light access.
- Scenario's public runtime must enforce the exact Alpha Origin, exact route, request bounds and API Gateway request context before forwarding. Forward the server-observed `requestContext.http.sourceIp`, never a browser JSON IP or unverified forwarding header. Hosted source-IP attribution must be checked on Scenario's actual route before paid dispatch.
- Private POST `https://8qmgd1ghdi.execute-api.us-east-1.amazonaws.com/internal/coaches/scenario/ai`, signed with SigV4 service execute-api/us-east-1 by `arn:aws:iam::771049112957:role/scenario-alpha-runtime`. AWS_IAM route plus handler verifies exact STS assumed-role userArn, API, stage, method and route. It is not a browser route.
- Bodies are <=16 KiB. No request/response logging of cookie, IP, actor, key, signing material or opaque lease. Errors are no-store. Secrets never leave platform proof validation. The runtime separately reads only `/decisionnavigator-alpha/openai-api-key`, raw SecureString, via its exact approved ARN; this adapter grants no SSM permission to Scenario.

Operations (JSON):

1. `verify`: `{operation:'verify', origin, cookie, sourceIp}`. Returns verified/coach/environment only. Verifies proof and current master without quota writes.
2. `master`: `{operation:'master'}`. Fresh strong master check, returns enabled true or 503. Never caches ON.
3. `admit`: proof fields plus `requestId` UUIDv4, `model:'gpt-6-luna'`, `requestBytes` actual serialized provider payload <=24576, `maxOutputTokens:640`. Runtime must enforce <=4096 input tokens via the accepted conservative UTF-8/framing bound. Server-fixed prices .125 input/.5 output micro-USD/token, reservation **832 micro-USD**. Returns admitted, opaque leaseId, reservationMicros, noRetry. Duplicate IDs are rejected, including uncertain/pending admissions.
4. `dispatch`: `{operation:'dispatch',leaseId}`. Immediately before one provider call: fresh master read, CAS admitted→dispatched once, <=15 seconds from admission. Returns allowed true/noRetry. Never retry if its result is uncertain. Existing global/actor concurrency leases last 60s, longer than the runtime's bounded provider timeout.
5. `settle`: `{operation:'settle',leaseId,usage:{input_tokens,output_tokens}}` computes cost server-side and settles the original admission month. Scenario cannot supply keys, reservation, coach, model prices or another actor. Attribution is durable at `NAVIGATOR#SCENARIO#REQUEST#UUID / STATE`, not a separate quota. For known no dispatch use `notDispatched:true`. For uncertain provider outcome use `uncertain:true`: records uncertain, retains the full canonical money reservation, returns requiresReconciliation. No auto-refund/retry. A lost transaction leaves a pending/settling journal and conservative hold for operator reconciliation.

All requests draw from existing `NAVIGATOR#BUDGET#YYYY-MM / STATE` and existing actor/IP/global rows through the unchanged atomic Navigator controls. No budget reset or initialization is authorized. Existing Navigator limits (including its deployed limits, not an unapproved relaxation) remain authoritative. A usage overrun pauses canonical accounting through the existing fail-closed behavior.

## Deployment and rollback boundary

Three additive CloudFormation resources: exact private route, exact API→Navigator-alias permission, exact Scenario role invoke policy. No new Lambda/table/bucket/API/DNS/parameter. Update only Navigator Alpha code composition, publish immutable version, conditionally move live from captured baseline. Do not modify its environment, role, memory, timeout, reserved concurrency or any other alias. Existing source and all API behavior must pass focused tests first.

Rollback first stops Scenario paid dispatch (its owner restores OFF), then conditionally restores Navigator's captured immutable alias version if this release still owns it. Do not roll back ledgers, leases, accounts or secrets. Keep the private route disabled/removed only by its owning stack after verifying no in-flight work. No Production/Forecasting pilot changes. No new fixed charge; ordinary Lambda/API/DynamoDB/log usage remains metered and model usage draws from the existing Alpha allowance.

Hosted status is recorded separately; local tests alone are not deployment evidence.

## Checkpoint — November 24, 2026

Implementation source **ff7931c7f2045deffdff545fce1376ba96d21d12**, branch `codex/scenario-alpha-admission`. 37 focused tests passed across the new adapter, existing Navigator runtime, Alpha acceptance and master-control checks. Bundle built; whitespace check passed. No provider calls or spending-state writes.

Prepared ZIP SHA256 `9e8d8462d90ebb417a567646c7916e050a11615df2b532ea506201b8b7ea0db2`. Source-pinned baseline and protected alias/master inventory are in `preflight.json`. The prepared operator reuses the existing completed-revision/CloudTrail/CAS guard. It requires the exact implementation checkout, not a later documentation HEAD; do not bypass that check. Artifact and source pins must be reverified at execution.

CloudFormation change set `engent-scenario-alpha-admission/scenario-admission-ff7931c` is CREATE_COMPLETE/AVAILABLE and contains exactly the three additive resources above. Its inert stack placeholder is REVIEW_IN_PROGRESS. **Automatic approval review rejected execution** because it did not accept the linked GitHub owner direction as clear trusted authorization for Scenario Alpha AWS writes. Neither execute-change-set nor the code installer ran. Subsequent read-only checks confirmed the route is absent and Navigator live remains version3, revision `6e6a8e54-8791-4e84-a4f9-f2a199daa444`, original code hash `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`. No IAM policy, Lambda invocation permission, live code or route was installed. Production remains untouched.

Specific remaining execution scope: execute that exact three-resource change set; install the pinned Alpha-only composition without configuration/IAM expansion; verify completed code/configuration/CloudTrail ownership; publish an immutable version and conditionally change only Navigator Alpha live; perform provider-free private-caller/proof/bootstrap/accounting tests coordinated with Scenario, then report actual hosted evidence. No paid calls are part of this platform execution package. Rollback retains captured Navigator3; Scenario must remain OFF until its hosted acceptance. Direct confirmation in the platform chat is required to clear the approval-system block; this is not an architecture redesign request.

## Installed — November 25, 2026 (supersedes the preparation stop)

The owner directly authorized execution in the platform chat. The rebuilt committed source and ZIP matched the approved bytes; AWS's change-set template was structurally identical to the reviewed local template. The exact three-resource stack is **CREATE_COMPLETE**. No resource additions outside that change set.

- `decisionnavigator-alpha-api:live` now targets immutable **4**, source **ff7931c**, CodeSha256 **no2EYtkOu0F6VnZGx5FuBQoRYV3ytTLqUGIBuLfqDbI=**, alias revision **0e4bf980-36f2-4ae3-89db-fd10b1f894ed**.
- Existing Navigator3 retained. Role, environment, handler, memory, timeout, reserved concurrency2 and original Navigator route source remain unchanged.
- Lambda code acknowledgement revision `a7c41149-aa21-4c2b-9cac-8a48755a2433` was distinguished from completed stable revision `808d2a55-5bd5-4c50-b472-28a1be2ed408`. Exact configuration hash and unique CloudTrail write event `3d84d901-c861-4319-89b7-e4469a0f3bb7` verified ownership before publish.
- The initial activation CAS stopped safely because the approved CloudFormation `AddPermission` changed the alias/policy revision while its target remained3. Unique CloudTrail event `88c24dc3-1639-4f45-84ce-7f46e1afbb5d` established the exact CF-owned source ARN/principal/statement. The original two permissions and only the approved third permission were checked, no competing alias/permission changes found. Eight positive/negative ownership checks passed. Activation then used the verified owned revision `1b2025e5-52f8-49e2-b652-913b25a3d13b` as its CAS token. No blind revision refresh; original pins/journal preserved.

### Hosted checks completed

`hosted-platform-checks.json`: existing Navigator bootstrap, cookie Secure/HttpOnly/Strict24h flags and reuse, invalid Origin, absent/forged proof, unsigned private-route denial, and signed wrong-role handler denial all passed. IAM per-resource simulation allows only the exact private Alpha route and denies Navigator public/Production API scopes. An initial evidence parser incorrectly read the aggregate action decision; it was corrected to the documented `ResourceSpecificResults` without changing any policy ([AWS reference](https://docs.aws.amazon.com/IAM/latest/APIReference/API_EvaluationResult.html)). Ledger spent3204 micro-USD, reserved0, leases0 and notpaused were unchanged by these checks.

Scenario owner additionally ran exactly one provider-free immutable **scenario-alpha-api:2** probe, source `caf3d90482d27a099ece6a9bb1f6306e512fa50b`, ZIP SHA256 `178d080b72727ed4c94df6c4d4610d3e3ff0cdb722b9e593c28f0cc1d2b80e55`. Actual Scenario role/SigV4/master/invalidproof/wrongOrigin/validproof/admit/replay/zero-settle/settlement-replay all passed. Canonical ledger version20→22, spent3204→3204 micro-USD, reserved0→0, pausefalse→false; the acknowledged fixed832micro-USD reservation reconciled to zero known-no-dispatch cost. Its gateway/IP envelope was **synthetic**, so this is not claimed as real Scenario ingress-IP evidence.

Scenario remains **live OFF1**, unchanged alias revision `52c197d3-302b-4613-9859-b48d8329e86f`. Real-browser cookie return and viewer-IP attribution on Scenario's final public route remain a separate provider-free acceptance gate coordinated with its owner. No Scenario paid dispatch may be enabled based solely on the synthetic probe.

**Preservation:** Administrator master remains ON/revision11. All captured BFF/Tree/Process/Forecasting Alpha aliases and all five captured Production aliases match the baseline. No keys, entitlements, accounts, projects, registration, production resources or spending ceilings changed. No OpenAI calls in this installation. No new fixed-cost service; ordinary API/Lambda/DynamoDB/SSM usage is metered separately and not represented as a finalized zero-dollar invoice.

### Executable rollback

`node docs/scenario-alpha/rollback-installed.mjs --check` passed read-only. Its `--execute` mode conditionally restores only this release-owned Navigator Alpha alias to retained3 after confirming Scenario OFF1. Coordinate Scenario OFF first if it has since activated. The operator never writes other Coach aliases, master, IAM, accounts, quotas, ledger or secrets, and inventories unrelated independent releases without blocking rollback solely because they have advanced. Any ambiguity or ownership drift stops it. No healthy-release rollback was executed.

`installed-journal.json`, `permission-reconciliation.json`, `rollback-check.json` and historical operator copies preserve exact ownership evidence. The historical activation scripts must not be replayed on the installed release.
