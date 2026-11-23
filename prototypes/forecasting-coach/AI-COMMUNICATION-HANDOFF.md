# Forecasting Coach AI Communication Advisor handoff

**Status:** Proposed for platform review. Forecasting Coach has an inactive local Advisor panel and a working manual communication field. This proposal adds no runtime route, credential, cloud resource, or model call.

[GitHub handoff for platform and owner review](https://github.com/xiaominy2025/gpttutor-frontend/issues/16#issuecomment-7080796167)

## Verified Navigator platform

- Navigator Alpha is enabled on Explore with the dedicated Navigator runtime at version 3. The [Alpha publication receipt](https://github.com/xiaominy2025/gpttutor-frontend/issues/11#issuecomment-7074540663) reports a single authorized paid smoke. Production was unchanged by that publication. The [pinned production adapter](https://github.com/xiaominy2025/gpttutor-frontend/blob/d6ca341656d1a246ca3c2d7d3ce44ca822876949/server/platform/release-a-production.mjs) is authentication-only.
- Alpha uses same-origin POST `/api/platform/navigator/session` for a signed, host-only, HttpOnly, Secure, SameSite Strict anonymous cookie. POST `/api/platform/navigator` accepts a bounded `message`, alternating `history`, and optional `continuation` and `dimension`. It returns `reply` and turn metadata with a bounded continuation. Origin is verified. Navigator callers use guest controls even with a platform account cookie. This route is purpose-built for Navigator and does not authorize Coach drafting. [Runtime](https://github.com/xiaominy2025/gpttutor-frontend/blob/934f2fd837423c45d77082566ba5f55a50df4771/server/platform/navigator-runtime.mjs) · [Navigator frontend](https://github.com/xiaominy2025/gpttutor-frontend/blob/934f2fd837423c45d77082566ba5f55a50df4771/src/components/DecisionNavigator.jsx)
- Current Alpha limits are five requests/day and two/minute per visitor, one in flight per visitor, 20/IP/day and two in flight globally, with a $10 UTC-month ledger. The runtime checks the shared AI master switch immediately before dispatch, reserves spend before dispatch, settles against provider usage, retains conservative holds when outcomes are unknown and does not retry the provider automatically. The server uses a dedicated stage-scoped OpenAI SecureString and server-configured Standard GPT-6 Luna with Responses `store:false`. Platform data excludes request bodies, cookies and decision text. Bounded hashed operational records expire. The runtime handoff specifies 14-day service log retention. [Navigator runtime handoff](https://github.com/xiaominy2025/gpttutor-frontend/blob/934f2fd837423c45d77082566ba5f55a50df4771/docs/NAVIGATOR_ALPHA_RUNTIME_HANDOFF.md)

## Proposed shared endpoint

Use a separate same-origin route on the approved platform, **POST `/api/platform/forecasting/communication`**, with JSON and `Cache-Control: no-store`. Reuse the same approved server-side credential infrastructure and stage separation. Widening access to Navigator’s dedicated credential requires platform and owner approval. Reuse the verified platform session as the actor. Recommend signed-in pilot access until the owner approves any guest use. Verify exact Origin and session server-side, including membership and applicable entitlements. Never accept a client-supplied Coach key, model, entitlement, or user ID as authority.

Example request, maximum proposed body size 4 KiB. All values are already calculated in the client. Period labels use ISO dates or numeric periods. Missing evidence and intervals use null, not zeros.

```json
{
  "version": 1,
  "objective": "Review next month's capacity",
  "variable": {"name": "Orders", "units": "orders"},
  "forecast": {
    "method": "moving",
    "frequency": "monthly",
    "horizon": 1,
    "reference": {"period": "2025-12-01", "value": 164, "kind": "actual"},
    "keyPeriods": [{"lead": 1, "period": "2026-01-01", "base": 170, "low": 158, "high": 182}],
    "change": {"difference": 6, "percent": 3.659}
  },
  "historicalPatterns": null,
  "accuracy": [{"lead": 1, "mae": 12, "tests": 24}],
  "limitations": ["one_period_only", "can_lag_changing_conditions", "planning_scenarios_not_intervals"]
}
```

- `objective` is optional and included only after user review, up to 250 characters. Forecast variable label and unit strings are bounded. Clients send at most five representative periods such as first, last, selected and seasonal extrema, and only paired accuracy for those lead times. `reference.kind` distinguishes an actual, fitted value, or forecast. `change` may be null. For regression, `historicalPatterns` may include the observed direction, slope evidence category, persistence/reversals/unclear, and separate runs evidence category. For seasonal forecasts, allow a compact record of the highest and lowest index and historical ratio counts. Keep request types and method limitations on allowlists.
- Send the user-visible summary only. Omit the raw workbook, observations, saved project, filename, account data, and handwritten communication by default. Provide user review and an explicit Send once enabled. Treat labels and objective as quoted data, with no tools or ability to modify state. Validate JSON shape, enums, sizes, finite numbers, horizon bounds and scenario consistency before admission.
- **Success:** `200 {"version":1,"requestId":"<opaque-id>","draft":"<plain-text draft>"}`. Target 100–150 words for management. Describe the principal change, assumptions, uncertainty and signals to monitor. Preserve units and periods, and distinguish MAE planning scenarios from statistical intervals. Avoid unsupported actions and invented company facts. Put the draft in a separate review surface. Copy or insert only on explicit user action, with overwrite confirmation for an existing message.
- **Errors:** Same versioned JSON with `error.code`, safe `error.message` and optional opaque `requestId`. Use 400/413 for invalid/oversized input, 401/403 for session or Origin denial, 429 for quota or budget (send Retry-After only when known), and 503 when the feature, service or accounting is unavailable. Never leak provider output on a failed request; keep manual communication usable. Disabled state makes no network trip.

## Release gates, attribution and estimate

Reuse server-side model config, master gate, fail-closed admission/reservation and settlement. The route determines the `forecasting-coach` metering key. Scope per-user quotas, rates, in-flight counts and budget independently from Navigator, with a platform shared cap where credentials are shared. Keep only opaque request ID, Coach, token counts, charges and coarse outcome in operational records. Review account/guest and rate values with the owner. No secret values in telemetry, browser files, project JSON or Excel. Use `store:false` and avoid transcript logging or persistence. Provider abuse-monitoring retention may still apply under the approved OpenAI project terms. Confirm terms, disclosure and retention before activation. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)

Budget estimate per communication at Navigator’s conservative Standard GPT-6 Luna ledger rates of $0.125/M input and $0.50/M output: **$0.00028–$0.00044** for 1,000–1,500 input and 300–500 billed output tokens. Excludes AWS usage, retries and longer requests. It is a planning estimate, not a billed measurement. Use measured Alpha usage and the approved model configuration for actual caps. [OpenAI model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna) · [Navigator rates and accounting](https://github.com/xiaominy2025/gpttutor-frontend/blob/934f2fd837423c45d77082566ba5f55a50df4771/docs/NAVIGATOR_ALPHA_RUNTIME_HANDOFF.md)

Approval required for route placement and shared credential scope, session/access policy, limits and separate attribution, model and retention policy, and any hosted validation. Start with provider-blocked tests for wrong Origin/session, bounded inputs, no content in logs, quota behavior, concurrent reservations, and draft isolation. Request separate approval for any Alpha paid canary.
