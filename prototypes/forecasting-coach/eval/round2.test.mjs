import assert from "node:assert/strict";
import test from "node:test";
import { boundAdvisorInputTokens } from "../alpha-advisor-provider.mjs";
import { forecastingCases } from "./forecasting-cases.mjs";
import { round2Cases } from "./round2-cases.mjs";

test("Round 2 holds forecast evidence fixed within each operational contrast", () => {
  const dev = round2Cases("dev"), holdout = round2Cases("holdout");
  assert.equal(dev.length, 8);
  assert.equal(holdout.length, 4);
  assert.equal(new Set([...dev, ...holdout].map(row => row.pair)).size, 6);
  for (const group of [dev, holdout]) {
    for (let i = 0; i < group.length; i += 2) {
      const [first, second] = group.slice(i, i + 2);
      assert.equal(first.pair, second.pair);
      assert.equal(first.messages[0].content, forecastingCases("dev")[0].messages[0].content);
      const { objective: a, ...prior } = JSON.parse(first.messages[1].content);
      const { objective: b, ...next } = JSON.parse(second.messages[1].content);
      assert.notEqual(a, b);
      assert.deepEqual(prior, next);
      for (const item of [first, second]) {
        assert.ok(boundAdvisorInputTokens({ input: item.messages }) <= 2048);
        assert.doesNotMatch(item.messages[1].content, /"expected"|"avoid"/);
      }
    }
  }
  assert.equal(forecastingCases("dev").length + forecastingCases("holdout").length, 12);
});
