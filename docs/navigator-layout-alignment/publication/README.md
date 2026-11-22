# Navigator layout Alpha publication completed

Released source **6ef1c6e4b8e5cfdaf8733bb7a92d5a9f05f39aa4**, approved draft PR #19, November 22, 2026. No product-source changes during publication. PR stays draft/unmerged; Production unchanged.

[Live Alpha Explore](https://d6owpirihdsus.cloudfront.net/explore)

The exact revised title/subtitle/description now precede Navigator's illustration/action grid. The watercolor is left, Podcasts/Meet Your Coach right, with Process Coach's shared typography, spacing and responsive stacking. Explore Cases, compact launch icon and dialog remain functional.

## Exact deployed versions

[Summary](summary.json) and [execution journal](execution.json) record three new immutable frontend assets, one conditional HTML and one scoped invalidation: **five AWS writes**. Zero media uploads or unrelated infrastructure changes.

HTML VersionId **zyKj_rxdjPHiL5xWkncOun71epdVDzrO**, ETag **"6707e87a62e66db6c08e95017335e621"**, SHA256 **237eae504b810491d5fbbd62128407d2bcad31e394ece5043fb42c630e5705ea**.

Invalidation **IA2ZP6HG9AN4OGZ6SFS5R8RUZ7** completed on E1C4AJI9FUE47B for /engent-alpha/*, /explore, /explore/*.

[Source build receipt](build-receipt.json), [fresh preflight/rollback metadata](plan.json). The rebuilt output matched the reviewed three asset hashes and HTML hash; ownership, VersionId and ETag were rechecked before promotion.

## Focused hosted results

[Browser results](hosted/results.json): **1440/1024/768/390 passed**, plus native desktop resizing 1440/1024/900/800/768/680/600/1440.

- Exact copy, header above the content area, left/right desktop and stacked mobile layout.
- Computed heading/subtitle/description typography/margins, grid columns/gap/alignment and action headings match Process Coach.
- Animation's 33 watercolor marks, pause/resume and reduced-motion behavior preserved.
- Launch icon opens Navigator; Escape/close returns focus; unsent draft survives reopening. No message submitted.
- All six other Coach sections and seven podcast links present; Tree/Process destinations preserved. Navigator case page loads; mobile audio playback/pause spot check passed.
- No horizontal/nested root overflow or page errors. All non-GET/HEAD traffic blocked; zero project/authentication writes, email-code requests or paid AI calls.

[CloudFront evidence](edge-results.json): three HTML routes and three frontend asset hashes match; all **39 podcasts** retain their existing sizes/ETags and HTTP200 availability. No media files changed or uploaded; previous full 39-recording playback acceptance reused rather than repeated.

Hosted screenshots: [desktop Navigator](hosted/navigator-1440.png), [mobile Navigator](hosted/navigator-390.png), [desktop Explore](hosted/explore-1440.png), [mobile Explore](hosted/explore-390.png). All four widths in hosted/.

## Preserved state and rollback

Navigator live **3**, master **ON revision11**, BFF **5**, Tree **18**, Process **6**, with unchanged alias revisions and CloudFront configuration. No animation artwork/timing, other Coach sections, AI, Lambda, IAM, Cognito, DNS, API, credentials, accounts, projects, ledger or Production changes. No new infrastructure/fixed fees; ordinary existing frontend storage/request usage only.

Rollback is ready using captured prior 39-episode HTML bytes and metadata: VersionId **7l9Gd8Oxe7TbHEbGhSarWDtjhoZ54Fjx**, ETag **"1a29d7b10df3ca43a405e36b80fab8fa"**, SHA256 **438c8ce47959c553a4d5b22e4246d89eea0401b9fd3b973ebc32c78fd1cdcc5f**. [Exact rollback HTML](rollback-index.html).

Local guarded command: `node .artifacts/navigator-layout-operator.mjs rollback`. It checks receipt-owned current VersionId/ETag/release/write metadata and content, then restores only HTML with If-Match using captured metadata, verifies bytes and issues the same scoped invalidation. Stop on drift, retain immutable assets and all media/runtime/master settings. Rollback was not needed or executed.

Archive recovery: restore plan.json, execution.json and rollback-index.html to `.artifacts/navigator-layout-publication-6ef1c6e/`, copy operator.mjs to `.artifacts/navigator-layout-operator.mjs`, and restore the pinned source/build receipt before running it. Later documentation-only commits are permitted; frontend source drift stops the operator. Do not replay publish or reuse this release for a future deployment.
