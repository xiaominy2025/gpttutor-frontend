# Simulation Production publication

Owner-approved frontend: 100f7be00d8867139513b94c639dbbb8415ecc04. Production ZIP: 2e604548e1af99ca5c0098d231f7c97a7c910826a928b045b4c8ba5c9d122575. Runtime binding source: dbe3c5a263dc8280724c477459277b62ab9f05bd; accepted Alpha analytical and Advisor behavior is reused.

Uses existing WWW CloudFront/S3 and HTTP API eoszayfkqd. Additive stack engent-simulation-prod owns isolated simulation-prod-api, simulation-prod-admission, their exact Lambda roles/log groups, immutable baseline versions, public live alias, two exact integrations/routes/invoke grants. No Navigator code or permission modification.

Advisor reads only existing Production raw-key SecureString /decisionnavigator-prod/openai-api-key and invokes private POST /internal/coaches/simulation/ai with SigV4. Broker reads only existing Production Guest signing parameter /decisionnavigator-prod/hmac-secret and fresh AI#CONFIG in decisiontree-prod-data. Broker atomically writes only NAVIGATOR#SIMULATION#* security quota/lock/replay records. No application financial accounting. Provider notifications remain operational monitoring.

Public POST /api/platform/simulation/management-perspective uses exact WWW Origin, trusted gateway source IP, signed Guest proof, bounds and fresh master checks. Private route requires AWS_IAM and exact simulation-prod-runtime assumed role. Accepted limits: Guest 2/minute, 5/day, 20/IP/day; one per visitor and two global concurrent. Do not silently retune them.

Sequence: verify pinned artifacts/current protected state; inspect additive change set; create initially OFF; provider-free qualified probe with scoped routes; exact frontend uploads and Simulation-only viewer mapping; hosted provider-free denial/replay test; immutable live runtime and conditional alias promotion; exactly one hosted Guest canary, no retries; conditional directory launch promotion; scoped invalidation and hosted navigation/responsive checks.

Rollback: conditionally restore only Simulation live alias to immutable OFF1 after checking its current revision/ownership. Keep accepted Alpha ON and all other aliases/master state unchanged. For website launch rollback, conditionally restore captured directory HTML after checking VersionId/ETag/write ID, retaining immutable assets. Viewer rollback restores captured prior code only if current LIVE/DEVELOPMENT hashes match this release; preserve any later owner's additions. Remove only release-owned routes if necessary, never shared API defaults. No user-project storage or account changes are part of this release.

Exact runtime versions, hashes, artifact S3 versions, alias revisions, acceptance and conditional rollback receipts are recorded in Issues #11/#26 and retained in the local .artifacts/simulation-production-100f7be execution journal. No full analytical campaign or attended sign-in/MFA repetition.
