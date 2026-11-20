# Paired Alpha account UX release — approved execution preparation

Authority: frontend Issue11 comment7052169854. Runtime source frontendbea0ba2 (clean documentation source112fae6), Treeffda73e. This execution package does not change either application's approved runtime source.

New manifest SHA256: `703abb1db3027b0fba158327c62d415887929d815a0acc19a79911bdb06a70de`.
New execution plan SHA256: `b5cc2f8931679b92aec92c47ab519b384dffeb9c1ddef4a2a70da982f950df60`.

The new release-specific CLI/module pins these hashes and the NEW private receipt root `.artifacts/paired-alpha-account-ux-20261120/`. Prior manifest, plan, journal, scripts and rollback snapshots remain intact. Engine logic is unchanged except the new manifest pin; CLI additionally rechecks the unchanged live viewer-function ETag and code hash read-only.

Allowed phases: Tree owns its2 hashed assets and3 HTML objects; coordinator owns platform1 asset and1 HTML object, then one union invalidation. Three assets must be staged/verified before Tree HTML; all Tree HTML must be verified before platform index. Exact keys and metadata are frozen in the manifest/plan. Reuse38 existing immutable references. No deletes, Lambda/API bundle, infrastructure, IAM/Cognito/DNS/account/project or paid-AI operation.

Pre-write evidence: fresh26 protected fingerprints match accepted Alpha, Lambda4/17/flags preserved, Administrator MFA ON, registration closed, viewer hash unchanged; guarded read-only check verifies current/versioned rollback bodies and immutable references. Both coordinator and Tree independently passed33 safety tests and reviewed the new pins. Exact7 S3 resource decisions and existing distribution invalidation allowed in read-only IAM simulation. Four offline desktop/mobile Student/Advanced paired flows against exact frozen builds passed with all requests intercepted.

Invocation uses `node scripts/paired-alpha-account-ux-web-cli.mjs <phase> --owner=<platform|tree> --execute --approved-manifest=703abb1db3027b0fba158327c62d415887929d815a0acc19a79911bdb06a70de`. The coordinator explicitly gates owners before each mutation phase. Only coordinator calls `invalidate` after coherent paired HTML. Read-only `check`/`status` inspect the shared locked journal.

If publication or acceptance fails, stop and inspect the journal. Reconcile unknown outcomes using owned VersionId/ETag/write marker/hash proof; never blindly repeat. Restore only new-release-owned HTML, platform first then Tree in reverse order, through `rollback` with the same new pin. This restores the captured current working0dc4258/4384f65 web bytes and metadata; keep staged assets/versions. Finish a bounded rollback invalidation only after complete conditional restoration. Do not roll back Lambda4/17 or unrelated state. If another writer changed a destination, stop rather than overwrite.

After successful publication: verify public routes/assets, non-destructive Guest navigation at desktop/mobile, and mocked account menu/channel behavior using the fetched deployed static bytes. No live codes or authenticated-session mutation are authorized in this release. Leave Alpha enabled for owner acceptance; production and PRs remain untouched.

## Publication result

**Updated Alpha is running and ready for owner UX acceptance.** Open https://d6owpirihdsus.cloudfront.net/explore in a new tab; Tree is https://d6owpirihdsus.cloudfront.net/ and the Alpha homepage is /engent-alpha/ on that host. Existing unsaved user tabs were not refreshed or modified.

Release `paired-alpha-account-ux-374689af-5919-4879-9c64-f52f91da7c88` completed exactly3 create-only hashed asset writes and4 conditional existing-HTML writes. New assets total1,159,591bytes. No deletes or infrastructure/backend writes. Single invalidation `I39YI7QJ4MYMDGFWEQC8L1WIY1` **Completed** on the exact6-path union. All7 journal rows are applied, with no pending or ambiguous outcomes. No rollback or mutation retries were needed.

Current HTML VersionIds:
- Platform index: `VAIhzC8a3QhXOvBTWX8VUgSUJ0Nzlqzx`.
- Tree index: `zwnDzv8RfZLmcqYNz1ByKNeIxi3Z4gjn`.
- Tree admin: `eNVJCCjgGHnsjqJkEWRsiLQypUD4R_o5`.
- Tree admin/: `Vbz42xOtneEgwyiwpV75jMjp353VIKj9`.

Public12 HTML routes and3 new JS assets match the new manifest. Actual Guest checks passed8 pages at desktop/mobile, Guest navigation/automatic Tree entry/idempotent Guest/menu dismissal/case navigation, and protected Guest API denial. All requests were guarded against writes and paid AI; zero code requests or forwarded writes. Deployed static UI with every API mocked passed4 Student/Advanced desktop/mobile flows: Advanced compact label, scoped entitlement, Student-only Manage Tree access, Tree sign-out staying in place, hidden Explore updating immediately through real BroadcastChannel plus authoritative mocked revalidation, and start429 copy without resend.

Final guarded read-only check passed after publication: Lambda4/17 and all26 protected fingerprints plus viewer bytes unchanged;38 immutable references, all release-owned object versions/hashes/metadata and original versioned rollback bytes verified. Four original HTML backups and source-specific conditional rollback remain available. Local33 safety tests covered partial failure/lost response/CAS/ownership rollback; no live rollback rehearsal was performed on the successful release.

Evidence is under `docs/evidence/paired-alpha-account-ux-20261120/`: exact manifest/plan, publication journal, inventory, deployment result, public hashes, live Guest/navigation results, non-mutating account UI fixtures, permission simulation and preflight result. Private encrypted snapshots, original bytes and Guest screenshots remain in the new local receipt folder; no credentials or live account/project screenshots are committed.

**Limits:** no new live Cognito/OTP or authenticated-session acceptance was performed. Basic Student live permissions remain a separate gap requiring an existing designated eligible Student. Existing backend auth/revocation policies and Administrator MFA were preserved, not reconfigured. Production, DNS, IAM, Cognito, accounts and projects were unchanged; PRs remain draft/unmerged. Only normal existing-service S3 storage/requests and one invalidation were used; no new fixed-cost AWS resource or paid AI usage.
