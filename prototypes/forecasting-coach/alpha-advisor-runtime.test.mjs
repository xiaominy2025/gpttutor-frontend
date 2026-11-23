import assert from "node:assert/strict";
import test from "node:test";
import { forecastingRuntime, signingParameter } from "./alpha-advisor-runtime.mjs";
import { advisorSessionRoute } from "./management-advisor.js";

test("Forecasting runtime scopes guest bootstrap to the configured API and fail-closed master", async () => {
  const time = Date.UTC(2026, 10, 22);
  let suspended = false;
  const reads = [];
  const runtime = forecastingRuntime({
    enabled: true, apiId: "alpha-api", stage: "$default", tableName: "table", pilotId: "fixture",
    startsAt: time, endsAt: time + 86_400_000, now: () => time,
    model: "fixture", inputRate: 125_000, outputRate: 500_000,
    async getParameter(request) {
      assert.deepEqual(request, { Name: signingParameter, WithDecryption: true });
      reads.push(request.Name);
      return { Parameter: { Name: signingParameter, Type: "SecureString", Value: "ab".repeat(32) } };
    },
    async getItem(request) {
      assert.deepEqual(request.Key, { pk: { S: "AI#CONFIG" }, sk: { S: "STATE" } });
      assert.equal(request.ConsistentRead, true);
      return { Item: { suspended: { BOOL: suspended }, revision: { N: "11" } } };
    },
    fetcher: () => assert.fail("Unexpected provider dispatch")
  });
  const event = {
    version: "2.0", rawPath: advisorSessionRoute, routeKey: "POST " + advisorSessionRoute,
    requestContext: { apiId: "alpha-api", stage: "$default", http: { sourceIp: "192.0.2.1", method: "POST" } },
    headers: { origin: "https://d6owpirihdsus.cloudfront.net", "content-type": "application/json" }, body: "{}"
  };
  assert.equal((await forecastingRuntime()(event)).statusCode, 503);
  assert.equal((await runtime({ ...event, routeKey: "ANY /{proxy+}" })).statusCode, 503);
  assert.deepEqual(reads, []);
  const result = await runtime(event);
  assert.equal(result.statusCode, 200);
  assert.match(result.cookies[0], /^__Host-forecasting-alpha=/);
  assert.deepEqual(reads, [signingParameter]);
  suspended = true;
  assert.equal((await runtime(event)).statusCode, 503);
});

test("verification and paid configurations cannot share a ledger", async () => {
  const event = { version: "2.0", rawPath: advisorSessionRoute,
    requestContext: { http: { method: "POST" } } };
  for (const options of [
    { verification: true, pilotId: "paid-fixture" },
    { verification: false, pilotId: "verify-fixture" }
  ]) {
    const handler = forecastingRuntime({ enabled: true, ...options,
      getParameter: () => assert.fail("Unexpected credential access") });
    assert.equal((await handler(event)).statusCode, 503);
  }
});
