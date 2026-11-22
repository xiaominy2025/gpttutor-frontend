# Homepage / Explore refinement

Update: the owner-approved Alpha publication of source `475913c` is complete. See [deployed results and rollback evidence](publication/README.md). The preparation record below is retained as reviewed.

Implementation: `182faf6`, branch `codex/home-explore-ui-consistency`, based on `eb96acb`. NOT DEPLOYED.

## Changes

Green **Open Decision Navigator** button reuses Process launch styling. Seven animation overlays share the same 34px circle, outline Play/Pause/Replay icons, bottom-right spacing, hover/focus and 44px transparent hit target. Global legacy focus overrides are contained. Artwork, timing, modal handlers and conversation logic are unchanged.

Grid tracks and children can shrink; text/buttons wrap at existing breakpoints. Root clipping mask removed. Shared authentication source, backend, Coach applications, AI and infrastructure untouched.

## Results

- Alpha build passed (589 modules).
- Platform suite: 40 files, 313 tests passed with maxWorkers=2. Includes five Navigator UI tests.
- Built-candidate browser: all four widths 1440/1024/768/390 passed matching controls, all six keyboard play/pause/replay, reduced motion, Navigator focus/Escape/return, four fixture interactions, continuation/reset/draft/reload, launch URLs and account email-form opening/dismissal.
- 26 responsive/podcast measurements: zero clipping/overflow/root-scrollport issues. Includes native desktop resizing 1440/1024/900/800/768/600/1440 on both pages, local MP3 play/pause and podcast route refresh at all four widths.
- 1440px Homepage before/after screenshots byte-identical: SHA256 03921c18b85f78dabcfbb213f838d8a2cb8cac4f64f2717a7a4d38316ddaa66c.
- Persistent clipping was not reproduced in the baseline. Intrinsic sizing is defensive hardening, not a confirmed root-cause claim. Native Chrome minimum window width means 390px uses viewport emulation.
- All browser requests intercepted: local media and auth/AI fixtures only. Zero live codes, APIs or paid AI. Hosted/authenticated acceptance is not claimed.

Commands: `node scripts/build-navigator-alpha.mjs`; `node scripts/test-navigator-integration-browser.mjs`; `node scripts/test-home-explore-responsive.mjs after`; `node node_modules/vitest/vitest.mjs run tests/platform --maxWorkers=2`.

## Screenshots and evidence

Full-page Homepage/Explore images at all four widths and native 800/900 captures: [before](before/) and [after](after/). Reproducible stills use reduced motion; active controls and dialog supplement them.

- [Homepage desktop before](before/homepage-1440.png) / [after](after/homepage-1440.png)
- [Explore desktop before](before/explore-1440.png) / [after](after/explore-1440.png)
- [Homepage mobile before](before/homepage-390.png) / [after](after/homepage-390.png)
- [Explore mobile before](before/explore-390.png) / [after](after/explore-390.png)
- [Active mobile controls](after/explore-controls-390.png), [Navigator dialog](after/navigator-dialog-390.png)
- [Interactions](interaction-results.json), [layout/podcast results](after/layout.json), [baseline](before/layout.json), [candidate hashes](candidate-assets.json).

## Proposed minimal Alpha publication / rollback

Requires owner approval. Reuse existing guarded web-only procedure; no infrastructure or fixed monthly costs. Ordinary storage/request charges only.

1. Rebuild pinned source and compare manifest hashes. Read current Alpha HTML version/ETag; stop on drift. Capture exact current HTML bytes and metadata as rollback baseline.
2. Last recorded baseline: bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`; key `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled/index.html`; VersionId `PXUt3Uha5gZ2wAcc4ZJg6k55AI9qRMSd`; ETag `"7894d9dd7268c13a2961976ee3bfde39"`; SHA256 `dc03888c13a04bfe922ea3fe54bb55e0dd1e0761f6f9dbd13a942f4bca27b7e7`. Recorded evidence only, not fresh AWS preflight.
3. Publish four immutable JS/CSS assets from manifest with If-None-Match:*; reuse stable media/vendor assets. Conditionally publish one existing HTML entrypoint against freshly verified ETag. No destructive sync.
4. One invalidation on existing distribution E1C4AJI9FUE47B: /engent-alpha/*, /explore, /explore/*. Hosted Guest desktop/mobile controls/modal/navigation/podcast smoke checks, no paid AI or live codes.
5. Rollback only release-owned HTML, conditional on this release ETag/version, using captured baseline bytes/metadata. Stop if another release changed it. Invalidate same paths and verify baseline. Leave immutable assets. Do not use older pre-Navigator rollback HTML.

Navigator alias/runtime, master ON, Tree, Process, BFF, authentication, credentials and Production remain unchanged during publication and rollback. No deployment authorization is implied.
