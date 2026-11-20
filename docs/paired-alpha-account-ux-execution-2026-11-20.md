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
