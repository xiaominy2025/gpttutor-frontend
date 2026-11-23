import { createAlphaAdvisor, forecastingLedger } from "./alpha-advisor.mjs";
import { alphaAdvisorGateway } from "./alpha-advisor-gateway.mjs";
import { forecastingGuestSession } from "./alpha-advisor-guest.mjs";
import { advisorDynamoStore } from "./alpha-advisor-store.mjs";
import { openAIAdvisorProvider } from "./alpha-advisor-provider.mjs";
import { advisorRoute, advisorSessionRoute } from "./management-advisor.js";

export const sharedModelParameter = "/decisionnavigator-alpha/openai-api-key";
export const signingParameter = "/forecasting-alpha/hmac-secret";
const origin = "https://d6owpirihdsus.cloudfront.net";
const unavailable = alphaAdvisorGateway(createAlphaAdvisor());

export function forecastingRuntime({
  enabled = false, verification = false, canary = false, expectedViewerIp, getItem, putItem, getParameter,
  apiId, stage, tableName, pilotId,
  startsAt, endsAt, boundInputTokens, model, inputRate, outputRate, fetcher, now
} = {}) {
  if (!enabled) return unavailable;
  // Verification and paid traffic must never share a ledger.
  if (!/^[a-z0-9-]{1,48}$/.test(pilotId ?? "") || pilotId.startsWith("verify-") !== (verification === true)) {
    return unavailable;
  }
  if (canary && (verification || !expectedViewerIp)) return unavailable;
  let sessionPromise;
  function readParameter(name) {
    return getParameter({ Name: name, WithDecryption: true }).then(response => {
      const parameter = response.Parameter;
      if (parameter?.Name !== name || parameter.Type !== "SecureString" ||
          typeof parameter.Value !== "string") throw new Error("Secure parameter unavailable.");
      return parameter.Value;
    });
  }
  const ledger = forecastingLedger(advisorDynamoStore({ tableName, pilotId, getItem, putItem }), pilotId,
    { admissionLimit: canary ? 1 : Infinity });
  const provider = verification === true ? {
    async plan() { return { inputBound: 1, reservation: 512 }; },
    async prepare() {
      return async () => ({ draft: "Alpha verification fixture. No model request was made.",
        cost: 0, inputTokens: 0, outputTokens: 0 });
    }
  } : openAIAdvisorProvider({
    model, inputRate, outputRate, boundInputTokens, fetcher,
    async readCredential() {
      const value = await readParameter(sharedModelParameter);
      if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(value)) throw new Error("Unexpected credential format.");
      return value;
    }
  });
  async function masterAllows() {
    const signal = AbortSignal.timeout(2000);
    try {
      const { Item } = await getItem({
        TableName: tableName, Key: { pk: { S: "AI#CONFIG" }, sk: { S: "STATE" } },
        ConsistentRead: true, ProjectionExpression: "suspended, revision"
      }, { abortSignal: signal });
      const revision = Number(Item?.revision?.N);
      return !signal.aborted && Item?.suspended?.BOOL === false &&
        Number.isSafeInteger(revision) && revision > 0;
    } catch {
      return false;
    }
  }
  return async event => {
    const context = event.requestContext;
    if (!apiId || !stage || context?.apiId !== apiId || context.stage !== stage ||
        ![advisorRoute, advisorSessionRoute].includes(event.rawPath) ||
        event.routeKey !== "POST " + event.rawPath) return unavailable(event);
    try {
      if (!sessionPromise) sessionPromise = readParameter(signingParameter).then(value => {
        if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error("Invalid Forecasting signing key.");
        return forecastingGuestSession(Buffer.from(value, "hex"), now);
      });
      const guestSession = await sessionPromise;
      const sourceIp = context.http?.sourceIp;
      if (expectedViewerIp && (!guestSession.ip(sourceIp) ||
          guestSession.ip(sourceIp) !== guestSession.ip(expectedViewerIp))) return unavailable(event);
      const handler = createAlphaAdvisor({
        enabled: true, providerBlocked: false, origin, startsAt, endsAt, guestSession,
        masterAllows, ledger, provider, now
      });
      return await alphaAdvisorGateway(handler, {
        trustedViewerIp: () => sourceIp
      })(event);
    } catch {
      sessionPromise = undefined;
      return unavailable(event);
    }
  };
}
