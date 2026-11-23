import assert from "node:assert/strict";
import test from "node:test";
import { advisorRoute } from "./management-advisor.js";
import { createAlphaAdvisor, forecastingLedger } from "./alpha-advisor.mjs";
import { openAIAdvisorProvider } from "./alpha-advisor-provider.mjs";

const origin = "https://alpha.example.test";
const start = Date.UTC(2026, 11, 1);
const summary = {
  version: 1, objective: "Review staffing", variable: { name: "Orders", units: "orders" },
  forecast: { method: "moving", frequency: "monthly", horizon: 1,
    reference: { period: 12, value: 80, kind: "actual" }, change: { difference: 10, percent: 12.5 },
    keyPeriods: [{ lead: 1, period: 13, base: 90, low: null, high: null }] },
  historicalPatterns: null, seasonalEffects: null, accuracy: [], limitations: ["missing_historical_accuracy"]
};
const request = (actor = "a", body = JSON.stringify(summary), requestOrigin = origin) =>
  new Request(origin + advisorRoute, { method: "POST", body, headers: {
    "Content-Type": "application/json", Origin: requestOrigin, "X-Test-Actor": actor
  } });

function fixture(options = {}) {
  let record;
  const store = {
    async read() { return structuredClone(record); },
    async replace(key, revision, value) {
      assert.equal(key, "FORECASTING#PILOT#fixture");
      if ((record?.revision ?? null) !== revision) return false;
      record = { value: structuredClone(value), revision: (revision ?? 0) + 1 };
      return true;
    }
  };
  let calls = 0;
  const provider = openAIAdvisorProvider({
    model: "fixture-model", inputRate: 125_000, outputRate: 500_000,
    boundInputTokens: options.boundInputTokens ?? (() => 1024),
    readCredential: async () => "synthetic-credential",
    async fetcher(url, init) {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(init.body);
      assert.equal(init.redirect, "error");
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 512);
      assert.equal(body.input[0].role, "developer");
      await options.beforeResponse?.();
      return Response.json({
        status: "completed", usage: { input_tokens: 1000, output_tokens: 300 },
        output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "Review staffing if misses persist." }] }]
      });
    }
  });
  const ledger = forecastingLedger(store, "fixture");
  const handler = createAlphaAdvisor({
    enabled: true, origin, startsAt: start, endsAt: start + 2 * 86_400_000,
    now: () => start, guestSession: { actor: r => r.headers.get("X-Test-Actor"), ip: ip => ip },
    masterAllows: async () => true, ledger, provider, ...options
  });
  return { handler: request => handler(request, { viewerIp: "fixture-ip" }), ledger,
    calls: () => calls, state: () => record?.value };
}

test("default-off and provider-blocked Alpha deny dispatch with zero ledger writes", async () => {
  assert.equal((await createAlphaAdvisor()(request())).status, 503);
  const local = fixture();
  for (const [input, status] of [
    [request("a", "{}", "https://wrong.example.test"), 403],
    [request(""), 401], [request("guest"), 503], [request("a", "{"), 400],
    [request("a", "x".repeat(4097)), 413], [request(), 503]
  ]) assert.equal((await local.handler(input)).status, status);
  assert.equal(local.calls(), 0);
  assert.equal(local.state(), undefined);
});

test("master recheck, token cap and pilot expiry fail closed", async () => {
  let reads = 0;
  const disabled = fixture({ providerBlocked: false, masterAllows: async () => ++reads === 1 });
  assert.equal((await disabled.handler(request())).status, 503);
  assert.equal(disabled.state().reserved, 0);
  assert.equal(disabled.calls(), 0);
  const oversized = fixture({ providerBlocked: false, boundInputTokens: () => 2049 });
  assert.equal((await oversized.handler(request())).status, 413);
  assert.equal(oversized.calls(), 0);
  const expired = fixture({ providerBlocked: false, now: () => start + 2 * 86_400_000 });
  assert.equal((await expired.handler(request())).status, 503);
  assert.equal(expired.calls(), 0);
});

test("daily quota counts admitted requests and usage settles to the Forecasting ledger", async () => {
  let time = start;
  const local = fixture({ providerBlocked: false, now: () => time });
  for (let i = 0; i < 5; i++) {
    time += 60_000;
    const result = await local.handler(request());
    assert.equal(result.status, 200);
    assert.match((await result.json()).draft, /Review staffing/);
  }
  assert.equal((await local.handler(request())).status, 429);
  assert.equal(local.calls(), 5);
  assert.equal(local.state().spent, 1375);
  assert.equal(local.state().reserved, 0);
});

test("atomic budget and concurrency denials under competing admissions", async () => {
  const { ledger, state } = fixture();
  const run = (actor, reservation, id) => ledger.admit({ actor, ip: "fixture-ip", minute: 1,
    reservation, id, day: "2026-12-01" });
  assert.deepEqual(await Promise.all([run("a", 600_000, "one"), run("a", 100, "two")]), [true, false]);
  assert.equal(await run("b", 400_001, "three"), false);
  assert.equal(await run("b", 399_999, "four"), true);
  assert.equal(await run("c", 1, "five"), false);
  assert.equal(state().reserved, 999_999);
  assert.equal(await ledger.settle("one", 10), true);
  assert.equal(await ledger.settle("four", 20), true);
  assert.equal(state().spent, 30);
  assert.equal(await run("c", 999_971, "six"), false);
  assert.equal(await run("c", 999_970, "seven"), true);
  assert.equal(state().spent + state().reserved, 1_000_000);
});

test("ambiguous provider failure keeps its hold and is never retried", async () => {
  const local = fixture({ providerBlocked: false, beforeResponse() { throw new Error("uncertain"); } });
  assert.equal((await local.handler(request())).status, 503);
  assert.equal((await local.handler(request())).status, 429);
  assert.equal(local.calls(), 1);
  assert.equal(local.state().reserved, 384);
});

test("anonymous rate and IP backstops survive cookie rotation", async () => {
  const { ledger } = fixture();
  const admit = (actor, ip, id) => ledger.admit({ actor, ip, id, day: "2026-12-01", minute: 1, reservation: 500 });
  for (let i = 0; i < 20; i++) {
    const id = String(i);
    assert.equal(await admit("guest-" + i, "shared-ip", id), true);
    await ledger.settle(id, 0);
  }
  assert.equal(await admit("fresh-cookie", "shared-ip", "21"), false);
  for (const id of ["22", "23"]) {
    assert.equal(await admit("guest", "second-ip", id), true);
    await ledger.settle(id, 0);
  }
  assert.equal(await admit("guest", "second-ip", "24"), false);
});
