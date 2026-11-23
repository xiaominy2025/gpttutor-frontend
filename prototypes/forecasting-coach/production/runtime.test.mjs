import assert from "node:assert/strict";
import test from "node:test";
import { productionApi, productionOrigin, productionRuntime, productionSigningParameter, productionTable } from "./runtime.mjs";
import { advisorSessionRoute, advisorRoute } from "../management-advisor.js";
import { verificationLedgerKey } from "./monthly-ledger.mjs";

const start = Date.UTC(2026, 10, 30, 23, 59);
const ip = "192.0.2.91";
const event = (path = advisorSessionRoute, headers = {}, body = "{}") => ({
  version: "2.0", rawPath: path, routeKey: "POST " + path,
  requestContext: { apiId: productionApi, stage: "$default", http: { method: "POST", sourceIp: ip } },
  headers: { origin: productionOrigin, "content-type": "application/json", ...headers }, body
});
const payload = JSON.stringify({
  version: 1, objective: "Review staffing", variable: { name: "Orders", units: "orders" },
  forecast: { method: "moving", frequency: "monthly", horizon: 1,
    reference: { period: 12, value: 80, kind: "actual" }, change: { difference: 10, percent: 12.5 },
    keyPeriods: [{ lead: 1, period: 13, base: 90, low: null, high: null }] },
  historicalPatterns: null, seasonalEffects: null, accuracy: [], limitations: ["missing_historical_accuracy"]
});

test("production OFF fails closed with no dependencies and restricted mode rejects unbound API or IP", async () => {
  const denied = () => assert.fail("Unexpected hosted dependency access.");
  const off = productionRuntime({ mode: "off", getParameter: denied });
  assert.equal((await off(event())).statusCode, 503);
  const verify = productionRuntime({ mode: "verify", now: () => start, startsAt: start, endsAt: start + 60_000,
    expectedViewerIp: ip, getParameter: denied });
  const wrong = event();
  wrong.requestContext.apiId = "8qmgd1ghdi";
  assert.equal((await verify(wrong)).statusCode, 503);
  const otherIp = event();
  otherIp.requestContext.http.sourceIp = "192.0.2.92";
  assert.equal((await verify(otherIp)).statusCode, 503);
});

test("provider-free production acceptance binds exact origin, strong master and isolated ledger", async () => {
  let item = { revision: { N: "1" }, state: { S: JSON.stringify({
    day: "2026-11-30", months: { "2026-11": { spent: 0, reserved: 0 } },
    leases: {}, requests: {}, paused: false, canaryUsed: false
  }) } };
  let master = false;
  const verify = productionRuntime({
    mode: "verify", now: () => start, startsAt: start, endsAt: start + 60_000, expectedViewerIp: ip,
    async getParameter({ Name, WithDecryption }) {
      assert.equal(Name, productionSigningParameter);
      assert.equal(WithDecryption, true);
      return { Parameter: { Name, Type: "SecureString", Value: "ab".repeat(32) } };
    },
    async getItem(request) {
      assert.equal(request.TableName, productionTable);
      assert.equal(request.ConsistentRead, true);
      if (request.Key.pk.S === "AI#CONFIG") return { Item: { suspended: { BOOL: !master }, revision: { N: "1" } } };
      assert.equal(request.Key.pk.S, verificationLedgerKey);
      return { Item: item };
    },
    async putItem(request) {
      assert.equal(request.Item.pk.S, verificationLedgerKey);
      assert.equal(request.ExpressionAttributeValues[":expected"].N, item.revision.N);
      item = request.Item;
    },
    fetcher: () => assert.fail("Unexpected paid call.")
  });
  assert.equal((await verify(event())).statusCode, 503);
  master = true;
  assert.equal((await verify(event(advisorSessionRoute, { origin: "https://d6owpirihdsus.cloudfront.net" }))).statusCode, 403);
  const ready = await verify(event());
  assert.equal(ready.statusCode, 200);
  assert.match(ready.cookies[0], /^__Host-forecasting-prod=/);
  const result = await verify(event(advisorRoute, { cookie: ready.cookies[0].split(";")[0] }, payload));
  assert.equal(result.statusCode, 200);
  assert.match(JSON.parse(result.body).draft, /No model request/);
  assert.equal(item.revision.N, "3");
  assert.equal(JSON.parse(item.state.S).months["2026-11"].spent, 0);
});
