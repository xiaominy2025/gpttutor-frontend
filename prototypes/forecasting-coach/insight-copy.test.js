import assert from "node:assert/strict";
import test from "node:test";
import { compareValues, regressionChange } from "./interpretation.js";
import { movingInsight, regressionInsight, reliabilityInsight, seasonalForecastRange, seasonalRangeInsight } from "./insight-copy.js";

const month = i => new Date(Date.UTC(2018, i, 1));

test("regression leads with growth or decline across exact periods and uses full-precision values", () => {
  const dates = [month(0), month(5)];
  for (const [values, direction] of [[[2982.12, 3156.63], "6% growth"], [[3156.63, 2982.12], "6% decline"]]) {
    const change = regressionChange([{ time: month(-1) }], dates, values, 0);
    const copy = regressionInsight(change, "monthly", "output", "thousand units");
    assert.ok(copy.includes(direction));
    assert.match(copy, /January 2018.*June 2018/);
    assert.match(copy, /thousand units/);
    assert.doesNotMatch(copy, /annual/);
  }
});

test("one-period regression references the last fitted historical value", () => {
  const change = regressionChange([{ time: month(-1), value: 95 }], [month(0)], [110], 100);
  assert.match(regressionInsight(change, "monthly", "orders", ""), /10% growth.*fitted historical level of 100 in December 2017.*110 in January 2018/);
});

test("moving average expresses increases, decreases and negligible changes against the latest actual", () => {
  for (const [from, to, pattern] of [
    [2808, 2876, /approximately 2% higher than the latest actual: 2,876 in January 2018 versus 2,808 in December 2017/],
    [200, 170, /approximately 15% lower than the latest actual/],
    [100, 100, /approximately unchanged/],
    [100, 100.0009, /approximately unchanged/],
    [-100, -100.0009, /approximately unchanged/]
  ]) assert.match(movingInsight(compareValues(from, to), month(-1), month(0), "monthly", "sales", ""), pattern);
});

test("zero and negative references show values without percentages, and tiny changes remain visible", () => {
  for (const [from, to] of [[0, 12], [-5, -3], [1e-12, 5]]) {
    const change = compareValues(from, to);
    assert.doesNotMatch(movingInsight(change, 1, 2, "periods", "stock", "units"), /%/);
    assert.doesNotMatch(regressionInsight({ ...change, start: 1, end: 2 }, "periods", "stock", "units"), /%/);
  }
  const tiny = compareValues(1e-5, 1.0005e-5);
  assert.match(movingInsight(tiny, 1, 2, "periods", "flow", "liters"), /0.05%/);
  assert.match(movingInsight(compareValues(0, 2e-7), 1, 2, "periods", "flow", "liters"), /2E-7 liters/);
});

test("seasonal range uses interior extrema, first chronological tie and unrounded spread", () => {
  const dates = [0, 1, 2, 3, 4, 5].map(month);
  const values = [15, 10.025, 20.174, 10.025, 20.174, 15];
  assert.deepEqual(seasonalForecastRange(values, dates), {
    min: 10.025, max: 20.174, lowDate: dates[1], highDate: dates[2], difference: 20.174 - 10.025
  });
  assert.match(seasonalRangeInsight(values, dates, "monthly", "demand", "thousand units"),
    /10 thousand units in February 2018.*20.2 thousand units in March 2018.*10.1 thousand units/);
  for (const flat of [[20, 20], [20, 20.01]]) {
    assert.match(seasonalRangeInsight(flat, dates.slice(0, 2), "monthly", "demand", "orders"), /stay at around 20 orders from January 2018 to February 2018/);
  }
});

test("reliability reports error and plan caveats without sample counts", () => {
  const copy = reliabilityInsight([{ mae: 10.23, count: 3 }, null], "orders");
  assert.match(copy, /off by about 10.2 orders on average/);
  assert.match(copy, /not guaranteed ranges/);
  assert.match(copy, /only where enough comparable history/);
  assert.doesNotMatch(copy, /1 of 2|3 tests/);
  assert.match(reliabilityInsight([null], ""), /too few comparable past forecasts/);
});
