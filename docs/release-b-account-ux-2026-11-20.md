# Release B account UX corrections — local validation

Implements the owner-approved minimal plan from frontend Issue #11, comment 7051413012. No deployment is included. Existing published Alpha remains the rollback baseline (frontend `0dc4258`, Tree `4384f65`; platform Lambda 4 and Tree Lambda 17).

## Source pins

- Frontend runtime implementation: `bea0ba24e4e9dc1634ef1924659a19966719fd25`, branch `codex/issue-11-email-bridge`, draft PR #12.
- Tree implementation: `ffda73eb69bcd4ea4517fa575c8859be086459c6`, draft PR #16.
- Subsequent frontend documentation/evidence commits do not alter runtime source.

## Changes and contract

Homepage/Explore uses the compact `Advanced` status. The account menu says `Decision Tree access: Advanced`; approved-request chatter is hidden for Advanced, while Student access requests and pending status remain available.

The notification contract remains `BroadcastChannel('engent-browser-session')` with the string `revoked`. It is emitted only after acknowledged coordinated logout, and is only a hint to fetch authoritative status. It carries no identity, token, account, or permission. Receivers ignore other payloads. Homepage/Explore immediately revalidates even while hidden, using a no-store fetch. Request generations prevent older responses from restoring state after newer checks or acknowledged logout. Notification failures retain focus/visibility/30-second polling fallback and do not turn a successful server logout into failure. Same-origin notifications complement backend verification; they do not cross independently hosted origins.

Only an HTTP 429 from `email/start` explains the existing three-code-requests-per-email/15-minute-window policy. Other throttles retain generic guidance. No counters, provider policies, backend limits, automatic retries, or registration behavior changed.

Decision Tree owns its scoped menu and notification integration in draft PR #16. Shared Header v1.1.0 JSX/CSS and its public interface remain unchanged.

## Local evidence

- `npx vitest run tests/platform --maxWorkers=2`: 88 tests in 23 files passed, including eight new notification/race/menu/throttle cases.
- `npm run build`: passed. The final Alpha-enabled local build also passed using the existing build-release-b convention and a separate ignored output directory.
- `node scripts/test-release-b-account-sync.mjs <frontend-web> <tree-web>`: four paired flows passed (Student and Advanced at desktop 1365x900/mobile 390x844). Real browser channel delivery updated hidden Explore after Tree logout without focus or timer; role-specific menus, automatic Guest entry, synthetic sign-in return, and same-page logout passed. All requests were fulfilled from local assets/fixtures: zero real emails or forwarded AWS requests.
- Tree owner verification: 343 unit tests, 23 built-bundle browser tests, TypeScript and production-mode build passed. The initial concurrent unit run had a backend initialization timeout; the isolated full rerun passed.
- Shared JSX SHA256: `a6a21e110313f53b4274c3b9e2d15c2a8913b404124cf125e3cc74340e579459`; CSS: `3047654a78e263cebe4f50eb8956ea0a25edc1514989f2bc1eb7908052b17510`.
- Paired browser receipt: [paired-browser.json](evidence/release-b-account-ux-20261120/paired-browser.json).

During regression work, a malformed session fixture exposed that the existing response path accepted a body without `signedIn`. The corrected reader requires a boolean before updating account state; invalid/unavailable responses do not assert successful sign-out.

## Release boundary and remaining validation

Ready for a focused paired Alpha web update after exact commits and web artifact hashes are pinned and separately approved. Before any write, repeat the protected-state check, freeze existing HTML versions/ETags, and prepare conditional paired HTML rollback. Preserve platform 4 / Tree 17, production, DNS, IAM, Cognito, identities, Administrator MFA, and project data. This work neither authorizes nor performs deployment.

After an approved update, verify Guest menus, authenticated role labels and scoped menus, Tree-to-Explore sign-out freshness, immediate backend denial, independent-browser/Admin separation and the explicit rate-limit message. Local mocks are not a claim of new live Cognito acceptance. No new live verification code was requested. Existing owner projects were not opened; local JSON and unsaved-work regression evidence is maintained by the Tree tests. Basic Student live coverage still requires a distinct existing eligible Student, without creating or downgrading an account.
