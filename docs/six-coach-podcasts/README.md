# Six-Coach podcasts and launch-control candidate

Prepared on branch `codex/six-coach-podcasts-launch-controls`; implementation `7159053`, based on the published UI release 475913c and its documentation head 68e201c. **Not deployed or merged.**

## Inventory and mapping

Local source: `C:\Users\xmkya\Documents\Xiaomin Folder\Podcast projects\Engent Labs`.

- Decision Process: 7 recordings, 4 reused + 3 added. The initial two-missing estimate was corrected by the owner: **Fastenal, Uniqlo and Caterpillar**. Their supplied descriptions are used verbatim. Existing four metadata entries and MP3s remain unchanged. Numbered filenames give Monday-Sunday order; no Process playlist TXT exists.
- Forecasting: 7 recordings, ordered exactly by its supplied TXT subtitles.
- Scenario Analysis: 4 recordings, ordered exactly by its supplied TXT subtitles.
- Decision Tree: 5 recordings, ordered exactly by its supplied TXT subtitles.
- Simulation: all 6 published cases unchanged. One extra local `Module8_Simulation_Mark_Charlotte_REDOWNLOAD.mp3` is unmatched and excluded.
- Optimization: all 6 published cases unchanged.
- Navigator: 4 local recordings inventoried but excluded, as requested. No podcast section added.

Total: **35 playable episodes**, **16 published MP3s reused**, **19 new MP3s**, **79,583,162 bytes (75.90 MiB)** added. All 35 content hashes are unique. The local source files were read/copied only, never edited. Existing ten transcript assets remain intact; no new transcript/notes architecture.

Titles, descriptions, episode order and actual MP3 filenames: [readable mapping](episode-mapping.md). Absolute Windows paths, duration measurements, SHA256s and current published keys: [complete inventory](inventory.json). Original [playlist TXT copies](playlists/) and [owner Process metadata](process-owner-metadata.json) preserve provenance.

Content gaps: Forecasting/Scenario/Tree TXT files contain titles, not separate descriptions. Their title/context is shown without invented summaries. Simulation/Optimization also lack output playlist TXT files; existing approved metadata is preserved. There is no missing MP3 among the 35 integrated episodes. The unmatched Simulation file and Navigator recordings are intentionally not integrated.

## Minimal implementation

Reuse the existing ApplicationLibrary/EpisodeMedia, player controls, episode list, responsive styles and lazy audio loading. Additional collection data lives in coachPodcasts.json. New cases reuse each Coach's existing watercolor artwork rather than introducing new illustrations. Unrecorded Process placeholders are replaced by the three real supplied recordings.

One shared CoachLaunchControl supplies a 44x44 native link/button, light background, subtle border and green launch icon. No permanent text inside the control. Full accessible action name and the same hover/keyboard-focus tooltip; Escape dismisses it. Tree and Process retain existing destinations, and the signed-in Tree POST handoff retains its native submit semantics. Navigator retains its modal, focus-return reference, draft and conversation handlers, with the control under Meet Your Coach. Four unavailable Coaches retain Coming Soon and have no active launch control.

No backend/authentication/AI/Admin/shared-header/Coach-app source changes. No dependency additions, new player, infrastructure or deployment tooling.

## Tests and screenshots

- Alpha build passed (610 modules).
- Platform suite: **319 tests across 41 files passed**. Covers exact playlist order, title punctuation, owner descriptions, preservation of existing cases, all media URLs/files, unique audio hashes, icon accessibility/dismissal, native submit behavior and existing authentication/session regressions.
- Podcast/launch browser checks passed at **1440/1024/768/390**: all 35 actual MP3s decoded and played, pause and episode switching (including stopping prior audio), keyboard episode selection, duration sanity, six direct podcast routes/refresh, three 44px launch controls, hover/focus/Escape tooltips, direct mobile taps, Navigator modal/draft/focus return, launch destinations, no missing assets/page errors/horizontal or nested root scrollbars.
- Native Chrome desktop resizing passed through 1440/1024/900/800/768/600/1440 on Homepage and Explore. 390px uses viewport emulation because Chrome has a minimum desktop-window width.
- Navigator regression passed at all four widths: six animation play/pause/replay controls, reduced motion, account UI dismissal, four-turn mocked dialog/continuation/reset/draft behavior. Real email, project writes and paid AI calls: **zero**. Analytics requests were blocked locally; no third-party test data was sent.
- Baseline preservation tests caught a punctuation encoding mismatch during preparation; it was corrected and the complete final suites passed. The old launch-style assertion was narrowed from hidden button font metrics to the visible icon control's dimensions/colors/border; no UI behavior was changed to satisfy it.

Evidence: [podcast/launch results](after/results.json), [animation/Navigator results](navigator-animation-results.json), [baseline layout](before/layout.json).

Full-page Homepage/Explore screenshots at four widths: [before](before/) / [after](after/). Each Coach's podcast page has desktop/mobile screenshots in after/.

- [Explore desktop before](before/explore-1440.png) / [after](after/explore-1440.png)
- [Explore mobile before](before/explore-390.png) / [after](after/explore-390.png)
- [Navigator tooltip desktop](after/launch-navigator-focus-1440.png) / [mobile](after/launch-navigator-focus-390.png)
- [Process tooltip desktop](after/launch-process-focus-1440.png) / [mobile](after/launch-process-focus-390.png)
- [New Process episode desktop](after/podcasts-process-1440.png) / [mobile](after/podcasts-process-390.png)

Local read-only review: http://127.0.0.1:5261/explore (Homepage: /engent-alpha/). It blocks email, AI and project API calls and external analytics. Coach launches use the existing Alpha destinations. The candidate is not on the hosted Alpha site yet.

## Incremental cost estimate

No new resources or fixed fees. At S3 Standard US-East first-tier $0.023/GB-month, added MP3 storage is approximately **$0.0017/month**; allow less than $0.01/month including changed bundles/versioned HTML. [AWS public current rate evidence](s3-storage-rate.json), published November 21, and [S3 pricing](https://aws.amazon.com/s3/pricing/).

A mean new episode is 4.19 MB. 1,000 complete new-episode listens transfer roughly 4 GB: approximately **$0.35** at the US/Canada CloudFront $0.085/GB pay-as-you-go tier outside applicable free allowance, plus small request charges. Geography, replay/range requests and the account's shared allowances change actual charges; this is a model, not a billing forecast. CloudFront currently lists 1 TB/month and 10M requests in its allowance; no assumption that this account has unused allowance. [AWS CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/). No AI spending or AI budget changes.

## Proposed publication and rollback - owner approval required

[Exact candidate file hashes and reuse plan](publication-plan.json): **23 immutable uploads = 19 MP3s + 4 JS/CSS**, one conditional HTML replacement, one scoped invalidation. All 16 existing MP3 keys and unchanged vendor/artwork/transcripts are reused. No destructive sync or media re-encoding.

Target is the existing Alpha bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, prefix `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled`, distribution E1C4AJI9FUE47B. Paths: /engent-alpha/*, /explore, /explore/*. Production untouched.

Fresh read-only inspection confirmed current HTML VersionId `wCdDDWNmMOHhNQmA4SNGt0oCfVndyjef`, ETag `"ff8f7c8c4349f8d860c25c7906bd06bf"`, SHA256 `719f810995f3c6a27ff791a86d659cdc261a5b5ea57bbdc034a74effb335d2e1`. [Metadata](current-html-head.json) and [exact rollback bytes](rollback-index.html) captured. Recheck ownership, VersionId and ETag immediately before any approved publication; stop on drift.

After approval: rebuild the source pin and match hashes; stage missing immutable files with If-None-Match:* (reuse any verified identical existing object); conditionally promote HTML against current ownership/ETag; one scoped invalidation; hosted Guest media/launch/layout smoke checks without codes, projects or paid AI.

On failure: restore only this release-owned HTML, conditional on the future receipt VersionId/ETag/ownership, using captured bytes and original metadata; stop on conflicting ownership. Invalidate the same paths and verify previous working UI/media. Retain immutable assets and spending records. Do not restore the older pre-UI HTML or touch Navigator/master settings, Tree, Process, authentication or Production.

Navigator AI and Administrator master ON configuration remain untouched. No AWS writes or PR merges have occurred in this task. This plan grants no deployment authority.
