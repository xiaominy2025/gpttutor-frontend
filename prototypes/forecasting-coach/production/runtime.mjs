import { createForecastingAdvisor } from "../alpha-advisor.mjs";
import { alphaAdvisorGateway } from "../alpha-advisor-gateway.mjs";
import { forecastingGuestSession } from "../alpha-advisor-guest.mjs";
import { boundAdvisorInputTokens, openAIAdvisorProvider } from "../alpha-advisor-provider.mjs";
import { advisorRoute, advisorSessionRoute } from "../management-advisor.js";
import { monthlyLedger, productionLedgerKey, verificationLedgerKey } from "./monthly-ledger.mjs";
import { productionDynamoStore } from "./dynamo-store.mjs";

export const productionOrigin = "https://www.engentlabs.com";
export const productionApi = "eoszayfkqd";
export const productionTable = "decisiontree-prod-data";
export const productionSigningParameter = "/forecasting-prod/hmac-secret";
export const productionModelParameter = "/decisionnavigator-prod/openai-api-key";
const unavailable = alphaAdvisorGateway(createForecastingAdvisor(), { origin: productionOrigin });

export function productionRuntime({ mode, expectedViewerIp, startsAt, endsAt, getItem, putItem, transactWrite, getParameter,
  fetcher, now = Date.now } = {}) {
  if (!["verify", "canary", "live"].includes(mode)) return unavailable;
  const verification = mode === "verify", canary = mode === "canary";
  const restricted = mode !== "live";
  if (restricted && (!expectedViewerIp || !Number.isSafeInteger(startsAt) || !Number.isSafeInteger(endsAt) ||
      endsAt <= startsAt || endsAt - startsAt > 300_000)) return unavailable;
  const available = () => !restricted || (now() >= startsAt && now() < endsAt);
  const ledger = monthlyLedger(productionDynamoStore({ tableName: productionTable,
    partition: verification ? verificationLedgerKey : productionLedgerKey, getItem, putItem, transactWrite,
    sharedBudget: !verification }), { verification, canary, sharedBudget: !verification });
  let session;
  async function secureParameter(Name) {
    const { Parameter } = await getParameter({ Name, WithDecryption: true });
    if (Parameter?.Name !== Name || Parameter.Type !== "SecureString" ||
        typeof Parameter.Value !== "string") throw Error("Production credential unavailable.");
    return Parameter.Value;
  }
  const provider = verification ? {
    async plan() { return { inputBound: 1, reservation: 512 }; },
    async prepare() {
      return async () => ({ draft: "Production verification fixture. No model request was made.",
        cost: 0, inputTokens: 0, outputTokens: 0 });
    }
  } : openAIAdvisorProvider({
    model: "gpt-6-luna", inputRate: 125_000, outputRate: 500_000, boundInputTokens: boundAdvisorInputTokens, fetcher,
    async readCredential() {
      const key = await secureParameter(productionModelParameter);
      if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) throw Error("Unexpected production credential format.");
      return key;
    }
  });
  async function masterAllows() {
    const signal = AbortSignal.timeout(2000);
    try {
      const { Item } = await getItem({ TableName: productionTable, Key: { pk: { S: "AI#CONFIG" }, sk: { S: "STATE" } },
        ConsistentRead: true, ProjectionExpression: "suspended, revision" }, { abortSignal: signal });
      const revision = Number(Item?.revision?.N);
      return !signal.aborted && Item?.suspended?.BOOL === false && Number.isSafeInteger(revision) && revision > 0;
    } catch { return false; }
  }
  return async event => {
    const context = event.requestContext;
    if (!available() || context?.apiId !== productionApi || context.stage !== "$default" ||
        ![advisorRoute, advisorSessionRoute].includes(event.rawPath) || event.routeKey !== "POST " + event.rawPath ||
        context.http?.method !== "POST" || (restricted && context.http.sourceIp !== expectedViewerIp)) return unavailable(event);
    try {
      session ??= secureParameter(productionSigningParameter).then(secret => {
        if (!/^[a-f0-9]{64}$/i.test(secret)) throw Error("Unexpected production signing key format.");
        return forecastingGuestSession(Buffer.from(secret, "hex"), now, "__Host-forecasting-prod");
      });
      const guestSession = await session;
      const handler = createForecastingAdvisor({ enabled: true, providerBlocked: false, origin: productionOrigin,
        guestSession, masterAllows, ledger, provider, now, available });
      return await alphaAdvisorGateway(handler, { origin: productionOrigin,
        trustedViewerIp: trusted => trusted.requestContext.http.sourceIp })(event);
    } catch {
      session = undefined;
      return unavailable(event);
    }
  };
}
