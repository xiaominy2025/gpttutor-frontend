# Coordinated frontend refinement — 2026-11-21

This is the historical preparation record. The owner subsequently approved the bounded paired Alpha publication. See [completed publication and hosted verification](PUBLICATION.md) for current status. The preparation results and original approval boundary below are retained for traceability.

## Changes

Website branch `codex/explore-scroll-refinement` is based on `1a4fe9da83db0c38d2064a0a917ede4163bcf13b` (existing Process launch candidate). The only product change is six lines in `src/components/marketing.css`. Legacy global CSS gives body and root fixed viewport heights and `overflow-x:hidden`, which also computes vertical overflow to auto. Both become nested vertical scroll containers. Marketing pages now use document scrolling; intentional account-menu scrolling and legacy route styles remain intact. No layout, authentication or shared-header source changed.

Process owner prepared `codex/process-responsive-clipping` at `10e1d9ccafa561dea736333bd763bb1538969876`. Its only product change is responsive workbook CSS: allow shrinking/wrapping, stack collaboration below 900px, and give objective fields their own row below 540px. Existing 1440px screenshots are byte-identical before/after. Tree source is untouched. Process evidence: [before/after and regression report](https://github.com/xiaominy2025/ai-decision-process/blob/10e1d9ccafa561dea736333bd763bb1538969876/docs/qa/process-responsive/README.md).

## Verification

- Website Alpha build: `node scripts/build-release-b.mjs alpha --enable-local-ui --enable-process-coach` passed. Only its web output is proposed for publication; generated API artifacts are excluded.
- Platform tests: 149/149 across 30 files passed.
- `scripts/test-marketing-scroll.mjs`: all 13 measurements passed. Explore and podcast pages at 1440, 1024, 768 and 390px have no nested body/root scrollports or page horizontal overflow. Header logo, email-form layout/dismissal, coach links, hash navigation and actual local MP3 play/pause passed. Native desktop window bounds were resized 1440 → 1024 → 768 → 1440 without losing form state. Legacy `/labs` styling remains unchanged.
- Process owner: 249/249 offline tests; 15 stage/size checks; Save/Open, repeated Save, Save As, download fallback, browser recovery and navigation passed. Native desktop resizing independently passed. Wide desktop appearance is preserved.
- `scripts/test-paired-ui-refinement.mjs`: both actual built frontends passed Explore → Process → Explore → Process at all four widths, including synthetic IndexedDB recovery across refresh and navigation. Existing unsaved-file confirmation is acknowledged only for synthetic data. Save/Open is covered by the Process suite, not claimed by this paired test.
- All candidate browser tests use local Guest/API fixtures and synthetic projects, abort external/API writes, and make zero real API or paid calls. Live screenshots before the fix are read-only Alpha Guest captures; after screenshots are the local candidate. Hosted authenticated acceptance is not repeated or claimed.

Evidence: [before metrics](before-scroll.json), [after metrics](after-scroll-results.json), [paired navigation](paired-navigation-results.json). Screenshots below are viewport captures with visible desktop scrollbars where applicable:

- 1440px: [before](before-explore-1440.png), [after](after-explore-1440.png)
- 1024px: [before](before-explore-1024.png), [after](after-explore-1024.png)
- 768px: [before](before-explore-768.png), [after](after-explore-768.png)
- 390px: [before](before-explore-390.png), [after](after-explore-390.png)

## Proposed paired Alpha publication — not authorized for execution

Use existing account `771049112957`, region `us-east-1`, bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, CloudFront `E1C4AJI9FUE47B`. Read-only CloudFront preflight confirms the existing separate website and Process origins; no distribution configuration change is required.

Website prefix: `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled/`. Current `index.html` rollback version: `CG8zJEaxZ0r8s8RRVyRyRc9bFmswtpzf`; ETag `59216bcc903a82446c615ecdbd5b38e3`; SHA-256 `e35451c7344852487c74d73f3fa1f8dee4dec7baa35d74c63adc29e99752da18`.

Process prefix: `releases/decisionprocess-alpha/web/`. Existing entrypoint is **`process/index.html`**, not prefix-root index.html. Current rollback version: `UZrpgJWz8doFwS2gY_bQAuPIElm0iXbe`; ETag `90fa6ac93521730ea0ea2907ce16d43a`; source-sha256 metadata `93ef568811a355831018b33c2d13d051ea8c68d6e7c6d616411bf2d37beacee8`. Freeze actual bytes and checksum before execution; metadata alone is not a checksum verification.

1. After approval, recheck both source pins, clean build receipts, origin routing, HTML ETags/versions and existing protected runtime state. Preserve platform Lambda 5, Tree Lambda 18, Process Lambda 6, existing sessions/MFA and Administrator master AI ON state. Stop on drift.
2. Prepare a fresh paired release manifest and durable execution journal. Capture both current HTML objects and version IDs before any publication. Do not reuse prior release authorization or manifests.
3. Stage only new hashed frontend assets, using conditional immutable writes (`If-None-Match:*`); verify existing reused objects by checksum. Expected new website assets: `index-BE9DTgyc.css`, `index-C7EyrWlb.js`; Process: `index-BOTcVSfR.css`, `index-CxOuJS-b.js`. Verify clean-build hashes before freezing the write set. No media re-upload, bucket sync/delete, backend package or configuration write.
4. Process owner publishes its reviewed `process/index.html`; website owner publishes its reviewed `index.html`, each conditional on the captured ETag, with unique release ownership metadata and acknowledged versions. The manifest must bind both publications. Stop on conditional failure rather than retrying blindly.
5. After both succeed, perform one scoped CloudFront invalidation for `/engent-alpha/*`, `/explore`, `/explore/*`, `/process`, `/process/*`. Verify served hashes, four-width Guest navigation, scroll behavior, local synthetic Save/Open/recovery and podcast playback. Do not request codes or make paid calls.
6. On failure, restore only the two release-owned HTML objects, and only if each current version/ETag still matches this release's acknowledged publication. Restore captured pre-release bytes with a conditional write; never overwrite another release. Leave immutable assets in place. Issue a scoped rollback invalidation if needed; record partial outcomes and stop if ownership cannot be proved. Backends, AI master state, data and infrastructure are outside rollback scope.

No new resources or fixed monthly costs. Only ordinary small S3 requests/storage and existing CloudFront invalidation/traffic usage apply. Modern-browser CSS `:has()`/`overflow:clip` is required; tested in current Chrome/Edge. Intentional table-local scrolling and single-line input text scrolling remain available.

Ready for owner review and a single coordinated frontend-only Alpha publication approval. Current Alpha remains unchanged.
