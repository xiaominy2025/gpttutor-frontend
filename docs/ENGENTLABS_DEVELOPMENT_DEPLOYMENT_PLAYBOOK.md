# Engent Labs — Development and Deployment Playbook

**Version:** 2.6 (UI design guidance and reference implementations)  
**Updated:** November 27, 2026  
**Status:** Canonical current engineering guidance on the default branch. This document records accepted engineering standards and standing authorization boundaries. It does not independently authorize material deviations from those boundaries.

## 1. Purpose and operating principles

Engent Labs builds interactive Decision Coaches that combine sound analytical methods, helpful AI interpretation and human judgment. Help users think systematically and reduce technical burden without removing intellectual engagement or human decision ownership. Analysis serves decisions, not the other way around. **Reuse what is proven; adapt where necessary; innovate where it matters.** Apply the 80/20 principle across design, evaluation, troubleshooting, testing and release. Prefer educational value, numerical correctness, practical management usefulness, security, simplicity, maintainability and proportional effort to elaborate technical architecture or redundant governance.

Engent Labs AI safeguards primarily protect against intentional excessive use, automated abuse and unauthorized access, rather than enforce precise financial control. Legitimate AI usage is a normal operating expense. Manage expenditure through provider-native usage monitoring and budget notifications; do not introduce application-level financial accounting without a demonstrated operational need. Existing Coach-specific policies remain in force until separately reviewed.

Before major work, examine accepted internal implementations, their release receipts, development history, failures and evaluations. Identify (a) what is already solved, (b) what is reusable and (c) what is genuinely new. Do not redesign settled infrastructure or optimize speculatively. Keep this a living, **single consolidated** guidance document, with detail and immutable evidence in linked GitHub source and Coach repositories.

## 2. Application categories, access and ownership

| Type | Examples | Shared integration |
| --- | --- | --- |
| A — Platform and discovery | Homepage, Explore, Navigator | Full platform header, navigation, registration, Release B SSO/account controls; Navigator inherits Explore UI and uses the nonfinancial AI-light runtime security policy |
| B — Authenticated Coaches | Decision Tree, Decision Process | Shared Release B SSO; server-verified, **Coach-specific** Student/Advanced entitlements; coordinated sign-out |
| C — AI-light Coaches | Forecasting, Scenario Analysis, Simulation, Optimization | Established AI-light header; anonymous Guest analytical/AI Advisor access; optional shared sign-in and verified read-only status; local Save/Open |

Do not create independent Coach account systems. Type B protected operations require server-side authorization; visible account status alone does not confer access. Advanced entitlement is not transferable between Coaches. Type C does not require attended Student/Cognito or Administrator MFA retesting for ordinary integration releases.

**Execution ownership:** Individual Coach teams own their specialized analytical engine, workspace, AI coaching, development, focused testing and Alpha acceptance. Homepage/Platform owns shared UI/navigation, Guest/SSO/security contracts, coordinated Production integration and Explore publication. GitHub issues/commits/PRs are the technical handoff record. This Best Practices guidance records standards and lessons; **it is not another release coordinator or approval gate**.

## 3. UI Design Guidance and Reference Implementations

### 3.1 Governing UI design philosophy

Optimize each Coach's interface for its **analytical function, educational purpose and user workflow**. This guidance provides recommended design principles, proven interaction patterns and reference implementations rather than rigid specifications. Maintain a recognizable Engent Labs identity and familiar shared interactions without sacrificing analytical effectiveness for visual uniformity.

**Functional effectiveness takes precedence over visual uniformity.** Reuse what is proven. Adapt where necessary. Innovate where it matters.

Maintain two related visual themes: a clean, professional, discovery-oriented **Public Website** (Homepage/Explore) and a minimalist, light, efficient **Coach Workspace** oriented toward analysis. Use accepted Production code and extracted verified design tokens as references, not invented colors or breakpoints. Existing platform security, authentication and authorization remain **mandatory**, independent of UI flexibility.

### 3.2 Common UI guidance

Encourage consistency when it improves usability:

- Branding, typography, color identity, shared navigation and clear visual hierarchy.
- Three established headers: **Platform** (full Release B SSO/account controls), **Authenticated Coach** (shared SSO and Coach-specific verified status) and **AI-light Coach** (Home, Explore, branding and read-only Guest/verified user status). Navigator inherits Explore's Platform header.
- Minimalist analysis-oriented workspaces and familiar toolbar icons, inputs, controls and interaction behavior.
- Consistent **New, Open, Save, Save As, Excel Export and PDF Report** functions where applicable.
- Native file-handle support where available, safe cancellation, unsaved-change protection and browser-compatible download fallback. Preserve complete editable project state and source workbook content where supported.
- Clear editing, **Apply, Undo, Confirm and Cancel** workflows, especially when changing variable mappings or replacing work.
- Readable charts, meaningful accessible colors, consistent units and numerical formatting, minimal visual redundancy.
- Clear separation of deterministic analytical insights, AI interpretation and human-owned management actions.
- Accessible controls, keyboard/focus behavior and responsive desktop/mobile layouts.

These are design conventions, **not mandatory identical implementations**. Reuse accepted shared components when available; otherwise reproduce familiar behavior without unnecessary technical dependencies.

### 3.3 Coach-specific design flexibility

Individual Coach teams own their specialized workspace design. Optimize panel proportions, navigation, inputs, tables, visualizations and analysis workflows for the particular decision-making method.

| Coach | UI priorities |
| --- | --- |
| Decision Tree | Graphical decision modeling and tree visualization |
| Forecasting | Historical data, trends and future projections |
| Scenario Analysis | Excel economic models, scenario comparison, sensitivity and decision exploration |
| Simulation | Excel economic models, probability distributions, uncertainty, risk and decision comparisons |
| Optimization | Excel economic models, objectives, decision variables, constraints and solution interpretation |

For spreadsheet-based analytical Coaches, make the source model and variable configuration understandable: distinguish **controllable decisions** from **uncertain conditions**, display units and formula/variable relationships where supported, and let users inspect the effects on model outputs. Do not imply full Excel functionality where it is not implemented. Preserve enough space for interpreting results rather than exposing only raw configuration.

The **45:55 two-panel layout, compact mapping tables, worksheet zoom, inline editing and decision dials** are proven reference patterns for appropriate Coaches, **not universal requirements**.

Do not impose identical layouts, visualizations, source code or a centralized component library.

### 3.4 Reference implementations and reuse

Before significant UI development, examine accepted implementations and identify reusable components, interaction patterns and design lessons. Distinguish accepted Production reference implementations from experimental Alpha features.

- **Scenario Analysis:** the accepted Production UI source `4240535a00bbabe5795b26eb166a45bd62779589` is a **primary reference for spreadsheet-based analytical workspaces**. See [accepted release evidence](https://github.com/xiaominy2025/gpttutor-frontend/issues/11#issuecomment-7232340830).
- **Forecasting:** reference its data/trend/projection workflows and management-oriented AI guidance.
- **Decision Tree:** reference its graphical modeling and visualization interactions.
- **Decision Process:** reference structured coaching and authenticated navigation.
- **Navigator and Homepage/Explore:** reference discovery, platform header, user status and established brand presentation.

Incorporate Simulation and Optimization lessons as their implementations are accepted. References provide tested ideas, not templates that must be copied wholesale.

### 3.5 Continuous improvement

Apply the 80/20 principle to UI design. Judge changes by functional effectiveness, ease of use, educational value, accessibility and maintainability. Improve interfaces when user value is meaningful; avoid cosmetic standardization. Do not redesign existing Coaches solely to conform to newer guidance.

Homepage/Platform owns shared branding, navigation, header and account contracts. Individual Coach teams own specialized workspaces and Alpha acceptance. Coordinate shared changes through GitHub; Homepage owns Production integration and publication.

## 4. Analytical workspaces, AI Advisor and exports

The deterministic analytical engine establishes facts and remains usable when AI is disabled, unavailable or provider-limited. AI interprets management implications; **human judgment decides and owns the action**.

Start AI Advisor work from successful Forecasting and Scenario implementations. Use focused analytical evidence, concise prompts, factual/shape guards, natural management communication, meaningful economic interpretation, practical actions, monitoring and adaptive management. A single provider request is preferable when sufficient. More context, longer prompts, multiple calls or better automated scores do **not** necessarily improve judgment. Compare actual outputs on representative cases; assess factual reliability separately from management communication, using human judgment alongside automation. Do not shorten responses at the expense of economic meaning or accuracy; stop optimizing when practical improvement is marginal.

### Local live AI development and optimization

Local live AI testing and iterative optimization are standard development activities covered by standing owner authorization for all Engent Labs Coaches. Reuse existing authorized OpenAI API credentials saved in the local development environment. Use actual AI responses to develop, evaluate and optimize prompts, analytical context, reasoning quality and management communication. Iterate as necessary to achieve satisfactory quality, reuse successful development and evaluation practices from existing Coaches, and apply the 80/20 principle: stop when further practical improvement becomes marginal.

Do not impose arbitrary API request-count limits, local testing budgets, per-iteration financial approvals or mandatory provider-free-only testing phases. Provider-free testing is a supplementary engineering practice, not a substitute or mandatory prerequisite for local live AI optimization. Manage API budgets and usage monitoring at the OpenAI API platform level. Routine local live AI testing does not require repeated discretionary owner approval. Determine testing effort by functional requirements, response quality and the 80/20 principle, without additional financial approval procedures.

Preserve credential security, authorized data scope and mandatory execution-tool approvals. Keep credentials out of source code, GitHub, browser bundles, prompts and diagnostic logs. Prefer synthetic or sanitized evaluation data unless real data is necessary and explicitly authorized. Never bypass execution rejections or automatically retry ambiguous paid dispatches. The bounded hosted AI canary guidance in Section 7 applies to deployment verification, not routine local AI development and optimization. Existing hosted security, authentication and Production policies remain unchanged.

Retain representative evaluation cases, accepted prompt/model configurations and meaningful comparison results in the relevant Coach repository, using privacy-safe evidence. No exhaustive experiment archive or separate reporting system is required.

**Common exports** (adapt contents to each method):
- **Save/Open Project:** preserve the complete, editable interactive workspace and necessary inputs/state.
- **Excel Export:** deliver numerical analytical data and preserve the source workbook content where supported.
- **PDF Report:** communicate analytical findings, current AI advice (when available) and human management actions; distinguish generated guidance from human decisions.

Reuse accepted export approaches and test changed functionality rather than imposing identical analytical layouts or reports on every Coach.

## 5. Current AI-light security and provider policy — superseding standard

This section applies to **Navigator and Type C Coaches**, **not automatically to Decision Tree or Decision Process**. Their existing policy remains unchanged until separately reviewed.

Reuse existing **environment-specific, server-side OpenAI credentials** (Navigator Alpha/Production SecureString references in AWS Parameter Store where applicable), exact route/Origin checks, signed Guest proof, optional verified shared session recognition, trusted gateway/IP provenance, proportionate atomic visitor/IP rate limits, expiring per-actor/global concurrency locks, replay/one-shot-dispatch protection, bounded input/output/timeouts and fresh server-side Administrator master AI ON/OFF checks before paid dispatch. Fail closed when essential security/admission state cannot be established. Never trust client-supplied forwarding headers or create automatic retries after ambiguous paid dispatch. Keep diagnostics minimal and privacy-safe; no raw IP, credential, cookie, workbook or narrative storage in request logs.

Concurrency locks **are execution safeguards, not financial reservations**. Release upon confirmed completion; retain only bounded locks/replay tombstones on uncertain outcomes, checked against expiry in application logic. DynamoDB TTL cleanup alone is not the enforcement clock. Preserve existing quota pools and counters across releases; Navigator and Scenario share their established pool while Forecasting retains its own existing pool. Do not silently reset or retune limits. Existing secure private Scenario adapter and exact IAM boundaries may be reused; no additional centralized service is required.

**Financial policy:** Use **provider-native usage monitoring and budget notifications**. Removing application-enforced monetary limits is an intentional owner-approved simplification and acceptance of financial risk. Provider notifications do **not** constitute guaranteed hard dollar caps; visitor/IP quotas, concurrency controls and the Administrator master switch reduce exposure but do not guarantee a maximum dollar cost. Reassess this policy only when actual usage, model pricing or public adoption materially changes; do not reintroduce financial infrastructure speculatively. No application-level monthly financial ledger, monetary reservation, settlement, cost attribution, financial reconciliation, price calculator, month rollover, application hard cutoff, separate Coach allowance, trial $1 cap or 48-hour pilot deadline is required. **The old combined $10-per-month hard application pool is superseded**; it is not an admission gate or a mandated provider budget value. Do not create a replacement accounting service, dashboard, scheduler or new provider key for each Coach. Provider-account notification recipients and actual billing require provider-side verification; missing confirmation is an operational follow-up, not an application accounting gate. Do not change provider organization settings affecting unrelated applications without specific authorization.

Historical financial records and release receipts are **read-only historical evidence**. Preserve appropriate archives and privacy protections; do not reconcile, refund, reset or delete them as part of normal AI-light requests. Old financial code, IAM grants and adapters must not be reintroduced through a standard build or rollback. **Do not generalize this retirement to Type B Coaches.**

## 6. Alpha/Production environments and reusable release patterns

Alpha is a **persistent** development/testing environment with live AI enabled under established security safeguards, not a temporary $1/48-hour trial. Maintain strict environment-specific credentials, routing, state and access. Use accepted Type A/B/C application patterns, existing AWS infrastructure/IAM, reusable templates and verified components. Routine authorized provisioning using accepted infrastructure templates and IAM patterns does not require repeated approval. Materially new architecture or substantial changes to security, cost or data integrity require escalation.

Develop and validate the specialized Coach in Alpha; hand off its **exact source commit, immutable artifact/hash, focused acceptance, dependencies, known limitations and independent rollback** through GitHub. Homepage coordinates Production releases and Explore. Combine related release windows when beneficial, but preserve Coach-specific ownership, immutable versions, safe independent OFF modes and compatible rollback floors. Conditional alias/HTML promotion should verify the expected revision/ETag/ownership. Do not blindly retry ambiguous writes.

**Preserve complete IAM policies when changing scoped grants.** A snippet containing only a changed statement is not a full replacement. Read back effective permissions and verify that required nonfinancial credential/master/log grants remain. Never broaden privileges automatically to repair a failed probe.

Normal rollback uses the applicable Coach-specific, revision-guarded known-good release or safe OFF mode. For Navigator and Type C Coaches, use compatible quota-only rollback versions, preserving proof/bootstrap, other Coach adapters, counters, replay protection and data; do not automatically restore superseded financial runtimes. Maintain the compatibility boundary when shared Navigator/Scenario components change. Preserve established rollback policies for Type B Coaches.

## 7. Proportional acceptance and troubleshooting

Test **new, changed or materially risky** behavior, not the entire accepted platform for every release. Reuse previously accepted Release B SSO, Cognito/MFA, entitlement, sign-out, UI, analytical, prompt/model, IAM and infrastructure evidence when their underlying assumptions remain unchanged. A new Coach release does not require a full regression campaign for unchanged Tree, Process, Navigator, Forecasting, Scenario, Cognito or Administrator functionality. Verify the new integration boundary and perform targeted regressions only where shared dependencies actually change. Do not repeat attended SSO, Student authentication or Administrator MFA tests for ordinary AI-light deployments.

| Change | Focused acceptance |
| --- | --- |
| Documentation | Accuracy, source references, obsolete-policy removal |
| UI-only | Build, affected navigation and responsive browser checks |
| Analytical engine/export | Numerical/Excel/PDF/local project correctness and changed user workflows; independent reference validation for new analytical methods |
| New AI-light Coach | Guest/Origin/IP proof, bounded input, master ON/OFF, atomic quotas, concurrency/replay, environment binding and analytical acceptance; normally **one bounded hosted paid AI canary per changed environment** where justified and authorized |
| Type B integration | Session and Coach-specific authorization |
| Shared SSO/security or material infrastructure | Coordinated affected cross-platform acceptance |

New analytical methods require independent mathematical validation or comparison with a trusted external reference (e.g., hand calculations, published benchmarks or established analytical software), including representative cases and relevant edge cases. Software regression tests alone do not establish analytical correctness.

For hosted deployment verification, provider-free fixtures, actual-role probes and focused regressions should precede any live canary. This does not impose a prerequisite on routine local live AI optimization (Section 4). Reuse Alpha analytical acceptance for Production; Production checks should focus on correct configuration, exact deployed artifacts, hosted security/AI behavior, navigation and rollback. Do not repeat broad test suites, MFA sessions or paid canaries without technical cause. An HTTP health 200 alone does not prove the user workflow works.

For failures: reproduce and inspect actual evidence first; distinguish CDN HTML fallback from JSON/API success, synthetic ingress from true browser/IP provenance, and historical conjecture from verified root cause. Make the smallest supported correction and retest affected boundaries. **Do not alter an accepted prompt, guard, model, or architecture to fix an unproven historical failure.** Preserve privacy-safe diagnostic IDs, response classes, source hashes and failed evidence as appropriate.

**Scenario 502 historical limitation:** the original Production 502 was **not reproduced**, and the original request body was not retained. A fresh authorized diagnostic returned a valid 200 narrative; its fixture is not claimed byte-identical to the old request. The exact historical rejection rule is unknown. No Advisor guard/prompt/model change was justified.

## 8. Standing authorization and execution boundaries

Routine development and tests (including local live AI testing and iterative optimization for all Coaches under Section 4), Alpha and Production deployments, approved bounded hosted paid smoke, routine provisioning using accepted AWS templates, standard AWS/route/Explore publication and release-owned rollback are covered by standing owner authorization **within established architecture, provider access and proportionate abuse safeguards**. This is not a blanket permission to cross an explicit review-only phase, execute a narrower restricted diagnostic or bypass tool/security approval. Standing owner authorization removes redundant project-level approval requests, not mandatory execution-tool security approvals when triggered. Honor direct owner instructions and tool-level execution blocks; **never attempt indirect execution around a rejection**. Do not add discretionary approval gates.

Escalate material deviations in security/authorization, provider cost exposure, destructive user-data operations, data integrity or substantial infrastructure/architecture changes. Do not demand repeated approvals or turn this documentation chat into a management layer.

## 9. Historical verified AI-light release snapshot (November 25, 2026)

**These are Lambda runtime alias versions, NOT frontend release numbers.**

| AI-light application | Alpha runtime | Production runtime | Reference |
| --- | ---: | ---: | --- |
| Navigator | 8 | 8 | Shared discovery/Guest conversation and quota-only admission; Production clean runtime after bridge retirement |
| Forecasting | 13 | 6 | Production quota-only direct runtime and management-oriented Advisor |
| Scenario Analysis | 6 | 6 | Production live Guest AI, private adapter v2, preserved analytical/Advisor baseline |

Scenario Production is published at [Scenario Analysis](https://www.engentlabs.com/scenario-analysis/) and [Explore](https://www.engentlabs.com/explore#scenario). **Simulation and Optimization** should start from these simplified patterns. This dated evidence is not permanent deployment configuration. Before deployment, always obtain fresh runtime versions, revision identifiers and rollback ownership evidence.

Final compatible OFF rollback versions recorded in the publication report: Navigator **OFF7**, Forecasting **OFF1**, Scenario **OFF1**. Tree/Process/SSO and existing projects were not changed by the AI-light migration.

Key evidence, in order:
- [Architecture review, 3ffe4a7](https://github.com/xiaominy2025/gpttutor-frontend/commit/3ffe4a7)
- [Alpha simplification, 9373d50](https://github.com/xiaominy2025/gpttutor-frontend/commit/9373d50)
- [Navigator and Forecasting Production, b15a373](https://github.com/xiaominy2025/gpttutor-frontend/commit/b15a373)
- [Scenario Production and final retirement, b7f86cd](https://github.com/xiaominy2025/gpttutor-frontend/commit/b7f86cd)
- [Scenario final completion report, Issue #11](https://github.com/xiaominy2025/gpttutor-frontend/issues/11#issuecomment-7177992491)
- [Scenario completion and diagnostic limitation](https://github.com/xiaominy2025/gpttutor-frontend/blob/b7f86cd/docs/scenario-forecast-production/scenario-quota-production-completion.md)
- [Sanitized Production receipt](https://github.com/xiaominy2025/gpttutor-frontend/blob/b7f86cd/docs/scenario-forecast-production/scenario-quota-production-receipt.json)
- [Original AI-light architecture assessment](https://github.com/xiaominy2025/gpttutor-frontend/blob/3ffe4a7/docs/ai-light-simplification/README.md)
- [Previous amendment proposal — historical](https://github.com/xiaominy2025/gpttutor-frontend/blob/3ffe4a7/docs/ai-light-simplification/playbook-amendment.md)

## 10. Historical and superseded guidance

Earlier v1.0–v1.5 proposals established the basic lifecycle, Type A/B/C headers, UI theme, shared access, prior financial-accounting contract, and proportional acceptance. **v2.0 was a draft consolidation; v2.1 integrated the completed migration and supersedes its AI-light financial passages.** Preserve earlier discussions/commits as historical decision records, not independently applicable active checklists.

**Specifically superseded for Navigator and Type C only:** canonical monthly monetary ledgers, a combined $10 hard application spending pool, dollar reservations and settlements, Coach monetary cost attribution, monthly financial reconciliation/hard shutoff, pilot $1/48-hour trial expiration, monthly reset financial testing, finance-aware rollback, and finance-specific IAM release gates. Existing security quotas/locks, exact credential scope, Guest verification, master control, monitoring and normal security expiration **remain current**. Do not silently remove equivalent requirements from Decision Tree or Decision Process.

### Revision history

| Version | Date | Consolidated change |
| --- | --- | --- |
| v1.0–v1.5 | Nov 24–25, 2026 | Development/deployment, shared UI/SSO, AI-light integration, proportional tests, Advisor reuse; earlier monetary rules now historical for AI-light |
| v2.0 draft | Nov 25, 2026 | Proposed unified guidance; financial AI-light sections superseded |
| **v2.1** | **Nov 25, 2026** | Consolidated post-Scenario Production playbook; provider-native usage notifications, quota-only AI-light security, exports, Advisor/evaluation lessons, focused release/diagnosis, verified runtime snapshot and superseded-policy annotation |
| **v2.2** | **Nov 25, 2026** | Clarified educational purpose, flexible UI guidance, routine provisioning authorization and independent analytical validation; documentation-only default-branch promotion |
| **v2.3** | **Nov 25, 2026** | Explicit financial risk acceptance, flexible UI implementation, acceptance evidence reuse, tool authorization distinction and historical release snapshot clarification |
| **v2.4** | **Nov 27, 2026** | Clarified standing authorization for local live AI development and optimization, distinct from bounded hosted deployment canaries; preserved execution-tool approvals and hosted policies |
| **v2.5** | **Nov 27, 2026** | Clarified abuse-first AI safeguards, local development flexibility, authorization wording, credential/data hygiene, reusable evaluation evidence and Coach-specific rollback scope |
| **v2.6** | **Nov 27, 2026** | Consolidated flexible UI guidance, shared interactions, Excel-based analytical workflows and the accepted Scenario Production reference; documentation only |

---

**Core rule:** Reuse proven solutions. Test what changed. Diagnose before altering. Preserve security and educational value. Escalate only what is material.