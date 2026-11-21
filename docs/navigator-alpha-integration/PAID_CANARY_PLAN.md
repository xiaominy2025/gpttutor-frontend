# Proposed Navigator paid acceptance — not authorized or executable yet

This is a separate plan. The owner's current approval covers default-OFF installation and non-paid tests only. **No paid canary has been run, no paid allowance is active, and this document is not execution authorization.** Do not use a prior localhost Navigator allowance or the existing $10 ledger as a substitute for new approval.

## Proposed bounds

- One synthetic four-interaction decision; **maximum four sequential provider sends**, including any ambiguous attempt. No automatic retries, alternate-provider fallback, repair call or extra metadata/generation experiment.
- Proposed incremental allowance **$0.03**, independent of—and additionally constrained by—the canonical Navigator $10 UTC-month ledger and all rate/concurrency/master checks.
- GPT-6 Luna Standard, 1,500 output tokens maximum; actual final serialized provider request at most12,000 UTF-8 bytes. Measure the same bytes used by the transport, including instructions/history/schema. No client assertion may substitute for the server calculation.
- At reviewed conservative rates, maximum reservation per send is ceil((12,000+1,024)×0.125+1,500×0.50)=2,378 microdollars; four reserve9,512 microdollars ($0.009512). The $0.03 ceiling is headroom, not permission for extra sends or larger requests. Recheck pricing/model access before approval.
- One explicit new approval ID, source commit, ZIP digest, qualified target and synthetic input-file hash must be bound to the execution. Never reset or replace a prior stopped/uncertain ledger to obtain a new allowance.

## Required guard before requesting paid execution

Implement and review a server-side, durable, atomic canary ledger in its own operational namespace on the existing table; no new account/table or project store is needed. It must bind the approval/source/ZIP/run, cap sends at4 and committed+reserved cost at30,000 microdollars, reject parallel/replayed execution slots, reserve before dispatch and retain a reservation on every unknown outcome. A matching controller journal must record intent before invoking; do not rely solely on a local mutable JSON counter. The canonical monthly ledger must independently admit/reserve every real call. Synthetic hosted-test budgets may never authorize a real provider request.

The guard must wrap the exact provider transport and same serialized request used by Navigator. Keep `store:false`, Standard tier and no application/SDK retries. Read only the dedicated `/decisionnavigator-alpha/openai-api-key` inside the authorized server process; never return/log it. Validate raw-key compatibility and model entitlement under the separately approved scope. Do not copy credentials from Tree/Process or create another key.

The private result needs an authoritative bounded usage receipt: approval/run/source binding, request digest, attempt index, model/tier, input/output/cache usage needed for conservative reconciliation, reservation and outcome certainty. Bind it to the actual invocation; a client-written receipt is not proof. Do not publish cookies, HMAC, credentials or decision bodies in logs. Missing/invalid usage is an immediate stop with holds retained. This guard and metering receipt are **not built or deployed by the current installation**.

## Proposed execution sequence after separate approval

1. Close actual viewer-IP, browser-cookie, effective credential and separately approved global master-test gaps. Keep public Navigator `live` on immutable OFF version1. Record fresh original-code/alias revisions, master revision, current canonical spent/reserved state and both secret metadata versions.
2. Complete offline cap/parallel/restart/unknown-outcome tests for the guard. Review exact code and ZIP, IAM scope and execution target. Use a direct, unpublished acceptance target on only the new Navigator function; do not expose a canary-only experiment through public routes. Preserve existing BFF5/Tree18/Process6, current website and public OFF alias. Any temporary `$LATEST` code must have conditional restoration ownership checks.
3. Verify guard eligibility and price/byte/token bounds before the first send. Run one fixed synthetic decision: opening plus up to three follow-ups. Respect the unchanged2/minute,5/day and concurrency limits; schedule the next permitted minute rather than automatically retrying429s. A denied, failed, malformed, timed-out or uncertain attempt stops the run—do not restart with another cookie or shorter transcript to continue spending.
4. Before every send, atomically reserve the canary slot/cost and canonical monthly cost, then freshly verify the shared master immediately before dispatch. Stop if any check cannot be verified. No guard may bypass the master, monthly budget, abuse controls or credential isolation.
5. After each known response, reconcile trusted usage and conservative charge against both ledgers. Preserve previous spent amounts and uncertain holds. Collect the synthetic educational-quality result and four-interaction/continuation closure evidence. Report all attempts, including any that produced no usable reply. Never refund an ambiguous external request merely because the caller timed out.
6. On completion or first anomaly, close the canary ledger permanently, restore the reviewed original `$LATEST` code under fresh revision/digest conditions and reverify public OFF alias, canonical ledger and master state. Publish a sanitized acceptance report. No public activation follows automatically.
7. Only after all security, credential, spending and bounded AI acceptance passes, request the owner's **single coordinated final Alpha activation** for the ready Navigator backend and reviewed Explore UI. Keep all six coaches, Process/Tree functionality, authentication, podcasts, existing controls and Production unchanged.

## Stop conditions

Any uncertain provider/invocation/ledger outcome; missing usage; source/configuration/ownership drift; byte/token/tier mismatch; unexpected quota or permissions failure; more than four send slots; model-price change invalidating the bound; or inability to restore only owned temporary code. Retain records and holds, keep the public alias OFF and report the exact blocker. Do not toggle the master globally or modify unrelated infrastructure to continue the canary.
