# Homepage and Explore cosmetic review

Review-only CSS refinement based on published platform source 16c12f0 / receipt f169495 and canonical Playbook v2.6 Section 3. No deployment or AWS changes.

## Application change

Only src/components/marketing.css changes: a small discovery-page surface/contrast block. Warm-white paper (#fffefb), very light sage hero/bands (#f9fbf6/#f4f8f2), deeper heading ink (#203b40), quieter card borders/shadow, and white launch/play controls with the existing green icons. Font sizes, line heights, breakpoints, spacing, layout, content and behavior remain unchanged. Podcast pages are explicitly excluded. Watercolor stage paper/separator tokens are retained to preserve artwork.

## Evidence

Actual Production baseline and local candidate full-page screenshots at1440/390px,100% zoom/device scale1, retained under .artifacts/homepage-cosmetic-review/{before,after}-{home,explore}-{1440,390}.png. Reduced-motion captures provide stable stills; normal-motion controls tested separately. Images were fully loaded and each stage brought into view before capture.

Build passed. Local browser checks passed at1440,1024,768,390 including desktop resizing and no page overflow. Baseline/candidate heading text/order and exact link destinations match in all four captured views. Sampled heading/body/link contrast7.53:1–11.92:1. This is focused contrast sampling, not a complete accessibility audit.

Six animation Play/Pause/Replay controls, reduced-motion stills, Navigator illustration pause/dialog/focus restoration, launch tooltip keyboard/Escape/focus44px target/26px icon, account menu Escape/outside-click, and actual podcast playback/pause/episode switching passed. Podcast palette remains unchanged. Authentication and AI calls were mocked/blocked; zero live POSTs. Existing authentication/AI/analytical evidence was reused.

## Review preview

Local static preview: http://127.0.0.1:4197/ and http://127.0.0.1:4197/explore . A Guest session fixture is used solely by the local preview. All other API requests are unavailable; no real sign-in/email/AI backend is connected. Individual Coach applications are not served by this local website preview. Source navigation URLs are unchanged.

## Reversibility and publication boundary

One independently revertible CSS change. No Coach app, backend, API, shared authentication source, infrastructure, credential, media or analytical changes. Production and Alpha remain unchanged. Await owner visual review before any publication. On later approval, use the existing immutable-assets/conditional HTML procedure and retain the prior HTML/assets for rollback; no new infrastructure is required.
