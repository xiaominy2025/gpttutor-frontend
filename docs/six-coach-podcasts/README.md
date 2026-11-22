# Coach and Navigator podcast review candidate

**Publication update:** owner-approved source `501f2b5` is now deployed to Alpha. See [final deployed versions, hosted tests and rollback evidence](publication/README.md). The reviewed preparation record below is retained as history.

Draft PR #18, branch codex/six-coach-podcasts-launch-controls. Latest implementation **2547486**. **Not deployed or merged.**

## Owner follow-up completed

The three Process episodes now use the supplied full phrases as their titles in both the list and selected heading, with the company shown beneath:

- Fastenal: **How Industrial Vending Transformed Supply Chain Management**
- Uniqlo: **How Simplicity and Innovation Built a Global Fashion Brand**
- Caterpillar: **How Predictive Maintenance Turned Equipment Data into Customer Value**

Navigator now has Business Case Podcasts and an Explore Cases link above Meet Your Coach. Its new page at `/explore/navigator/cases` uses the same ApplicationLibrary player/list, four recordings in supplied TXT order, and a return link to Explore. This owner request supersedes the earlier exclusion of Navigator podcasts. No Navigator AI or conversation runtime changes.

## Inventory

39 playable episodes: Process 7, Forecasting 7, Scenario Analysis 4, Decision Tree 5, Simulation 6, Optimization 6, Navigator 4. Reuse 16 published MP3s; prepare 23 new MP3s. Added audio: **97,232,076 bytes (92.73 MiB)**. All 39 hashes are unique. Source library read/copied only; no original files edited.

[Complete inventory](inventory.json) provides local Windows paths, MP3 filenames, durations, hashes, published keys and provenance. [Episode mapping](episode-mapping.md), [original playlists](playlists/), and [owner Process title clarification](process-owner-metadata.json) provide titles/order. Navigator's four cases are Morgan Stanley, Netflix, Zillow and UPS.

Simulation/Optimization entries and four existing Process entries remain unchanged. Process's seven recordings follow numbered Monday-Sunday order. Process has no playlist TXT; the owner supplied the three missing titles. Forecasting/Scenario/Tree/Navigator TXT files contain ordered subtitles but no separate descriptions: none were invented. Simulation's unmatched Module8 recording remains excluded. There is no missing MP3 among the 39 integrated episodes. Ten existing transcript assets are retained.

## UI and tests

Three shared light 44px icon launch controls retain hover/focus tooltips, screen-reader action names and direct mobile activation. Four unavailable Coaches retain Coming Soon. Tree/Process navigation and signed-in Tree native POST, Navigator modal/focus/draft/continuation behavior and six animation controls remain intact.

- Latest build passed (614 modules).
- Latest focused tests: **13 passed across 3 files**, covering Navigator dialog, all collection mappings/content preservation, owner full titles/company context, seven collections/39 unique assets and native launch semantics. Prior full suite: 319 passed across 41 files before this follow-up.
- All **39 MP3s** decoded and played in the browser; pause, episode switching/old-audio stop, episode order, keyboard selection and seven direct routes/refresh passed.
- Responsive/media/launch checks at 1440/1024/768/390 and native desktop resizing passed. Navigator addition/display smoke checks verified its Explore link, page, return navigation, and all three Process full titles/companies at all four widths. Final rendering uses the same tested audio bytes.
- All tests use intercepted local traffic: no live email codes, user/project writes or paid AI. Analytics requests blocked. No backend/authentication source or AWS configuration changed.

[Playback/layout results](after/results.json), [Navigator addition/title checks](after/navigator-addition-results.json), and [Navigator/animation regression](navigator-animation-results.json) contain evidence. The separate descriptions absent from TXT files are a content gap, not fabricated copy.

## Preview and screenshots

- [Local Explore](http://127.0.0.1:5261/explore)
- [Local Navigator podcasts](http://127.0.0.1:5261/explore/navigator/cases)
- [Local Process podcasts](http://127.0.0.1:5261/explore/process/cases)

Preview is read-only: email, project and AI calls are not forwarded. Coach launches use existing Alpha destinations. Hosted Alpha is unchanged.

- [Explore desktop](after/explore-1440.png) / [mobile](after/explore-390.png)
- [Process titles desktop](after/podcasts-process-1440.png) / [mobile](after/podcasts-process-390.png)
- [Navigator podcasts desktop](after/podcasts-navigator-1440.png) / [mobile](after/podcasts-navigator-390.png)
- [Icon tooltip desktop](after/launch-process-focus-1440.png) / [mobile](after/launch-process-focus-390.png)

Full-page before/after Homepage/Explore images at all four widths: [before](before/) / [after](after/). Other Coach pages have desktop/mobile images in after/.

## Costs and prepared publication

No new resources or fixed fees. Added MP3 storage is about **$0.0021/month** at the US-East S3 Standard first-tier $0.023/GB-month; under $0.01/month including changed bundles/HTML. [Current public S3 rate evidence](s3-storage-rate.json), [AWS S3 pricing](https://aws.amazon.com/s3/pricing/).

A mean new episode is about 4.23 MB. Roughly $0.35 per 1,000 complete new-episode plays at the US/Canada CloudFront $0.085/GB tier outside applicable allowance, plus small request costs; geography, replay/range requests and account allowances affect actual billing. [AWS CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/). No AI spending or budget changes.

[Publication manifest](publication-plan.json): **27 immutable uploads = 23 MP3s + 4 JS/CSS**, one conditional HTML replacement, one scoped invalidation. Reuse existing media/vendor/artwork/transcripts; no destructive synchronization or re-encoding. Owner approval required before any execution.

Use existing Alpha bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, prefix `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled`, distribution E1C4AJI9FUE47B; invalidation paths /engent-alpha/*, /explore, /explore/*.

Captured current baseline: HTML VersionId `wCdDDWNmMOHhNQmA4SNGt0oCfVndyjef`, ETag `"ff8f7c8c4349f8d860c25c7906bd06bf"`, SHA256 `719f810995f3c6a27ff791a86d659cdc261a5b5ea57bbdc034a74effb335d2e1`. [Metadata](current-html-head.json), [exact rollback bytes](rollback-index.html). Recheck ownership/version/ETag at execution and stop on drift.

After approval: rebuild pinned source/hash-check, stage only missing immutable assets conditionally, promote one HTML with If-Match, scoped invalidation and hosted Guest UI/media checks. On failure, restore only receipt-owned HTML conditionally with captured bytes/metadata, invalidate same paths and verify. Stop if another release owns HTML. Retain immutable assets, runtimes and spending records. Navigator AI/master ON, Tree/Process backends, authentication and Production remain untouched.
