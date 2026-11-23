import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { boundAdvisorInputTokens } from "../alpha-advisor-provider.mjs";
import { forecastingCases, dimensions } from "./forecasting-cases.mjs";
import { compareResults, deterministicChecks, evaluateCases, judgeMessages, parseReviews } from "./harness.mjs";
import { openEvaluationBudget } from "./local-provider.mjs";

const review = (score, critical = false) => ({
  scores: Object.fromEntries(dimensions.map(name => [name, score])), critical, reason: "Synthetic judge fixture"
});

test("development and holdout suites are distinct and use bounded production inputs", () => {
  const dev = forecastingCases("dev"), holdout = forecastingCases("holdout");
  assert.equal(dev.length, 8);
  assert.equal(holdout.length, 4);
  assert.equal(new Set([...dev, ...holdout].map(item => item.id)).size, 12);
  for (const item of [...dev, ...holdout]) {
    assert.ok(boundAdvisorInputTokens({ input: item.messages }) <= 2048);
    assert.doesNotMatch(item.messages[1].content, /"expected"|"avoid"/);
  }
});

test("blind paired judge restores original order and rejects malformed evaluations", () => {
  const item = forecastingCases("dev")[0];
  const { messages, flip } = judgeMessages(item, ["baseline draft", "candidate draft"], dimensions, "rubric", true);
  assert.deepEqual(JSON.parse(messages[1].content).responses, ["candidate draft", "baseline draft"]);
  assert.deepEqual(parseReviews(JSON.stringify({ reviews: [review(5), review(3)] }), dimensions, 2, flip),
    [review(3), review(5)]);
  assert.throws(() => parseReviews('{"reviews":[]}', dimensions, 1, false), /count/);
  assert.throws(() => parseReviews(JSON.stringify({ reviews: [review(9)] }), dimensions, 1, false), /rubric/);
  assert.deepEqual(deterministicChecks([{ role: "user", content: "10 units" }], "Order 999 units. Check MAE.").unsupportedNumerals, ["999"]);
});

test("mock development and holdout runs retain both drafts and enforce quality gates", async () => {
  const dev = forecastingCases("dev"), holdout = forecastingCases("holdout");
  const complete = async (messages, limit) => {
    if (limit === 512) return messages[0].content === "Mock candidate" ? "Stage purchases and monitor stock." : "Review the plan.";
    const choices = JSON.parse(messages[1].content).responses;
    return JSON.stringify({ reviews: choices.map(draft => review(draft.startsWith("Stage") ? 5 : 4)) });
  };
  const baseline = await evaluateCases({ cases: dev, complete, dimensions, rubric: "fixture" });
  for (const [cases, archived] of [[dev, baseline], [holdout, []]]) {
    const rows = await evaluateCases({ cases, complete, dimensions, rubric: "fixture", candidate: "Mock candidate", baseline: archived });
    assert.equal(rows.length, cases.length);
    assert.equal(compareResults(rows, dimensions).qualifies, true);
    rows[0].reviews[1].critical = true;
    assert.equal(compareResults(rows, dimensions).qualifies, false);
  }
});

test("local metering locks access, persists reserves, and stops after an ambiguous provider failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forecast-eval-"));
  const options = { maxCalls: 3, maxMicros: 2000, key: "fixture-secret", transport: async () =>
    Response.json({}, { status: 401 }) };
  try {
    const budget = await openEvaluationBudget(directory, options);
    await assert.rejects(() => openEvaluationBudget(directory, options), /EEXIST/);
    const message = [{ role: "user", content: "Synthetic fixture" }];
    await assert.rejects(() => budget.complete(message, 512), /HTTP 401/);
    await assert.rejects(() => budget.complete(message, 512), /Reconcile/);
    assert.equal(budget.snapshot().calls, 1);
    const carried = budget.snapshot().reservedMicros;
    assert.ok(carried > 0);
    await budget.carryReservation();
    assert.equal(budget.snapshot().reservedMicros, 0);
    assert.equal(budget.snapshot().carriedMicros, carried);
    await budget.close();
    const guarded = await openEvaluationBudget(directory, { ...options, maxMicros: carried });
    await assert.rejects(() => guarded.complete(message, 512), /budget/);
    await guarded.close();
    assert.doesNotMatch(await readFile(join(directory, "budget.json"), "utf8"), /fixture-secret/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("local metering settles provider-reported usage and refuses calls above either cap", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forecast-eval-"));
  const request = [{ role: "user", content: "Order planning fixture" }];
  let sends = 0;
  const key = "fixture-secret";
  const transport = async () => {
    sends++;
    return Response.json({ status: "completed", usage: { input_tokens: 80, output_tokens: 20 },
      output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "Track orders." }] }] });
  };
  try {
    const blocked = await openEvaluationBudget(directory, { maxCalls: 3, maxMicros: 1, key, transport });
    await assert.rejects(() => blocked.complete(request, 512), /budget/);
    await blocked.close();
    const budget = await openEvaluationBudget(directory, { maxCalls: 1, maxMicros: 1000, key, transport });
    assert.equal(await budget.complete(request, 512), "Track orders.");
    assert.deepEqual(budget.snapshot(), { calls: 1, spentMicros: 20, reservedMicros: 0, carriedMicros: 0, inputTokens: 80, outputTokens: 20 });
    await assert.rejects(() => budget.complete(request, 512), /budget/);
    await budget.close();
    assert.equal(sends, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
