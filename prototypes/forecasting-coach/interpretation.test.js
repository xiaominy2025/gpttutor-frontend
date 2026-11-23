import assert from "node:assert/strict";
import test from "node:test";
import { compareValues, describeSeason, regressionChange } from "./interpretation.js";
import { forecast, seasonalFactors } from "./engine.js";
import { regressionEvidence } from "./trend-evidence.js";

test("regression compares future endpoints or the latest fitted point for a one-period horizon", () => {
  const points = [10, 20, 30, 40].map((value, time) => ({ time, value }));
  const stats = regressionEvidence(points);
  const run = horizon => forecast(points, "periods", horizon, Infinity, false, { method: "trend", student: true });
  const multi = run(4);
  assert.deepEqual(regressionChange(points, multi.future, multi.predictions.trend, stats.endValue), {
    from: 50, to: 80, difference: 30, percentage: 60, start: 4, end: 7, crossesBoundary: false
  });
  const single = run(1);
  assert.deepEqual(regressionChange(points, single.future, single.predictions.trend, stats.endValue), {
    from: 40, to: 50, difference: 10, percentage: 25, start: 3, end: 4, crossesBoundary: true
  });
  const quarters = [80, 75, 70, 65].map((value, i) => ({ time: new Date(Date.UTC(2024, i * 3, 1)), value }));
  const declining = forecast(quarters, "quarterly", 3, Infinity, false, { method: "trend", student: true });
  const change = regressionChange(quarters, declining.future, declining.predictions.trend, regressionEvidence(quarters).endValue);
  assert.equal(change.start.toISOString().slice(0, 10), "2025-01-01");
  assert.equal(change.end.toISOString().slice(0, 10), "2025-07-01");
  assert.ok(change.difference < 0 && change.percentage < 0);
});

test("next-period comparison retains scale and direction and avoids misleading percentages", () => {
  assert.deepEqual(compareValues(200, 170), { from: 200, to: 170, difference: -30, percentage: -15 });
  assert.equal(compareValues(100, 120).percentage, 20);
  assert.equal(compareValues(200, 200).difference, 0);
  assert.equal(compareValues(100, 0).percentage, -100);
  for (const [from, to] of [[0, 3], [-5, -3], [1e-12, 5], [4, -4]]) {
    assert.equal(compareValues(from, to).percentage, null);
    assert.equal(compareValues(from, to).difference, to - from);
  }
});

test("seasonal summary identifies peaks, lows and noteworthy deviations without changing ratios", () => {
  const factors = [1.00, 1.06, .92, 1, 1, 1, .90, 1, 1.13, 1, 1.13, 1].map(factor => ({ factor, count: 2 }));
  const result = describeSeason(factors);
  assert.deepEqual(result.peaks.map(item => item.period), ["September", "November"]);
  assert.deepEqual(result.lows.map(item => item.period), ["July"]);
  assert.deepEqual(result.notable.map(item => item.period), ["February", "March"]);
  assert.equal(result.limited, false);
  assert.equal(result.entries[8].factor, factors[8].factor);
});

test("seasonal indices preserve the historical ratio counts and flag limited or uniform evidence", () => {
  const history = Array.from({ length: 24 }, (_, i) => ({ time: new Date(Date.UTC(2022, i, 1)), value: 10 }));
  const factors = seasonalFactors(history);
  const result = describeSeason(factors);
  assert.equal(result.entries.length, 12);
  assert.ok(result.entries.every(item => item.factor === 1 && item.count === 1));
  assert.equal(result.uniform, true);
  assert.equal(result.limited, true);
});
