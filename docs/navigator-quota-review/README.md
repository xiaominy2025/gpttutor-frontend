# Navigator anonymous quota refinement — review only

## Diagnosis and evidence

Read-only observation 2026-11-22T21:54:08Z: Navigator live alias remains immutable version 3 (alias revision 6e6a8e54-8791-4e84-a4f9-f2a199daa444). API Gateway access logging is not configured. Existing quota code returns the same 429 message for minute/day/IP/concurrency/budget/accounting-pause denials and emits no reason-specific application log.

The exact historical owner rejection cannot be attributed from retained evidence without inventing a cause or accessing visitor identifiers. Confirmed design mismatch: the existing two-admissions-per-fixed-minute limit rejects a third interaction in that minute, despite a four-interaction conversation. This is reproduced locally; daily five and IP twenty can also cause the same old message. These are hypotheses for the individual incident, not confirmed incident attribution.

The canonical November budget row exists: spent 3,204 microdollars ($0.003204), reserved zero, accounting pause false. Master ON revision 11. This excludes present monthly exhaustion; it does not prove the state at the earlier rejection. No visitor rows, IPs, cookies, messages, credentials or user records were retrieved. No live requests or paid calls were made.

## Proposed minimal changes

Use the existing transactional quota store and keys. Anonymous allowances become six admissions per fixed minute, twenty per UTC day, one hundred per IP per UTC day. Preserve one concurrent request per visitor, two globally, the $10 monthly ceiling, signed four-interaction conversations, replay protection, conservative reservation/settlement and fail-closed master verification. Legacy account allowances remain unchanged; hosted Navigator continues using anonymous controls for every visitor.

Separate reason codes/messages identify visitor rate, visitor daily, network daily, visitor capacity, global capacity, monthly allowance, accounting unavailability and transactional contention. Known counter resets return absolute ISO retryAt, retryAfterSeconds and Retry-After. UI displays reliable future times in the browser locale and retains draft/history without automatic retries. No invented retry time for capacity, uncertain holds or accounting pause. Budget admission can fail before the nominal ceiling when the remaining allowance cannot cover the conservative reservation; message states this accurately.

Existing Lambda logging gains one event with event name and categorical reason code only, allowing future sanitized aggregate diagnosis. No actor/IP/cookie/prompt/continuation in that event; logging failure cannot change admission. No new log groups, metrics, dashboards, IAM or accounting system.

## Abuse and compatibility review

Twenty daily admissions allow up to five complete four-interaction conversations per visitor; the network backstop allows up to twenty-five across a shared network. Cookie clearing can evade a visitor limit, while IP rotation can evade a network limit: this remains an anonymous-access tradeoff. Raising limits increases potential consumption and capacity contention but does not raise the $10 application ceiling. Fixed-minute counters preserve existing boundary bursts (up to two windows near a minute boundary); this is not a new rolling-window algorithm. Daily quotas count admissions, including attempts that later fail, matching existing behavior. No billing reset, refund or ledger migration.

Reuse is compatible with future AI-light patterns, but this patch changes Navigator only. It neither implements a shared spending pool nor grants another Coach access to Navigator credentials. No new recurring infrastructure cost; usage and existing rejection-log delivery may increase within existing application controls. No provider/project billing cap is claimed from this application ceiling.

## Validation

64 focused tests passed across eight files: legacy third-request reproduction; proposed minute/daily/network limits and UTC resets; concurrent limits; budget and uncertain-hold behavior; atomic accounting; anonymous four-interaction protocol, signed continuation and replay; master fail-closed; reason-coded responses, Retry-After and reason-only logging; logging failure; UI retry formatting, preserved drafts and no automatic retries. Existing provider-blocked acceptance harness updated to use configured quota constants. Local Lambda and Alpha web builds prepared; no deployment.

## Proposed Alpha release and rollback — approval required

1. Reconcile the then-current Navigator source/alias/code hash and Alpha root HTML VersionId/ETag/ownership. Preserve newer Homepage/Forecasting source and independent workspace ownership. Capture root HTML bytes/metadata and Navigator live alias version/revision. Stop on unexplained drift.
2. Rebuild the reviewed source and verify Lambda/frontend hashes. Reuse the existing guarded Lambda publication lifecycle: conditional code update, ready-state code/config/ownership verification, immutable version publication, conditional live-alias change. No configuration, IAM, API, DNS, credential or infrastructure writes.
3. Create only new hashed frontend assets; reuse all existing podcasts and media. Conditionally replace only platform root HTML and perform one scoped CloudFront invalidation. New frontend tolerates old backend generic errors; old frontend still shows new server messages, so there is no required outage.
4. Verify hosted anonymous modal, draft retention, reason-coded provider-blocked limits and rollback ownership. Do not exhaust real visitor quotas or monthly budget merely to test messages; use the existing bounded synthetic/provider-free procedure if hosted admission testing is authorized. No paid canary or global master toggle is needed for this change.
5. On failure, conditionally restore the captured Navigator alias only if it still belongs to this release; restore captured root HTML only after matching release-owned version/ETag/markers/hash. Invalidate the same paths. Leave immutable assets and all ledger rows intact. Runtime version 3 is the current baseline; verify again at release time. Do not rewind spending/quotas, master state or other Coach releases.

This is preparation only. No deployment, merge, paid call, authentication change or AWS write has been performed for this task. Owner approval is required for the exact reviewed Alpha publication.
