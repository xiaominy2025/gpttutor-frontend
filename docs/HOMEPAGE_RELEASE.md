# Engent Labs homepage release

This procedure publishes the frontend SPA entrypoint and its fingerprinted bundles. Practice Lab continues to use the existing `/labs` routing and API configuration. Decision Lab publishes independently.

## Build and approve

1. Build from the reviewed commit with `npm ci` and `npm run build`. Use the existing approved Practice Lab API base for the target environment. Record the commit and SHA-256 of the build's `dist/index.html`.
2. In staging, confirm the distribution, bucket, SPA fallback and API base against the environment inventory. Use a staging-specific AWS profile. Confirm that existing fixed-path assets (logo, media, course metadata) are available and unchanged. The release script refuses to publish changed fixed-path assets. Its scope is an existing site with an existing root entrypoint.
3. Run the publish procedure in staging. Verify the homepage on desktop and mobile, both launch links, direct load and refresh of `/labs`, course selection, query and follow-up. Run rollback and verify the original entrypoint and assets, then republish the reviewed candidate. Keep the receipt directory for evidence. Run one publish or rollback at a time per distribution.
4. Verify HTTPS, direct load, refresh and authenticated access at the independent Decision Tree Coach production URL. Record any gaps. Obtain explicit owner approval for production, including the commit, target, artifact hashes and rollback baseline. Keep production credentials separate. The proposed URLs are `https://engentlabs.com/`, `https://engentlabs.com/labs`, and `https://decisiontree.engentlabs.com/`.

## Publish or roll back

Use PowerShell from the repository root. Supply the exact verified site bucket, CloudFront distribution and AWS profile for the approved environment. Create a fresh receipt directory for each publish. Use the same receipt directory, bucket, distribution and profile for rollback.

```powershell
./scripts/release-homepage.ps1 -Action Publish -Bucket <bucket> -Distribution <distribution> -Profile <profile> -Receipt <new-directory>
./scripts/release-homepage.ps1 -Action Rollback -Bucket <bucket> -Distribution <distribution> -Profile <profile> -Receipt <release-directory>
```

Publish verifies fixed-path objects byte for byte, uploads new fingerprinted bundles without removing older files, saves the current entrypoint to the receipt directory, then switches `index.html`. It invalidates `/`, `/index.html`, and the `/labs` route entries and waits for completion. The previous entrypoint remains usable because its assets are retained. Keep the receipt outside the build folder. If publication fails after switching HTML, use the same receipt to roll back. Rollback checks that the live HTML still matches this release or the saved baseline, restores the previous entrypoint and invalidates the same paths. Verify both routes after rollback. Cached bundles from either release can continue to load.
