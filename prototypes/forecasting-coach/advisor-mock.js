import { advisorModelInput, advisorRoute, maxAdvisorBytes } from "./management-advisor.js";

export function mockManagementDraft(request) {
  // The fixture uses only allowlisted facts. User strings never determine instructions or output text.
  advisorModelInput(request);
  const { objective, forecast, historicalPatterns, seasonalEffects, accuracy, variable } = request;
  const ambiguous = !objective.trim() || /\bleft\b/i.test(variable.name) || !/\b(stock|inventory|demand|capacity|staff|purchase|order)\w*/i.test(objective);
  const context = ambiguous
    ? "Before changing the plan, clarify what this measure represents and which decision depends on it. If higher values mean more work, the forecast may affect capacity; if they mean unused stock or spare capacity, the implications could differ."
    : "Keep the current operating plan as a baseline and compare it with the forecast before making commitments. Discuss which activities can continue as planned and which adjustments could be staged if the projected change materializes.";
  const action = forecast.method === "seasonal"
    ? (seasonalEffects ? "Review lead times before higher-index months, and identify which purchasing, scheduling, or staffing changes would be reversible." : "Review lead times and keep near-term operating adjustments reversible while evidence for seasonal differences remains limited.")
    : forecast.method === "moving" ? "Use the next-period estimate for near-term scheduling or replenishment. Keep longer commitments separate while more observations come in."
      : forecast.change.difference > 0 ? "Check whether current resources could absorb a sustained increase, and identify contingency capacity before making fixed commitments."
        : "Review which commitments could be adjusted if the projection holds, while retaining flexibility if the measure rebounds.";
  const monitoring = "At each reporting period, compare the actual with the forecast and the assumptions behind the plan. Reconsider if misses persist in the same direction or business conditions change.";
  const uncertainty = !accuracy.length ? "Comparable forecast errors are too limited to quantify the expected size of a miss."
    : historicalPatterns?.slopeEvidence === "Weak" ? "The historical direction has weak support, so avoid treating the projection as dependable."
      : "Historical misses give a sense of scale, while future misses could be larger.";
  return [context, action, monitoring, uncertainty, "Use the next review to agree who will monitor the measure and when management will revisit its decision."].join(" ");
}

export function advisorMockPlugin() {
  return {
    name: "loopback-management-advisor-mock",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== advisorRoute) return next();
        function reply(status, body) {
          res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(JSON.stringify(body));
        }
        const origin = req.headers.host && /^127\.0\.0\.1:\d+$/.test(req.headers.host) ? "http://" + req.headers.host : null;
        if (req.method !== "POST") return reply(405, { error: { code: "method" } });
        if (!origin || req.headers.origin !== origin) return reply(403, { error: { code: "origin" } });
        if (req.headers["content-type"] !== "application/json") return reply(415, { error: { code: "media_type" } });
        try {
          let bytes = 0;
          const chunks = [];
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes <= maxAdvisorBytes) chunks.push(chunk);
          }
          if (bytes > maxAdvisorBytes) return reply(413, { error: { code: "too_large" } });
          const request = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          return reply(200, { version: 1, requestId: "local-mock", draft: mockManagementDraft(request) });
        } catch {
          return reply(400, { error: { code: "invalid_summary" } });
        }
      });
    }
  };
}
