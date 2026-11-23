import assert from "node:assert/strict";
import test from "node:test";
import { evidenceCategory, regressionEvidence, runsAssessment } from "./trend-evidence.js";
import { runsTest } from "./engine.js";

test("exploratory evidence categories change at exactly 0.05, 0.15 and 0.30", () => {
  const cases = [[0, "Very Strong"], [0.049999, "Very Strong"], [0.05, "Strong"], [0.149999, "Strong"],
    [0.15, "Modest"], [0.299999, "Modest"], [0.30, "Weak"], [1, "Weak"]];
  for (const [p, category] of cases) assert.equal(evidenceCategory(p), category);
  for (const missing of [null, NaN, -1, 2]) assert.equal(evidenceCategory(missing), null);
});

test("opposite extreme runs receive the same category from their two-sided p-values", () => {
  const clustered = runsTest([...Array(11).fill(1), ...Array(11).fill(2)]);
  const alternating = runsTest(Array.from({ length: 22 }, (_, i) => i % 2 + 1));
  assert.equal(evidenceCategory(clustered.p), "Very Strong");
  assert.equal(evidenceCategory(alternating.p), "Very Strong");
  assert.equal(evidenceCategory(alternating.cumulative), "Weak");
  assert.equal(evidenceCategory(runsTest([1, 2, 3]).p), null);
});

test("runs interpretation uses a strict 5% threshold and handles unavailable evidence", () => {
  assert.match(runsAssessment(0.049999), /statistically significant/);
  assert.match(runsAssessment(0.05), /does not find sufficient evidence/);
  assert.match(runsAssessment(0.95), /does not establish that the data are random/);
  assert.equal(runsAssessment(null), "Insufficient observations for a reliable runs-test interpretation.");
});

test("regression evidence matches a three-point fit and Cauchy tail for one degree of freedom", () => {
  const stats = regressionEvidence([1, 2, 4].map((value, time) => ({ value, time })));
  assert.equal(stats.slope, 1.5);
  assert.ok(Math.abs(stats.startValue - 5 / 6) < 1e-12);
  assert.equal(stats.change, 3);
  assert.ok(Math.abs(stats.rSquared - 27 / 28) < 1e-12);
  assert.equal(stats.df, 1);
  assert.ok(Math.abs(stats.t - 3 * Math.sqrt(3)) < 1e-12);
  assert.ok(Math.abs(stats.p - (1 - (2 / Math.PI) * Math.atan(stats.t))) < 1e-10);
});

test("slope inference is unavailable for constant or exact-fit data", () => {
  const evidence = values => regressionEvidence(values.map((value, time) => ({ value, time })));
  assert.equal(evidence([2, 2, 2]).rSquared, null);
  assert.equal(evidence([2, 2, 2]).p, null);
  assert.equal(evidence([1, 2, 3]).rSquared, 1);
  assert.equal(evidence([1, 2, 3]).p, null);
});
