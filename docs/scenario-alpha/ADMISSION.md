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
