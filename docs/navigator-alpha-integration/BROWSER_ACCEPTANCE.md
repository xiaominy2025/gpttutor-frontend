# Navigator Alpha confined browser acceptance — PASSED

Executed under the owner's approval for the five-minute, Navigator-only, provider-free browser cookie/client-IP probe. **This was not paid testing, a master-control test or public Navigator activation. Navigator is restored to OFF.**

## Exact run and artifact

- Run: `navigator-browser-8f233a7e-3625-463c-84b6-4074ce5fd91c`.
- Executor source: `15f4809f226b2f7b72ac9d4c379c4db8e15fa4e5`. Reviewed probe/builder/browser-check source pin: `00cec89c87ad695abf067f0c8bf240b33e745c94`; core runtime/protocol/store source remains `934f2fd837423c45d77082566ba5f55a50df4771`.
- Frozen manifest window: **2026-11-22 00:57:52.748–01:02:52.748 UTC**, exactly five minutes. Manifest SHA-256: `9d9d42798b18fd8a1582f12539abfe7f9c3b6f92afdf60c6fe1e60084f67d013`.
- Exact ZIP SHA-256: `3f7c5214faa1f0de58a7751daa0c48b849c1373733709590a767308e25b1678f`. The builder verified reviewed source blobs and absence of the OpenAI URL/key-parameter path. No paid transport exists in this probe.
- Account/region: **771049112957 / us-east-1**; existing function `decisionnavigator-alpha-api`, API `8qmgd1ghdi`, integration `5wsf6z0`, CloudFront `E1C4AJI9FUE47B`. No route, distribution, stage, role or policy change.
- Navigator-only immutable provider-free version **2** was published. `live` moved conditionally **1 → 2 → 1** using revisions and test-owned version/description. Activation acknowledged **00:58:07.042 UTC**, restoration acknowledged **00:58:11.111 UTC**: 4.069 seconds between acknowledgements, within the frozen five-minute window. These are acknowledgement timestamps, not a claim of millisecond-precise server transition timing.

## Actual browser results

**One controlled network was sufficient; no second network or browser request retry was used.** A fresh isolated system Chrome context used proxy-free IPv4 connections, with DNS pinned to IPv4 addresses in memory. The expected egress address was independently obtained through AWS checkip in the same browser, retained privately, and supplied only to the direct-IAM challenge preparation. Neither it nor the API's source address was emitted in output/evidence.

Two marked same-origin POSTs used only the existing `/api/platform/navigator/session` route:

1. Bootstrap returned HTTP200 and set a real `__Host-engent-navigator` cookie. Chrome accepted it with **Secure**, **HttpOnly**, **SameSite Strict**, host-only domain and path `/`.
2. `document.cookie` could not read it. Chrome automatically returned it on the second POST; the actual core cookie validator accepted it. The injected credential callback stopped execution before quota admission, master/provider operations or any paid key read.

On both requests, actual API Gateway `requestContext.http.sourceIp` **matched the privately precommitted expected browser egress address**. The code did not substitute an unverified forwarded header. The response exposed only match/acceptance booleans and request IDs. This is positive hosted evidence for the tested controlled IPv4 path, not a claim of coverage for every IPv6/proxy/NAT topology or all header-spoofing scenarios. Those broader cases were not added to this bounded test.

All browser writes except these exact capability-marked probe POSTs were blocked. External traffic was blocked except the controlled checkip GET; no sign-in, project, recovery-sync or paid-AI operation was performed. No trace, HAR, screenshot or persistent browser profile was captured. The capability and cookie remained in memory; cookies/context/browser were cleared/closed afterward.

## Restoration and preservation

The public alias was restored first in `finally`, immediately after the browser pair, then original private code was restored conditionally:

- `decisionnavigator-alpha-api:live` → original OFF **version 1**; final alias revision **`9545575c-3a9c-4163-96cd-98f747a769e0`**.
- Original `$LATEST` code SHA-256 base64 **`HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`**; restored revision **`af771ffd-0d82-426c-af4e-c37bf8a2faa4`**. Environment remains `STAGE=alpha`, `NAVIGATOR_ENABLED=false`.
- Final restoration verified **2026-11-22 00:58:33.250 UTC**. Unmarked public bootstrap now returns **503 with no Set-Cookie**.
- Administrator master remains **ON**, `suspended=false / revision9`; no toggle occurred.
- Platform/Tree/Process aliases remain **5 / 18 / 6**, with their revisions unchanged. Homepage/Explore and Process HTML object versions/ETags unchanged; CloudFront config, API stage and Navigator integration hashes identical before/after.
- Read-only post-restoration GET checks: `/engent-alpha/`, `/explore`, `/process/` and Tree `/` all returned **200 HTML**. This verifies availability, not a repeat of authenticated/AI acceptance.
- Canonical Navigator monthly budget read was **absent before and after**. No real spending ledger was created, reset, reserved or settled. Provider requests/spend: **0 / $0**. The existing v3 OpenAI credential was not accessed by this probe.

The only synthetic record was a short-lived `NAVIGATOR#acceptance#probe#...` row containing hashes/phase/expiry. It had three conditional writes: prepare, bootstrap, verify. It expires at **01:02:53 UTC**; DynamoDB TTL deletion is asynchronous. The probe also enforces manifest expiry itself. Unrouted version2 is retained as an auditable provider-free artifact; no persistent diagnostic route or logging facility was added. No raw IP, cookie, capability, signing secret or credential was stored in the release evidence.

No changes to IAM, Cognito, DNS, existing secrets, authentication, other Coaches, Homepage content, Production or the installed CloudFormation template. Only the approved Navigator code/version/alias operations and one synthetic TTL record were used. No new service or fixed monthly fee is introduced; existing-service usage/storage charges are not invoice-reconciled.

## Preflight aborts and evidence

Two local preflights stopped **before any manifest or AWS write**. First, AWS CLI's successful empty response for an absent budget row exposed an empty-JSON parser assumption; read-only reconciliation confirmed exit0/no stderr/no item and the parser was corrected. Second, the bundled Playwright executable was absent; established system Chrome was available. Its isolated launch/IPv4/GET-only navigation was verified before proceeding. Neither abort published a version, shifted an alias, minted a challenge or issued a live probe POST. No ambiguous mutation or live request was retried. These are recorded separately rather than counted as hosted acceptance attempts.

Evidence:

- `final-acceptance-evidence/browser-probe-manifest.json` — exact frozen manifest bytes and hash.
- `final-acceptance-evidence/browser-probe-receipt.json` — sanitized browser results, source/artifact pins, protected before/after state, versions and restoration.
- `final-acceptance-evidence/browser-preflight-aborts.json` — the two non-mutating preflight aborts and resolutions.

Future guarded plans must use the **new restored alias revision** above, not obsolete initial revision `40267485-ed37-4a71-adbc-4a6c36ebb483`. Do not weaken a stale preflight guard or reuse a completed run journal.

## Remaining gates

Credential **format** at v3 and this confined browser-cookie/IP gate have passed. OpenAI credential validity/model access, a real coordinated master OFF/ON test, the exact max4/no-retry/$0.03 paid canary and final public Alpha activation remain unexecuted and require their applicable approvals. Preserve the ON master and OFF Navigator until then. No draft PR was merged.
