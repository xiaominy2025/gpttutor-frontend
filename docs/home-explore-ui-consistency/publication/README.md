# Alpha publication completed - November 22, 2026

Released source **475913ce987b8ce6a8e9ee5ac1fc11138542456e** from draft PR #17. Rebuilt output matched all four approved asset hashes and HTML. No source changes during publication.

Alpha URLs: https://d6owpirihdsus.cloudfront.net/engent-alpha/ and https://d6owpirihdsus.cloudfront.net/explore

## Deployed state

- Four immutable assets (If-None-Match:*), one existing HTML (If-Match), one scoped invalidation. Exact keys, checksums, VersionIds and acknowledgements: [execution](execution.json), [summary](summary.json).
- HTML VersionId `wCdDDWNmMOHhNQmA4SNGt0oCfVndyjef`, ETag `"ff8f7c8c4349f8d860c25c7906bd06bf"`, SHA256 `719f810995f3c6a27ff791a86d659cdc261a5b5ea57bbdc034a74effb335d2e1`.
- Invalidation `I4BMDS6RJ0HMUAK1Z7RLNPSYUO` completed on E1C4AJI9FUE47B, paths /engent-alpha/*, /explore, /explore/*.
- Navigator AI remains version 3; master ON revision 11. BFF 5, Tree 18, Process 6 aliases/revisions and CloudFront configuration unchanged. No Lambda, IAM, Cognito, DNS, API, credentials, spending records or Production changes. No PR merges.

## Hosted verification

[Edge hashes](edge-results.json): HTTP 200 and exact approved bytes for Homepage, Explore, podcast route and all four assets.

[Browser results](hosted/ui-results.json): all four widths 1440/1024/768/390; six circular controls match Navigator, keyboard play/pause/replay, reduced motion, modal open/focus/Escape/return, launch links, Guest Tree/Process navigation/refresh, podcast playback/pause, no page horizontal or nested root scrollbars, no page errors. Native Chrome resizing through 1440/1024/900/800/768/600/1440 passed on Homepage and Explore; 390px uses viewport emulation. Hosted screenshots are in [hosted](hosted/).

The first browser run paused before elapsed time advanced and expected Resume instead of Play. The harness was corrected to wait for elapsed progress, matching the already-passing local test. The full hosted check then passed. No application correction or additional publication was needed.

Every non-GET/HEAD request was blocked. Two attempts were blocked during Guest navigation; no project/account/authentication writes occurred. Navigator bootstrap and paid requests: zero. Signed-in authentication and live AI were not retested for this styling-only release. Previous local suite: 313 tests across 40 files passed.

## Conditional rollback ready

[Plan](plan.json) and [captured rollback HTML](rollback-index.html) preserve the exact prior working Navigator-enabled HTML and metadata, VersionId `PXUt3Uha5gZ2wAcc4ZJg6k55AI9qRMSd`, ETag `"7894d9dd7268c13a2961976ee3bfde39"`, SHA256 `dc03888c13a04bfe922ea3fe54bb55e0dd1e0761f6f9dbd13a942f4bca27b7e7`.

The existing local operator supports `rollback`: verify current HTML VersionId, ETag, ownership metadata and content against this release receipt; restore baseline bytes/metadata only with If-Match; verify restored hash and issue one scoped rollback invalidation. Stop if another release owns the HTML. Do not delete immutable assets or change any runtime/master setting. Rollback was not needed or executed.

Local command: `node .artifacts/ui-consistency-operator.mjs rollback`. Archive recovery: restore plan.json, execution.json and rollback-index.html to `.artifacts/ui-consistency-publication-475913c/`, copy operator.mjs to `.artifacts/ui-consistency-operator.mjs`, and use the pinned source/build receipt. Later documentation-only commits are allowed; frontend-source drift stops the operator. Do not replay `publish` or reuse this release for a future update.

No new fixed costs. This update incurred only ordinary existing S3/CloudFront request/storage usage, with $0 OpenAI spending.
