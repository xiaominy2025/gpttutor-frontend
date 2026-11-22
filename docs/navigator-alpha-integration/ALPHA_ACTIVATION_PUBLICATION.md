# Decision Navigator Alpha — publication results

**Navigator is live at [Alpha Explore](https://d6owpirihdsus.cloudfront.net/explore), immediately above Decision Process Coach. Anonymous AI is enabled on immutable Lambda version 3. All six initial Explore Play controls are bottom-right.** Master remains ON revision 11; Tree, Process, BFF, authentication and Production are unchanged. No draft PR was merged.

The one anonymous paid smoke returned HTTP 200 and its spending reconciles. A post-response harness capture did not finish; that limitation is preserved below. No second paid request was made.

## Published release

- Approved package `84f619c`; accepted runtime/frontend `934f2fd837423c45d77082566ba5f55a50df4771` (frontend implementation `97193e2`). Release `navigator-alpha-activation-116740a7-85c4-4d22-8ecb-16476bb1fc3d`.
- Reviewed plan SHA-256 `3fb84063ec2a5e8a32f50f44233796d6e5113da3df10f4e447685fbfd9853c2a`. All application source and artifact hashes matched the plan.
- Exactly **nine acknowledged publication mutations**: four conditional asset creations, one Navigator flag-only configuration update, one version publication, one alias move, one conditional HTML promotion and one scoped invalidation. No code upload, bucket sync, deletion, IAM/Cognito/DNS/API/CloudFront configuration change or resource provisioning.
- Existing Navigator function `decisionnavigator-alpha-api`, region `us-east-1`, account `771049112957`: **live → 3**, alias revision `6e6a8e54-8791-4e84-a4f9-f2a199daa444`, no weights. Published version revision `becb48a6-3c2e-4de4-88fa-54a43ab92bcb`; current private revision `05003427-52b9-4e03-857f-42f602cfde86`.
- Code hash unchanged: `HR0qCCO8wmix3FZNB28C+Cda8+sRNqYmBV9kPCUU+aw=`. Enabled configuration hash `ba9aa36b9460df90001794ac94687aba6ebb9be5d9015c82318486ad695e0872`. Only `NAVIGATOR_ENABLED` changed to true; STAGE=alpha, role, 256MB/29-second runtime and concurrency2 preserved.
- Website bucket `decisiontree-alpha-staging-frontend-vnhhrwadnpad`, existing HTML key `releases/engent-release-b-alpha/platform/b097a787d652d093bfb72f0f70303518b06ec876-enabled/index.html`: version **`PXUt3Uha5gZ2wAcc4ZJg6k55AI9qRMSd`**, ETag `7894d9dd7268c13a2961976ee3bfde39`, SHA-256 `dc03888c13a04bfe922ea3fe54bb55e0dd1e0761f6f9dbd13a942f4bca27b7e7`.
- Four reviewed assets published once, with version/hash/write receipts in [execution journal](activation/publication/execution.json). The other 31 assets were reused unchanged.
- CloudFront `E1C4AJI9FUE47B`: one invalidation **`I5S5O6MIK6P2OQ6X6UHLP5WH1R`**, Completed; paths `/engent-alpha/*`, `/explore`, `/explore/*`. Distribution configuration remained identical.

[Machine-readable summary](activation/publication/summary.json) and [final state](activation/publication/final-state.json) contain the exact versions and protected-state receipts.

## Focused hosted verification

[Protected browser results](activation/publication/ui-results.json) pass at **1440, 1024, 768 and 390px**: Navigator before Process, six coach sections/launch states, all six transparent bottom-right initial Play controls, sampled Process keyboard play/pause at each width, reduced-motion stills at390px, modal focus/Escape, no Explore horizontal or nested page overflow, direct navigation/refresh, Homepage preservation, Tree/Process Guest landing/back navigation and mobile podcast play/pause. Opening/closing Navigator generated zero bootstrap or AI requests. These tests blocked all mutations and paid calls.

Selected actual hosted screenshots:

- [Full Explore desktop](activation/publication/explore-1440.png) and [full Explore mobile](activation/publication/explore-390.png).
- [Navigator dialog desktop](activation/publication/dialog-1440.png) and [mobile](activation/publication/dialog-390.png).
- [Homepage](activation/publication/homepage-1440.png) and [podcast mobile](activation/publication/podcast-390.png).

Navigator has no podcast link or account/entitlement requirement. Existing coach descriptions, content, podcasts, launches and Homepage design were preserved. Authentication/MFA/project suites and the completed four-call canary were not repeated.

## One paid smoke and exact recorded spending

An isolated Guest browser made **one real bootstrap and one exact first-turn Navigator request**, with all other mutations/paid Coach routes blocked. The request returned **HTTP 200**. There were no model retries or follow-up sends.

Strongly consistent metering:

- Before: spent **1315 micro-USD**, reserved0, ledger version8.
- After: spent **1603 micro-USD**, reserved0, ledger version10, zero budget leases, paused=false.
- Exactly one admission/settlement pair. **Incremental conservative application charge: 288 micro-USD = $0.000288**, below the approved **$0.003** ceiling and computed $0.0015 reservation.
- Monthly total: **$0.001603** against unchanged $10 ceiling. Global concurrency leases0; accepted canary guard remains complete/spent1315/hold0. No spending record or journal was reset/refunded.

This is the actual application-ledger charge, not an invoice-reconciled provider bill. The public API does not expose token usage. No extra OpenAI request or new diagnostic infrastructure was used to retrieve billing/transcript details.

### Post-response automation limitation

The paid harness received HTTP200 but stopped during post-response checks before saving the reply text or screenshot. The [original failed harness receipt](activation/publication/paid-original-harness.json) is preserved unchanged; it is not relabeled as an automatic pass. The exact live reply and a live-reply screenshot are therefore unavailable.

Source inspection identified an incompatible test locator: it searched for an exact first paragraph, while the accepted UI renders the full multi-paragraph reply inside one `p` with `white-space:pre-wrap`. A [provider-blocked rendering check](activation/publication/render-check.json) reproduced that locator mismatch and verified full text, paragraph spacing and follow-up rendering using an accepted prior canary fixture. The [fixture screenshot](activation/publication/render-fixture-1440.png) is visibly labeled and is **not** the new live response. No application change or additional paid request was made. The paid harness also assumed exactly three optional follow-ups, which is stricter than the runtime's optional-path contract; that is not used to claim the live follow-up count.

[Read-only paid reconciliation](activation/publication/paid-reconciliation.json) verifies one request, HTTP200 and the 288-micro charge with zero reservations/holds. No security or metering defect was found; the live API and non-paid UI checks support keeping the approved Alpha active. The limitation is capture completeness, not unknown spending. The completed four-call canary remains the retained real-response quality evidence.

## Guarded execution findings

The existing lifecycle helper gained only support for the approved Configuration event, retaining its strict code/hash/configuration/audit checks (`66c9bcd`); **58 focused tests passed**. No application-source change was made.

Version publication advanced the private `$LATEST` revision. A guard stopped before alias promotion. Read-only reconciliation proved the sole acknowledged `PublishVersion20150331` event `3b52d299-7660-4bef-b2ff-0491d5179908`, the exact conditional input, immutable version3 and stable matching code/configuration/LastModified. The private CAS pin was updated only after that ownership proof. No publish operation was retried. Configuration enable event: `84efc865-9a35-4e89-8783-4bfbd3e92996`.

An early HTML prerequisite check started before the alias receipt was available and stopped locally without any S3 mutation. After the alias receipt completed, the HTML was promoted once. A non-paid browser assertion was adjusted to wait for the existing asynchronous Guest status. These were execution/harness corrections; there was no unowned overwrite, extra publication mutation, paid retry or application redesign.

## Protected state and rollback readiness

- Administrator master **ON**, suspended=false, revision **11**. No toggle or Administrator login/MFA test.
- Platform BFF/Tree/Process remain **5 /18 /6**, with unchanged alias revisions recorded in final state. No existing account, entitlement, session, project or Production mutation.
- Dedicated Navigator OpenAI SecureString remains **v3**, HMAC remains **v1**; no operator secret-value read or credential change. Existing $10/month and visitor/IP/concurrency controls unchanged. Shared pool/visitor limits remain deferred to the next AI-light Coach.
- Immutable **OFF version1** still has the original code and NAVIGATOR_ENABLED=false.
- Rollback HTML version **`WCRidCoVSP8bibymptKxPZ6XWtdKAQUS`**, SHA-256 `d73a7ca2bf60193b750be41b3c529d812969b0c91279a7b0000100d836d51d38`, is captured byte-for-byte with Git newline conversion disabled. Current release-owned HTML/version/ETag/body were verified after checks.

If rollback is needed, fresh-check current ownership, conditionally move only Navigator `live` from revision `6e6a8e54-8791-4e84-a4f9-f2a199daa444` to OFF1; restore only owned HTML using current ETag `7894d9dd7268c13a2961976ee3bfde39`; restore private flag false only if its revision/configuration remain owned; perform one scoped rollback invalidation if HTML changed. Preserve all immutable assets/versions, secrets, spending and uncertain usage. Never toggle the shared master or overwrite another release. The existing conditional procedure and earlier actual restoration evidence are reused; **no rollback was required or executed** for this publication.

No new fixed infrastructure cost. Ordinary existing AWS requests/storage/version/invalidation usage was not invoice-reconciled. No Production deployment or PR merge. Alpha is left available for owner use; no additional paid test is authorized by this report.
