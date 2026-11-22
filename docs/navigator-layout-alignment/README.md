# Navigator layout alignment - review candidate

Publication update: owner-approved source `6ef1c6e` is now deployed to Alpha. See [deployed versions, hosted results and rollback evidence](publication/README.md). Preparation record below is retained as reviewed.

Branch `codex/navigator-layout-alignment`; implementation `397e8376aaa39a078cd8e9c316365f7b3eb01970`. Based on the published 39-episode release and its documentation head 39c1ef4. **Not deployed.**

Navigator's title, subtitle and description now precede the illustration/action grid. It reuses Process Coach's engent-coach-heading, engent-coach-content, engent-coach-actions and subtitle classes, replacing the old Navigator-specific grid/heading overrides. Scoped Navigator rules match Process's typography and paragraph spacing. The watercolor remains left and Podcasts/Meet Your Coach right; the shared 680px breakpoint stacks them naturally.

Exact copy:

- AI Decision Navigator
- See the bigger picture before deciding.
- Clarify your objectives, explore uncertainties, and recognize where human judgment matters.

Explore Cases, the compact launch control, the dialog/ref/focus/conversation handlers and existing animation are preserved. Only two product files changed: DecisionNavigator.jsx and Navigator.css. No other Coach section, animation artwork/timing, podcast data/media, shared header/authentication, AI or backend source changed.

## Verification

- Build passed (614 modules).
- Five Navigator UI tests passed: anonymous dialog opening, four-interaction continuation, draft/reopen/reset behavior, failed request/no retry, duplicate-submit guard.
- Browser regression passed at **1440/1024/768/390**: exact wording; computed heading/subtitle/description typography and margins, grid columns/gap/alignment and action heading styles equal Process Coach; header above illustration, left/right desktop and stacked mobile arrangement; no horizontal or nested root overflow.
- Same browser run preserved seven podcast links, launch destinations, keyboard Play/Pause/Replay, reduced motion, modal focus/Escape/draft/four-turn fixtures, and account UI opening/dismissal. No live API, sign-in codes, project writes or paid AI calls.
- Native desktop resizing passed through **1440/1024/900/800/768/680/600/1440**. 390px uses viewport emulation because Chrome has a minimum desktop window width.
- All 39 MP3 hashes match the published release; no media changes. NavigatorArtwork.jsx, CoachIntro.jsx, Homepage.jsx, shared header and backend source diffs are empty.

[Browser evidence](browser-results.json), [native resizing](after/resize-results.json), [candidate hashes](candidate-assets.json).

## Screenshots and local preview

[Local Explore preview](http://127.0.0.1:5261/explore) is read-only; refresh to see this candidate. Hosted Alpha still has the previously published layout.

- Navigator desktop [before](before/navigator-1440.png) / [after](after/navigator-1440.png)
- Navigator mobile [before](before/navigator-390.png) / [after](after/navigator-390.png)
- Explore desktop [before](before/explore-1440.png) / [after](after/explore-1440.png)
- Explore mobile [before](before/explore-390.png) / [after](after/explore-390.png)

Full-page and focused images at all four widths are in before/ and after/. Stills use reduced motion for repeatable visual comparison; the normal-motion controls were tested separately.

## Minimal future publication

Requires owner approval. Reuse the existing Alpha conditional publication procedure: three new hashed JS/CSS assets, one existing HTML promotion and one scoped invalidation. Reuse all media and other assets. No infrastructure or AI/authentication changes, and no material incremental costs.

At execution, recheck fresh current HTML ownership/version/ETag and capture its bytes/metadata. Last recorded 39-episode baseline: VersionId 7l9Gd8Oxe7TbHEbGhSarWDtjhoZ54Fjx, ETag "1a29d7b10df3ca43a405e36b80fab8fa", SHA256 438c8ce47959c553a4d5b22e4246d89eea0401b9fd3b973ebc32c78fd1cdcc5f. Stop on drift. Upload immutable assets conditionally, promote HTML with If-Match and invalidate /engent-alpha/*, /explore, /explore/* on existing distribution E1C4AJI9FUE47B.

If needed, restore only the future release-owned HTML conditionally to that captured working 39-episode baseline and invalidate the same paths; retain immutable assets. Preserve Navigator AI/master ON, all Coach backends, authentication, projects and Production. No AWS writes or merges occurred in this preparation.
