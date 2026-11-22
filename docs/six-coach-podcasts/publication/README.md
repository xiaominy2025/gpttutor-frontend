# Approved 39-episode Alpha publication completed

Released source **501f2b53216c643228b7e0997582e97fe178d885**, draft PR #18, November 22, 2026. Rebuilt source matched the reviewed 39-episode manifest. No product-source changes during publication. PR remains draft and unmerged; Production unchanged.

Live Alpha:

- [Explore](https://d6owpirihdsus.cloudfront.net/explore)
- [Homepage](https://d6owpirihdsus.cloudfront.net/engent-alpha/)
- [Process podcasts](https://d6owpirihdsus.cloudfront.net/explore/process/cases)
- [Navigator podcasts](https://d6owpirihdsus.cloudfront.net/explore/navigator/cases)

## Published versions

Exactly 29 AWS writes: 27 immutable assets (23 verified new MP3s + 4 JS/CSS), one conditional HTML promotion, one scoped invalidation. The existing 16 recordings were reused unchanged; no duplicate media upload or destructive sync.

HTML VersionId **7l9Gd8Oxe7TbHEbGhSarWDtjhoZ54Fjx**, ETag **"1a29d7b10df3ca43a405e36b80fab8fa"**, SHA256 **438c8ce47959c553a4d5b22e4246d89eea0401b9fd3b973ebc32c78fd1cdcc5f**.

CloudFront invalidation **I7Y86ZMRB2X449F30VEDDASKEI** completed on E1C4AJI9FUE47B: /engent-alpha/*, /explore, /explore/*.

Exact VersionId/ETag/hash for all 39 recordings and four bundles: [summary](summary.json). Original request acknowledgements and conditional-write journal: [execution](execution.json). [Plan and rollback metadata](plan.json), [source build receipt](build-receipt.json), [16 reused media versions](reused-media-versions.json).

## Hosted results

[CloudFront verification](edge-results.json) passed: nine HTML routes and four bundle hashes match the approved output; all 39 MP3 URLs return HTTP 200 with matching byte lengths/ETags and audio/mpeg type. Uploaded content was read back from its owned S3 version and SHA256-verified. Reused assets retain verified ETags, sizes and VersionIds.

[Hosted browser checks](hosted/results.json) passed at **1440/1024/768/390**:

- All 39 unique recordings started, advanced, paused and switched correctly on desktop; first two per collection repeated at narrower widths. These are playback smoke checks, not full-length listening.
- All seven podcast pages: expected titles and episode order, keyboard selection, direct navigation/refresh, audio duration sanity and old audio stopped on switching.
- Full Fastenal/Uniqlo/Caterpillar titles and company labels preserved. Navigator Explore Cases link and four-episode page present.
- Three 44px icon launch controls, hover/focus/Escape tooltips, direct mobile taps, real Guest Tree/Process destinations, Navigator modal draft/Escape/focus return.
- Homepage/Explore and media pages have no page-level horizontal or nested root scrollbars; native desktop resizing passed. No page errors.

All non-GET/HEAD requests were blocked before navigation. No project/authentication writes or paid AI calls occurred; no email codes requested. Analytics requests were blocked. Signed-in authentication and paid AI were not retested for this frontend/media-only release. Local acceptance evidence from the reviewed PR is retained.

The initial smoke harness had a reporting line hidden by a line comment. It was stopped and corrected, then the complete hosted checks passed. No application changes, extra publication or uncontrolled AWS retries were needed.

Hosted desktop/mobile screenshots: [Explore desktop](hosted/explore-1440.png) / [mobile](hosted/explore-390.png), [Process desktop](hosted/podcasts-process-1440.png) / [mobile](hosted/podcasts-process-390.png), [Navigator desktop](hosted/podcasts-navigator-1440.png) / [mobile](hosted/podcasts-navigator-390.png). All seven collections have desktop/mobile captures in hosted/.

## Preserved state

Navigator live **3**, Administrator master **ON revision 11**, platform BFF **5**, Tree **18**, Process **6**, with unchanged alias revisions and CloudFront configuration. No Lambda, IAM, Cognito, DNS, API, credentials, accounts, projects, spending ledger or Production changes. No new infrastructure or fixed costs. Ordinary existing S3/CloudFront storage/delivery usage only; OpenAI spending $0.

## Conditional rollback available

Preflight verified the current HTML owner/VersionId/ETag and captured exact bytes and metadata. Prior working baseline: VersionId **wCdDDWNmMOHhNQmA4SNGt0oCfVndyjef**, ETag **"ff8f7c8c4349f8d860c25c7906bd06bf"**, SHA256 **719f810995f3c6a27ff791a86d659cdc261a5b5ea57bbdc034a74effb335d2e1**. [Exact rollback HTML](rollback-index.html).

Reuse the guarded operator: `node .artifacts/podcasts39-operator.mjs rollback`. It checks current receipt-owned VersionId, ETag, release/write metadata and bytes; restores only HTML with If-Match using the captured baseline metadata; validates the restored hash and issues one scoped rollback invalidation. Stop on ownership drift. Retain immutable media/bundles and all runtimes/master/records. Rollback was not needed or executed.

Archive recovery: restore plan.json, execution.json and rollback-index.html to `.artifacts/podcasts39-publication-501f2b5/`, copy operator.mjs to `.artifacts/podcasts39-operator.mjs`, and restore the source-501f2b5 build/receipt before invoking it. Later documentation-only commits are permitted; frontend source drift stops the operator. Do not replay publish or reuse this release for future deployment.
