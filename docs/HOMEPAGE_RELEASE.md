# Engent Labs homepage release

This procedure publishes the frontend SPA entrypoint and its fingerprinted bundles. AI Decision Tree Coach is the sole public tool launch. Its application publishes independently. The legacy `/labs` route is retained for direct access and has no public launch link.

## Build and approve

1. Build from the reviewed commit with `npm ci` and `npm run build`. For production builds, set `VITE_VERIFIED_DECISION_TREE_URL=https://decisiontree.engentlabs.com/` only after the independent application passes the launch checks in step 4. Preserve the existing legacy API configuration if direct legacy access is required. Record the commit and SHA-256 of the build's `dist/index.html`.
2. In staging, confirm the distribution, bucket, SPA fallback and API base against the environment inventory. Use a staging-specific AWS profile. Confirm that existing fixed-path assets (logo, media, course metadata) are available and unchanged. The release script refuses to publish changed fixed-path assets. Its scope is an existing site with an existing root entrypoint.
3. Run the publish procedure in staging. Verify the homepage on desktop and mobile, animation controls, direct load and refresh of `/explore` and podcast pages, no public legacy links, and exactly one launch destination on the homepage and Explore. Run rollback and verify the original entrypoint and assets, then republish the reviewed candidate. Keep the receipt directory for evidence. Run one publish or rollback at a time per distribution.
4. Verify HTTPS, direct load, refresh and authenticated access at the independent Decision Tree Coach production URL. Record any gaps. Obtain explicit owner approval for production, including the commit, target, artifact hashes and rollback baseline. Keep production credentials separate. Block publication if the Decision Tree production endpoint or sign-in cannot be verified.

The marketing pages show Decision Tree Coach as pending by default. After verifying the independent production destination, build with `VITE_VERIFIED_DECISION_TREE_URL=https://decisiontree.engentlabs.com/` to enable its launch link.

For local review, run `npm ci` and `npm run dev`, then open the printed URL. The homepage introduction runs in-browser from editable SVG diagrams. The Explore page contains individual guided illustrations and business-case podcasts.

## Design principle

Differentiate through decision-making intelligence and visual identity. Make everyday interactions familiar and effortless. Use standard keyboard-accessible navigation and media controls. Each podcast gallery uses one shared episode view. Add a player and transcript when approved media and copy are available.

## Reproduce the browser review

Install Playwright Chromium with `npx playwright install chromium`. Build with `VITE_VERIFIED_DECISION_TREE_URL=https://decisiontree.engentlabs.com/` to test the launch-enabled artifact locally. Use the same environment value for the browser script. A build with the variable unset is suitable for testing the pending state. Run `node scripts/review-homepage.cjs` from the repository root. It serves the built files through browser request interception, checks the six scenes during playback and in reduced-motion mode, verifies Explore and podcast navigation and the sole public launch target, and writes screenshots to `review-output`. Set `ENGENT_REVIEW_OUTPUT` to place them elsewhere. Add `--export` to render the MP4 with FFmpeg installed on PATH.

## Publish or roll back

Use PowerShell from the repository root. Supply the exact verified site bucket, CloudFront distribution and AWS profile for the approved environment. Create a fresh receipt directory for each publish. Use the same receipt directory, bucket, distribution and profile for rollback.

```powershell
./scripts/release-homepage.ps1 -Action Publish -Bucket <bucket> -Distribution <distribution> -Profile <profile> -Receipt <new-directory>
./scripts/release-homepage.ps1 -Action Rollback -Bucket <bucket> -Distribution <distribution> -Profile <profile> -Receipt <release-directory>
```

Publish verifies fixed-path objects byte for byte, uploads new fingerprinted bundles without removing older files, saves the current entrypoint to the receipt directory, then switches `index.html`. It invalidates `/`, `/index.html`, and the `/labs` and `/explore` route entries and waits for completion. The previous entrypoint remains usable because its assets are retained. Keep the receipt outside the build folder. If publication fails after switching HTML, use the same receipt to roll back. Rollback checks that the live HTML still matches this release or the saved baseline, restores the previous entrypoint and invalidates the same paths. Verify that the restored homepage matches the saved entrypoint and that its referenced assets load. If the restored version predates Explore, check that the homepage links reflect that version. Cached bundles from either release can continue to load.
