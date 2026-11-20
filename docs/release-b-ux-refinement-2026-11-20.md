# Release B account UX refinement — 2026-11-20

Approved scope: Issue11 comment7047694107 and subsequent owner implementation authorization. Frontend source commit8054cf166f324024a6c8b64792816bc8d30860b8, branch codex/issue-11-email-bridge, draft PR12. No deployment, AWS/DNS modification, merge, backend/session-policy change, real OTP, account, project or paid-AI operation.

## Frontend changes

- Shared Header1.1.0 retains its default component props and native details toggle. New backward-compatible useEngentAccountMenu() provides openMenu({focusFirst=false}={}) and closeMenu({restoreFocus=true}={}). Outside pointer closes without stealing focus; Escape and completed actions restore focus to account summary.
- Guest closes directly; removed the intermediate confirmation/Account options state. Reopening presents the original account options without resetting any Coach workspace.
- Explicit entry=email opens/focuses the email form immediately, including query updates within the mounted SPA layout. No automatic email or preauth bootstrap request is made.
- Existing allowlisted handoff is preserved. Home, Explore (including trailing slash), all six case pages and Tree-origin entry retain their intents through verification, explicit retries and pending completion. No raw return URL, token URL or new transport added.
- Successful source logout stays on the current route, clears displayed account state and closes only after the existing participating-browser acknowledgement. Existing revocation broadcast retained. Failed/incomplete logout leaves the authenticated view/error visible rather than falsely claiming completion.
- Pending sign-in remains pending when the menu is merely dismissed. Explicit Guest cancellation checks the existing pending-signin-cancelled acknowledgement and closes only after success; failure keeps completion/error visible. Busy cancellation disables duplicate completion.
- Copy shortened to Guest/Student/Student·Tree Advanced, coach-specific role and a single browser sign-out scope sentence. Optional Advanced request form is behind an explicit Decision Tree access disclosure. Existing permissions, eligibility and request endpoints unchanged.

Files: src/shared/EngentHeader.jsx; src/components/ReleaseBAccess.jsx; src/components/Homepage.jsx; tests/platform/release-b-access.test.jsx; tests/platform/release-b-header.test.jsx; tests/platform/release-b-ux.test.jsx. No visual assets, animations, podcasts, layout CSS or backend files changed.

## Verification

- Full Vitest regression125 tests/25files passed;21 new focused UX cases cover dismissal/focus, Guest idempotence, mounted-query entry, source logout success/failure, pending cancellation,11 origin variants, arbitrary redirect rejection and explicit code retry. The mounted-query test was tightened afterwards and all21 focused cases reran successfully with unchanged runtime code.
- Release B-enabled frontend build passed (Alpha URL setting, local build only).
- Built-bundle desktop1365×900/mobile390×844 mocked Chrome review passed: Guest direct/reopen, outside click, Escape, immediate email focus, synthetic verification returning tree intent, logout staying on the case page, failure retaining state and no horizontal overflow. Local fixtures served every asset/API, and all non-fixture traffic was blocked: ZERO external requests forwarded, real emails, project mutations or paid AI. No live Alpha authentication was exercised.
- Loopback review timed out; switched to fully intercepted built assets rather than contacting live services. An initial outside-click target overlapped the menu on mobile; using a true outside viewport point passed. No app/layout change was made for either test-harness issue.
- git diff --check passed before source commit. Screenshots and sanitized mock request metadata: docs/evidence/release-b-ux-local/.

## Decision Tree ownership and handoff

Decision Tree chat owns Coach-specific implementation in draft PR16. Do not overwrite its current local-file-first candidate or reintroduce old cloud-recovery code. It received the interface before implementation and the exact committed shared source afterwards via owner-authorized chat coordination and Issue11.

Canonical src/shared/EngentHeader.jsx Git blob5600dfdb00b30364fb1c2699a8f58af68f72c3f7. Port identical JSX; update Tree's existing TS declaration to export:

    useEngentAccountMenu(): {
      openMenu(options?: {focusFirst?: boolean}): void;
      closeMenu(options?: {restoreFocus?: boolean}): void;
    }

Coach work: automatic Guest-capable entry, idempotent Guest action, successful page-local sign-out, shared dismissal/concise labels, asynchronous unsaved Save/Discard/Cancel protection and original-owner work isolation. Preserve centralized broker/root-lease revocation, existing fallback, Administrator separation and all permissions.

Tree chat's local reproduction confirmed Guest/menu issues; current B logout stayed on Tree even when the mocked response supplied a legacy logoutUrl. Therefore no redirect change to the existing B endpoint or already-supported returnTo=tree mechanism is warranted on that evidence. The source-side hidden email entry is corrected here. Legacy adapter behavior is not evidence of a current B-path redirect. Real owner-observed redirect conditions remain for separately protected Alpha validation if they recur.

## Coordinated Alpha gate — STOP, not deployed

Frontend is ready for coordinated local integration with the Tree port. Require matching shared blob and Tree tests/build/unsaved-work results in Issue11 before promoting a paired Alpha candidate. Once both source revisions are recorded, prepare a bounded Alpha validation package for approval: one-code origin-return, page-local logout, next protected request denial across participating tabs, independent-browser/Admin separation, Guest twice/no second prompt, and unsaved-work Save/Discard/Cancel. Do not authorize new users, project writes, paid AI, deployment or production through this report. Published Alpha/production remain unchanged by this work.
