import assert from "node:assert/strict";
import test from "node:test";
import { convertFrequency, detectFrequency } from "./frequency.js";
import { forecast, movingWindows, planningScenarios, runsTest } from "./engine.js";
import { resultWorkbook } from "./excel.js";
import Excel from "exceljs";

const points = (count, date, value = i => i + 1) =>
  Array.from({ length: count }, (_, i) => ({ time: date(i), value: value(i) }));
const monthly = i => new Date(Date.UTC(2024, i, 1));
const day = i => new Date(Date.UTC(2024, 0, i + 1));

test("Excel export includes every lead and only supported planning scenarios", async () => {
  const history = points(7, i => i, i => [2, 5, 4, 8, 10, 3, 9][i]);
  const result = forecast(history, "periods", 4, 3, false, { student: true, method: "trend" });
  const generated = resultWorkbook(Excel, result, history, "trend", "Review capacity", "periods", null, "orders");
  const reopened = new Excel.Workbook();
  await reopened.xlsx.load(await generated.xlsx.writeBuffer());
  const sheet = reopened.getWorksheet("Series");
  const scenarios = planningScenarios(result.predictions.trend, result.leadScores);
  assert.equal(sheet.rowCount, 12);
  for (let i = 0; i < 4; i++) {
    const row = sheet.getRow(history.length + 2 + i);
    assert.equal(row.getCell(1).value, result.future[i]);
    assert.equal(row.getCell(3).value, result.predictions.trend[i]);
    assert.equal(row.getCell(4).value, scenarios[i]?.low ?? null);
    assert.equal(row.getCell(5).value, scenarios[i]?.high ?? null);
  }
});

test("detects calendar frequencies and rejects gaps, duplicate dates and mixed types", () => {
  assert.equal(detectFrequency(points(5, day)), "daily");
  assert.equal(detectFrequency(points(5, i => day(i * 7))), "weekly");
  assert.equal(detectFrequency(points(5, i => new Date(Date.UTC(2024, i + 1, 0)))), "monthly");
  assert.equal(detectFrequency(points(5, i => monthly(i * 3))), "quarterly");
  assert.equal(detectFrequency(points(5, i => monthly(i * 12))), "annual");
  assert.equal(detectFrequency(points(5, i => i)), "periods");
  assert.throws(() => detectFrequency(points(3, i => day([0, 1, 3][i]))), /irregular or ambiguous/);
  assert.throws(() => detectFrequency(points(3, () => day(1))), /irregular or ambiguous/);
  assert.throws(() => detectFrequency(points(3, i => i === 1 ? 2 : day(i))), /throughout/);
});

test("aggregation confirms the method, respects leap days and drops partial periods", () => {
  const history = points(34, i => day(28 + i), () => 2);
  const sum = convertFrequency(history, "daily", "monthly", "sum");
  assert.deepEqual(sum.points, [{ time: monthly(1), value: 58 }]);
  assert.deepEqual(sum.omitted, [monthly(0), monthly(2)]);
  assert.deepEqual(convertFrequency(points(12, monthly), "monthly", "quarterly", "last").points.map(p => p.value), [3, 6, 9, 12]);
  assert.deepEqual(convertFrequency(points(12, monthly), "monthly", "annual", "average").points.map(p => p.value), [6.5]);
  assert.throws(() => convertFrequency(history, "daily", "monthly", ""), /Confirm/);
  assert.throws(() => convertFrequency(history, "weekly", "monthly", "sum"), /cannot be split/);
  assert.throws(() => convertFrequency(history, "monthly", "daily", "sum"), /incompatible/);
});

test("automatic and manual windows use identical historical targets and exact MSE", () => {
  const history = Array.from({ length: 12 }, (_, i) => i + 1);
  const result = movingWindows(history);
  assert.equal(result.evaluationSize, 6);
  assert.equal(result.selected, 2);
  assert.deepEqual(result.candidates.map(c => c.mse), [2.25, 4, 6.25, 9, 12.25]);
  assert.equal(movingWindows(history, 3).selected, 3);
  assert.equal(movingWindows([1, 2, 3]).evaluationSize, 0);
});

test("student moving average uses only actuals and is excluded at longer horizons", () => {
  const history = points(12, i => i);
  const single = forecast(history, "periods", 1, 3, false, { student: true });
  assert.deepEqual(single.predictions.moving, [11]);
  const long = forecast(history, "periods", 6, 3, false, { student: "auto" });
  assert.equal(long.predictions.moving, undefined);
  assert.equal(long.predictions.trend.length, 6);
});

test("eight quarters compare two windows on the same last five actuals", () => {
  const history = [4, 8, 2, 6, 11, 7, 3, 9];
  const result = movingWindows(history);
  assert.equal(result.evaluationSize, 5);
  assert.deepEqual(result.candidates.map(candidate => candidate.window), [2, 3]);
  assert.equal(result.candidates[0].mse, (1 + 49 + 2.25 + 36 + 16) / 5);
  const mseForThree = (Math.pow(6 - 14 / 3, 2) + Math.pow(11 - 16 / 3, 2) +
    Math.pow(7 - 19 / 3, 2) + Math.pow(3 - 24 / 3, 2) + Math.pow(9 - 21 / 3, 2)) / 5;
  assert.ok(Math.abs(result.candidates[1].mse - mseForThree) < 1e-12);
  assert.equal(result.selected, 3);
  assert.equal(movingWindows(history, 2).selected, 2);
});

test("selected moving window uses the same MSE sample and preserves unrounded MAE", () => {
  const values = [0, 0, 0, 0, 0, 0, 4, 0];
  const history = points(values.length, i => i, i => values[i]);
  const comparison = movingWindows(values);
  const result = forecast(history, "periods", 1, 2, false, {
    student: true, method: "moving", windowEvaluationSize: comparison.evaluationSize
  });
  assert.deepEqual(result.predictions, { moving: [2] });
  assert.deepEqual(result.leadScores, [{ mae: 1.2, mse: 4, count: 5 }]);
  assert.equal(result.scores.moving.mse, comparison.candidates[0].mse);
  assert.deepEqual(planningScenarios(result.predictions.moving, result.leadScores), [{ low: 0.8, base: 2, high: 3.2 }]);
});

test("planning scenarios use each lead's own MAE and omit unsupported leads", () => {
  const history = points(7, i => i, i => [2, 5, 4, 8, 10, 3, 9][i]);
  const result = forecast(history, "periods", 4, 3, false, { student: true, method: "trend" });
  assert.deepEqual(result.leadScores.map(score => score?.count ?? 0), [4, 3, 0, 0]);
  assert.notEqual(result.leadScores[0].mae, result.leadScores[1].mae);
  const scenarios = planningScenarios(result.predictions.trend, result.leadScores);
  assert.equal(scenarios[1].high, scenarios[1].base + result.leadScores[1].mae);
  assert.deepEqual(scenarios.slice(2), [null, null]);
  assert.deepEqual(planningScenarios([-2, 1], [{ mae: 0 }, { mae: NaN }]), [{ low: -2, base: -2, high: -2 }, null]);
});

test("monthly seasonal horizon and fixed 12-month cycle are distinct", () => {
  const history = points(36, monthly);
  const analysis = forecast(history, "monthly", 9, 3, true, { student: "auto" });
  assert.equal(analysis.factors.length, 12);
  assert.equal(analysis.predictions.seasonal.length, 9);
  assert.equal(analysis.scoredOrigins, 4);
  assert.equal(forecast(history.slice(0, 23), "monthly", 12, 3, true, { student: true }).factors, null);
  assert.equal(forecast(history, "weekly", 12, 3, true, { student: true }).factors, null);
});

test("runs diagnostic reports opposite extremes and withholds small-sample inference", () => {
  const clustered = runsTest([...Array(11).fill(1), ...Array(11).fill(2)]);
  const alternating = runsTest(Array.from({ length: 22 }, (_, i) => i % 2 + 1));
  assert.ok(clustered.z < 0 && alternating.z > 0);
  assert.equal(clustered.p, alternating.p);
  assert.equal(runsTest([1, 2, 3]).p, null);
});
