# Navigator Alpha renewed canary — stopped before invocation, restored

Owner authorized a new pinned package after renewed operator review, with maximum four sequential paid requests, no retries, $0.03 incremental and no public activation. The prior package was retired without execution or re-dating.

## Actual outcome

The execution stopped during private code readiness, before bootstrap or any Lambda invocation. Therefore there were **zero paid requests, no responses or token usage, $0 OpenAI cost, and no retained holds**. Strongly consistent reads confirm both the persistent canary guard row and canonical November budget row remain absent. No ledger or journal was cleared/reset. No retry was attempted. Paid acceptance, provider authentication/model access and response-quality acceptance remain pending.

The original private OFF code was restored using a separately reviewed, ownership-reconciled conditional rollback. Public `live` remained immutable OFF version 1 throughout. Master remained ON revision 11. Protected platform/Tree/Process versions remain 5/18/6, with identical configuration hashes. Existing website/Process HTML versions and CloudFront configuration are unchanged. No authentication, user, project, IAM, DNS, infrastructure configuration or Production changes were made. No new session or code was requested.

## Fresh source, package and review

- Source: `617fa98e51be40e84ca64e6bc6dd8da961b97051`; core runtime pin remains `934f2fd837423c45d77082566ba5f55a50df4771`.
- Review corrections: `a93c932` and `617fa98`. Acknowledged revision ownership, terminal-payload uncertainty, capability filtering before synthetic-response persistence, and restore revision checks.
- Focused local validation: 52 tests pass across paid runtime/guard, journal, operator and execution guards; executor syntax passes. No UI source changed.
- Existing Navigator development chat independently reviewed the corrections read-only: PASS before execution. Subsequent restoration-only recovery plan also passed review.
- New binding: `navigator-paid-review-d675b7da-7d99-4e39-af2b-0aacc5d2e4fa`.
- Window: November 21, 2026, 8:52:18.934–9:52:18.934 p.m. Central (`2026-11-22T02:52:18.934Z`–`03:52:18.934Z`). This package is now consumed/stopped and must never be retried, even while its time window remains open.
- Plan SHA-256: `285dc5c4643b014c5e5fd3ee7adff5e693aac5be397d83942811ef07a3e8ac67`.
- Manifest SHA-256: `87922d3eaa13b65854bedc980fda5e5e7af7d7feded93fda01975344605cef6f`.
- ZIP SHA-256: `29dee7645c3e3e6f740fb40887bb12d327c814315698bac5cbdce137e5e0bbf6`, 311803 bytes.
- Immutable plan retains its initial `PREPARED_FOR_REVIEW_NOT_AUTHORIZED` build status. The subsequent review and execution decision are recorded separately in Issue #11 comment 7073193187; plan bytes were not edited.

## Confirmed failure and evidence limits

The executor assumed the RevisionId returned by an asynchronous `UpdateFunctionCode` acknowledgement would remain identical when that update became Successful. This assumption failed in the actual deployment:

1. At `02:53:34Z`, our conditional install acknowledged exact reviewed canary hash and revision `b7b1ca72-1b36-4df0-9c2c-5de846752aa1`, status InProgress.
2. Ready reads reported the same code hash, configuration and LastModified but revision `f8ed31f5-e702-4818-9ceb-42705868de21`.
3. The exact-revision guard stopped readiness and refused automatic rollback. No invocation started; only the execution journal exists, not the invocation journal.
4. CloudTrail event `49c1fc3c-64a1-485c-9219-c4b4a7d3f67c` correlates the acknowledged update with the exact function, original revision, expected principal and time. The captured interval shows only that Navigator management write. Repeated qualified/unqualified reads agree on the stable ready revision and original configuration.

There is no evidence of an outside write in the captured interval. This establishes ownership for this specific rollback, not a general AWS guarantee about revision transitions. AWS documents asynchronous update status and RevisionId conditional writes, but does not guarantee the acknowledgement revision remains the final ready revision: [function states](https://docs.aws.amazon.com/lambda/latest/dg/functions-states.html), [UpdateFunctionCode](https://docs.aws.amazon.com/lambda/latest/api/API_UpdateFunctionCode.html).

## Restoration

After renewed restoration-only review, a fresh exact-revision/hash/configuration check and public OFF/master ON checks passed. One conditional restore used reconciled revision `f8ed31f5-e702-4818-9ceb-42705868de21` and the original pinned S3 object version `qdp7G4h0ECzo9XgfE.YCJYpvcqqsq20n`. No invocation/retry was performed.

Restore acknowledgement revision: `9c9f3edd-5aaf-409c-8f18-05ecc0909edd` (InProgress). Stable restored-ready revision: `0e61fca1-fde3-490f-8b58-e16f51c90f8b`. Original hash verified: `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`. Both qualified/unqualified ready reads agree; public OFF/master ON reverified at `02:56:52.311Z`.

Ordinary AWS control-plane/read operations occurred; no new fixed-cost resources were created. AWS usage costs were not invoice-reconciled. Zero OpenAI cost follows from zero dispatched requests, not from assuming failed requests are free.

## Remaining work / boundary

Do not execute either paid package or reset/move the fixed execution journal. A future attempt requires a reviewed lifecycle-aware operator that distinguishes install acknowledgement from verified stable ready revision without adopting unexplained drift. Preserve conditional writes, explicit ownership evidence, fail-closed behavior and all spending limits. Review any continuation after this pre-invocation failure separately; this report does not authorize a new attempt or public activation. Existing credential format v3 remains verified, but provider authorization/model access and coaching responses were not tested in this run.

Sanitized exact plan, manifest, execution journal, CloudTrail reconciliation, restoration, metering and protected-state snapshots are in `final-acceptance-evidence/paid-canary-*.json`. No secrets, raw IP addresses, cookies, continuation tokens or raw receipts are included.
