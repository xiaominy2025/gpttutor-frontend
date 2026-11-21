# Completed paired Alpha frontend publication — 2026-11-21

Published under the owner's explicit approval for Homepage draft PR #15 and the associated Process responsive preparation. Both applications are available for acceptance:

- [Explore Alpha](https://d6owpirihdsus.cloudfront.net/explore)
- [Decision Process Coach Alpha](https://d6owpirihdsus.cloudfront.net/process/)

Release `paired-alpha-ui-e44eb926-aaf4-4601-9b8f-65c311077eb1`. Fresh manifest SHA-256: `d323caef123fece2e2f797fecdf83779c5ac90f73cecce1af0b5b8adaa0a15cc`. No draft PR was merged. Documentation added after publication does not change the deployed source pins.

## Exact deployed versions

Website: `a9ebc7a9e56b5aeb9df54d7260b6058c43c7ee7c` on `codex/explore-scroll-refinement`. Process: `10e1d9ccafa561dea736333bd763bb1538969876` on `codex/process-responsive-clipping`.

Existing AWS account `771049112957`, S3 bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, region `us-east-1`, CloudFront `E1C4AJI9FUE47B`.

- Website HTML key `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled/index.html`: version `WCRidCoVSP8bibymptKxPZ6XWtdKAQUS`, ETag `215f398df428a3ea88631dfaa35a97d3`, SHA-256 `d73a7ca2bf60193b750be41b3c529d812969b0c91279a7b0000100d836d51d38`.
- Process HTML key `releases/decisionprocess-alpha/web/process/index.html`: version `OkuPZc3xyU.shza5hbTTBqCg.Oxm.Gw0`, ETag `37531095f71fcdb05897c4a539aa6119`, SHA-256 `e4595594f65f7b4e74a20d2c1b108ea2aca5d1d9c9441bbf56182445660d1e3d`.
- One scoped invalidation `I4QU9PLWL94821C8QVXO3LT2RV`, confirmed **Completed**. Paths: `/engent-alpha/*`, `/explore`, `/explore/*`, `/process`, `/process/*`.

Exactly six immutable asset writes used `If-None-Match:*`, followed by two HTML writes using captured `If-Match` ETags, and the one invalidation. Process owner published its own four assets and HTML; Homepage published its two assets and HTML and coordinated invalidation. Every write has a durable acknowledgement. [Release receipt](hosted/release-receipt.json) records all six asset SHA-256 values and S3 versions, both HTML versions, and rollback baselines.

Website assets: `index-BE9DTgyc.css`, `index-C7EyrWlb.js`. Process assets: `index-BOTcVSfR.css`, `index-CxOuJS-b.js`, `decision-pdf-dz8Gyj82.js`, `index.es-B0STP7WZ.js`. The last two filenames were investigated before writes: circular generated import references propagate a CSS filename change into three JavaScript chunk names. [Exact comparison evidence](hosted/asset-reference-equivalence.json) confirms no JavaScript behavior, dependency-lock or Vite configuration change. A backup-read helper argument issue was also corrected before any publication writes; no mutation was retried blindly.

## Hosted acceptance

- [Nine public hash checks](hosted/public-hashes.json) passed: homepage/Explore/Process HTML and every new asset match the frozen artifacts.
- [Website hosted results](hosted/hosted-results.json): 16 layout/scroll measurements passed across 1440, 1024, 768 and 390px and native Chrome window resizing 1440 → 1024 → 768 → 1440. No nested body/root vertical scrollports or page horizontal overflow. Logo, launch links, in-page navigation, email-form dismissal, Process direct navigation/refresh/return to Explore, and actual hosted MP3 play/pause passed.
- [Process hosted results](hosted/process-hosted-results.json): all four widths and all three stages passed without page overflow. Synthetic JSON Save → Open, browser recovery after reload, Guest navigation, correct new bundles, and no asset/JavaScript errors passed at each width.
- [Native Process desktop resizing](hosted/process-native-results.json): headed Edge with no viewport emulation passed all 12 stage checks during 1440 → 1024 → 768 → 1440 resizing. The original wide desktop layout is retained; the prepublication 1440px screenshot comparison was byte-identical.
- Fresh isolated Guest browser contexts blocked server writes, authentication writes and paid AI. Zero live verification-code requests, account changes, owner project operations or paid AI calls. Tests used synthetic local JSON and isolated browser recovery only. Hosted authenticated/paid-AI acceptance was not repeated or claimed for this CSS-only publication.

Hosted screenshots (see [prepublication before/after screenshots](README.md) for the original comparison):

- Explore: [1440](hosted/hosted-explore-1440.png), [1024](hosted/hosted-explore-1024.png), [768](hosted/hosted-explore-768.png), [390](hosted/hosted-explore-390.png).
- Process with synthetic objective content: [1440](hosted/hosted-objectives-1440.png), [1024](hosted/hosted-objectives-1024.png), [768](hosted/hosted-objectives-768.png), [390](hosted/hosted-objectives-390.png).

## Protected state and rollback

Read-only checks before publication and after both HTML writes confirm the same CloudFront configuration and backend aliases: platform Lambda **5**, Tree Lambda **18**, Process Lambda **6**. Administrator master AI remains **ON**, `suspended=false`, revision **9**. No Lambda/backend, authentication, IAM, Cognito, API configuration, Tree application, Production or DNS changes were made. No new resources or recurring fixed costs were introduced; ordinary small S3 and existing CloudFront usage applies.

Verified rollback backups remain available locally and in versioned S3:

- Website: version `CG8zJEaxZ0r8s8RRVyRyRc9bFmswtpzf`, ETag `59216bcc903a82446c615ecdbd5b38e3`, SHA-256 `e35451c7344852487c74d73f3fa1f8dee4dec7baa35d74c63adc29e99752da18`.
- Process: version `UZrpgJWz8doFwS2gY_bQAuPIElm0iXbe`, ETag `90fa6ac93521730ea0ea2907ce16d43a`, SHA-256 `93ef568811a355831018b33c2d13d051ea8c68d6e7c6d616411bf2d37beacee8`.

Rollback only release-owned HTML. Before restoring, verify current VersionId, ETag and `engent-release-id` against this release's acknowledged versions above. Restore the captured original bytes/metadata with an `If-Match` conditional write; refuse foreign or unacknowledged versions. Coordinate both owners, preserve all hashed assets and protected runtime state, then perform a scoped rollback invalidation if required. Never use destructive sync, delete objects, restore infrastructure configuration or overwrite a later release. Seven non-mutating ownership tests passed; actual baseline retrieval and checksums were verified. No rollback was needed or executed during this successful publication.

The fresh manifest, guarded website executor, captured HTML backups and durable website journal are retained under `.artifacts/ui-publication-20261121/` in the website checkout. Process owner retains its publication journal and backups under `.artifacts/ui-publication-process-20261121/paired-alpha-ui-e44eb926-aaf4-4601-9b8f-65c311077eb1/` in the Process checkout.

No unresolved publication blocker. Existing modern-browser CSS requirements and intentional table-local scrolling remain as documented. Alpha is ready for owner UX acceptance; Production is unchanged.
