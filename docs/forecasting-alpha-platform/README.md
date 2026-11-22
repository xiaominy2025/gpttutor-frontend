# Forecasting Alpha platform integration

Bounded Alpha authorization confirmed by owner. Production unchanged.

The existing CloudFront function maps the exact Forecasting entry to the independent workspace; assets retain existing prefix stripping. No new distribution or origin. Published source 21854b3, LIVE ETag E3P5ROKL5A1OLE. See edge execution and hosted receipts.

Guest correction supersedes the unshipped Forecasting session RPC and fixed-return mechanism. BFF and shared authentication remain byte-identical to published source 86169e5. Forecasting uses optional existing central sign-in only; AI authorization must not depend on accounts.

Explore launch is enabled only by `node scripts/build-navigator-alpha.mjs --forecasting-integration`. Default builds keep Forecasting Coming Soon. Five focused route/launch regression tests and the Alpha build pass. Workspace owner separately published shared-header HTML SHA256 4f29addd5ccdd54d5e9520324c828e6a6dc20a955b62d9a54300740becb104aa; independently verified HTTP 200.

## Ownership and release boundary

Homepage owns existing edge function and platform root HTML. Forecasting owns forecasting/index.html, immutable workspace assets, dedicated API/runtime, guest quotas and accounting. Do not overwrite each other's HTML. No BFF, Tree, Process, Navigator runtime or credential changes.

Explore publication must capture current root HTML VersionId, ETag, body hash and ownership; verify all reused assets; conditionally create new hashed assets, conditionally replace only platform root HTML, then one scoped invalidation. Preserve all 39 MP3 assets and Navigator input resizing from 86169e5.

## Rollback

For root HTML, retain original bytes and metadata. Restore only if the current VersionId, ETag, release/write markers and body hash still match this release. Use IfMatch on its ETag and invalidate the same paths. Leave immutable assets in place. Stop on drift or uncertain writes.

For the edge function, original bytes are edge-live.js. Before restoring, require both LIVE and DEVELOPMENT still match owned candidate SHA256 ea0533f41e25a034a146c5bc7ef319d713f0f67735bf3bac020f1c3a07544c66 and current ETags; use conditional UpdateFunction then verify bytes/config and conditional PublishFunction. Do not overwrite a newer owner change. Coordinate because withdrawing this mapping removes the canonical workspace entry.

## AI blocker

No authorized Forecasting-specific model credential or scoped runtime IAM has been confirmed. Never reuse Navigator, Process or Tree credentials. Proposed owner-provisioned SecureString is /forecasting-alpha/openai-api-key. Dedicated guest HMAC, durable isolated $1 ledger, concurrency two and fresh fail-closed master read are runtime-owner responsibilities. Verify provider-blocked cookie and requestContext.http.sourceIp on the actual route before paid dispatch. No paid calls made by this platform workstream.

Coordination: frontend Issue #11 comment 7085460691.

## Published Explore launch

Source 1157c59645de1670fe934bf2f730e9ae821c696d, draft PR #20. Exactly two immutable JS files and one conditional root HTML replacement were published; invalidation I95R4STQE3PK09VVJNGUPSCODM completed. Root HTML VersionId 5kvb16lAupU03HGA82vpmk0IcLLgZ2.3, ETag d0e9dace98b8b6ba9a0bb95e2aa9bb37, SHA256 2d7c420d3b0c2df4f4eeb06b7d83c61b3dc52a1db326f5a406ef5361813d1c65. Prior HTML is captured for guarded rollback; no deletion.

The preflight initially stopped on a changed distribution ETag. Complete distribution configuration was identical, LIVE edge code and ownership matched, CloudTrail returned no UpdateDistribution events, and the workspace owner confirmed no edge changes. Reconciled current ETag E1U5RCOVU0NYF2 while retaining the unchanged complete configuration hash. Subsequent publication and verification passed. No drift guards removed.

Hosted Chrome passed Explore launch and Forecasting hard refresh at 1440, 1024, 768 and 390px, with no horizontal overflow or page errors. All six sections, seven case links and Tree/Process launch destinations retained. Browser blocked external traffic and all non-GET/HEAD requests; no sign-in codes or AI calls. The first smoke run counted links before Navigator's existing lazy load completed; the test was corrected to wait for the Navigator button. No product change was required.

All 39 MP3 recordings reused without uploads, and 56 reused immutable assets verified. AWS postflight confirms master ON revision 11, Navigator Lambda3, BFF5, Tree18 and Process6 unchanged. Forecasting owner advanced only their independently owned workspace HTML for seasonal typography; this platform publication does not own or roll back it. AI remains a separate blocked runtime milestone.

Publication evidence, exact operator, original HTML, asset hashes and screenshots are in publication/. The archived operator points to its original .artifacts paths: restore those reviewed evidence files there if needed, inspect current ownership read-only, and invoke only rollback. Never replay publish or overwrite newer HTML. No rollback was necessary or executed.
