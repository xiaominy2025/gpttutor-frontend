# Navigator reference pattern for AI-light Coaches

Navigator is the reference for a small, anonymous AI feature integrated into Engent Labs. Accepted implementation: `934f2fd837423c45d77082566ba5f55a50df4771`; paid acceptance: `e8929f5`. This document creates no resources and changes no current budget, identity or architecture.

## Reuse the working pattern

- Keep the Coach's runtime independently deployable. Reuse existing CloudFront/API routing and deployment conventions where appropriate; add only the Coach's narrowly scoped application paths. Initial directory/UI placement can require a website release; later compatible runtime releases do not require redeploying the Homepage or other Coaches.
- Reuse optional platform sign-in and the universal header without inventing tool-specific accounts. Anonymous AI-light use needs no entitlement/project store. The signed HttpOnly anonymous abuse-control cookie is not an account. Keep conversation/continuation content in browser memory; persist only necessary TTL-bound operational state, replay hashes, quotas and accounting.
- Use the existing MFA-protected Administrator **single master control**, read and enforced server-side before every paid dispatch. Missing/invalid/unavailable state fails closed. ON still requires independent Coach readiness, permitted credential use and spending admission. Do not introduce another dashboard or switch.
- Keep dedicated Coach credentials and narrow runtime permissions. Reuse existing state storage through a distinct namespace. Restrict master access to projected reads; never grant account/project/master-write access to an anonymous tool. Keep secrets out of web bundles, logs and release evidence.
- Reuse atomic admission/reservation/settlement and existing replay/concurrency controls. Bound input/output/time, use no automatic paid retries and preserve conservative charges/holds for uncertain outcomes; do not refund by guessing. A model budget is not an AWS traffic-cost cap.
- Build once, pin source and artifact hashes, stage only changed hashed assets, conditionally promote HTML, publish/verify an immutable runtime version and conditionally move only its alias. Record durable write acknowledgements and distinguish them from stable completed revisions. Use existing audit evidence and CAS guards, not additional deployment services. Navigator also observed `PublishVersion` advancing the private `$LATEST` revision: keep the publish acknowledgement, immutable version revision and stable private revision distinct, and correlate the owned publish event before accepting a changed private CAS token.
- Keep immutable OFF and prior working releases as rollback targets. Roll back only owned alias/HTML/configuration; retain assets, secrets, spending and uncertain holds. Never toggle the shared master just to roll back one Coach, use destructive S3 sync, or overwrite someone else's later release.

## Keep validation proportional

Reuse accepted shared authentication, Administrator MFA/master, cookie/IP and unchanged application evidence. Test the actual source/API/UI delta and rollback ownership. For a first provider/runtime integration, use a specifically bounded paid canary; for this unchanged accepted Navigator launch, use only one separately approved hosted anonymous smoke. Do not repeat the completed four-call canary as a routine UI publication test. Keep project writes and unrelated paid requests blocked. Persist permitted response/HTTP and metering evidence before optional visual assertions; preserve failed harness records and never resend a paid request merely to repair a screenshot or locator.

A single approved release scope should cover routine preparation, deployment, focused verification and conditional rollback. Seek a new decision only for a material scope/cost/security change or unresolved ownership/usage ambiguity. Keep Production and other Coaches separate.

## Next Coach: shared controls, deferred now

At the **next AI-light Coach integration**, introduce the owner's intended **shared $10 spending pool and shared visitor limits** for participating AI-light tools. That will be one deliberate coordinated control change, with atomic shared admission, explicit participating tools, namespace/identity compatibility and preservation of already charged/uncertain usage reviewed then.

Do not pre-create a shared pool, migrate/reset Navigator's current ledger, change its cookie/visitor identity, or expand roles during this launch. Do not silently absorb Tree/Process into the pool or change their independent budgets, credentials, permissions or workflows. Shared budget/visitor controls and each tool's dedicated credential serve different purposes; dedicated credentials remain isolated.

Current Navigator limits remain $10 per UTC month, 2/minute and 5/day per visitor, 20/day per IP, 1 concurrent per visitor and 2 globally. This launch neither pools nor multiplies that allowance.
