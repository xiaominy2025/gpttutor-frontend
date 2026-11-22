# Navigator Alpha — minimal canary lifecycle correction

Prepared only. No AWS deployment/write, Lambda invocation, OpenAI call, public activation, merge or Production change was performed. Public Navigator remains OFF version 1 and Administrator master ON revision 11. Existing infrastructure, application code, authentication, AI controls, spending rules and restoration artifact are reused.

## Correction

Source `d86d193e58279553b7e1f48e24ede93c809db058` changes only the existing executor, its execution-guard module and focused tests. No new deployment script, service, dashboard, logging infrastructure or approval stage was added.

1. Record the `UpdateFunctionCode` acknowledgement revision separately as historical evidence. An acknowledgement alone never establishes completed deployment ownership.
2. Wait for Active / Successful and repeated qualified `$LATEST` and unqualified reads. Require the exact reviewed code SHA-256, unchanged runtime configuration hash, acknowledged LastModified and a stable completed revision. Failed states, unreadable/lost acknowledgements, unstable reads or configuration drift stop without another write or invocation.
3. Require existing CloudTrail event-history evidence of the exact function, principal, original conditional revision, publish=false, acknowledgement revision, code hash and operation time. Exactly one matching management write is required. Short/qualified function names, partial/full ARNs and both lookup/event resource metadata are recognized, so alternate naming cannot hide a concurrent write.
4. Freeze the first stable ready candidate while audit evidence is pending. Re-read after the audit lookup, then pin the completed ready revision for every subsequent preflight and conditional restore. Matching code alone never permits adopting another revision. Bounded read polling tolerates ordinary audit delivery delay; it never retries a deployment write or paid call. Missing evidence after ten minutes stops for reconciliation.
5. Apply the same acknowledgement/ready/audit checks to restoration. Record both restore revisions separately and verify the exact original code/configuration. Conditional writes continue using the owned completed revision, not the historical acknowledgement revision.

A lost acknowledgement, failed update, conflicting write or ambiguous outcome does not trigger a guessed restoration. The existing stop/read-only reconciliation procedure remains available. CloudTrail's eventual consistency is not treated as proof of absence of an outside change: stable pinned reads and revision CAS remain mandatory through subsequent operations.

## Focused validation and review

- **74 tests pass** in `navigator-canary-execution-guards.test.mjs` and `navigator-paid-canary-operator.test.mjs`.
- Regression cases: equal/differing acknowledgement and completed revisions; install and restore; delayed ready/audit evidence; failed/never-completed updates; lost acknowledgement; wrong hash/configuration/time; inconsistent qualified/unqualified reads; changes during or after audit lookup; concurrent writes including alternate function identifiers; missing/malformed audit evidence; terminal-payload uncertainty and existing no-retry operator protections.
- Executor syntax and Git whitespace checks pass; fresh pinned canary bundle builds.
- Existing Navigator development chat completed source-only review: PASS for source freeze and fresh package preparation.
- No browser/authentication/master-toggle tests were repeated; those components did not change.

## Preserved stopped execution

The original journal and prior plans/manifests are untouched. Original journal SHA-256: `fd938f8134976794f62f71c236d755cbe155c19eadb6a15186bb3e9a4477960a`.

The new plan uses a distinct, fixed, exclusive successor execution directory: `.artifacts/navigator-paid-canary/alpha-reviewed-lifecycle-execution`. It is currently absent. This is a new preparation, not a restart. The executor verifies the exact stopped-journal hash and absence of its invocation journal. The original persistent `NAVIGATOR#CANARY#ALPHA-INITIAL` guard remains unchanged and must still be absent; it cannot be reset to obtain another allowance. Old packages are rejected by the new lifecycle-version and journal binding checks.

## Fresh package for review — not authorized for execution

- Binding: `navigator-paid-review-7c321f0f-da80-48a5-8f5c-ea5f91986861`.
- Source: `d86d193e58279553b7e1f48e24ede93c809db058`; unchanged core runtime pin `934f2fd837423c45d77082566ba5f55a50df4771`.
- Window: November 21, 2026, **9:47:15.405–10:47:15.405 p.m. Central** (`2026-11-22T03:47:15.405Z`–`04:47:15.405Z`). Expired packages must not be executed or re-dated; prepare a new immutable package if required at execution time.
- Plan SHA-256: `a438c3d9958a764d4d34199b5783d89df8143f173e53fe8187bb528522ca2c31`.
- Manifest SHA-256: `c65c921eea122f9c64d4efe5ccfb3ffc5d717664983f4549fade704fffb61846`.
- ZIP SHA-256: `bfd8303847cca24f5473487bc885ea6a50255d593fb7d7702c58f8614e0d06d6`, 311804 bytes.
- Local package: `.artifacts/navigator-paid-review-7c321f0f-da80-48a5-8f5c-ea5f91986861/` in the existing frontend integration checkout.
- Read-only AWS preflight verified exact approved principal/account/region, original private revision `0e61fca1-fde3-490f-8b58-e16f51c90f8b`, public OFF alias revision `9545575c-3a9c-4163-96cd-98f747a769e0`, master ON 11, and dedicated SecureString metadata v3. Runtime configuration hash: `e9e7af1b2c1560560dea073e00ab2268738540454a59ab39581fa86bb4184349`. Persistent canary row remains absent. No secret value was read by the operator.
- Limits unchanged: one non-paid bootstrap, at most **four sequential paid calls**, **no retries**, **$0.03 incremental**, existing **$10/month** and rate/concurrency controls. Dedicated Navigator credential only. No public alias/HTML/master/other application changes.

## Lightweight execution sequence after explicit authorization

Verify the exact approved plan/source/artifact hashes and current baseline; perform one conditional private install; establish completed ownership using stable reads and existing CloudTrail; run the existing bounded canary and durable metering; conditionally restore and verify the original OFF code. Stop on error/uncertainty and preserve holds/journals. Public activation is a separate release boundary and is not performed by this package.

Provider authorization/model access and genuine responses remain pending paid acceptance. No new resources, IAM changes or recurring charges are proposed. Current paid cost is $0; the prepared future allowance remains $0.03. The plan, manifest and preparation receipt are in `final-acceptance-evidence/paid-canary-lifecycle-*.json`.
