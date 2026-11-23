import assert from "node:assert/strict";
import test from "node:test";
import { formatDisplayedValue } from "./display-number.js";

test("timeline values adapt to magnitude and preserve meaningful tiny numbers", () => {
  const cases = [
    [1234.567, "1,235"], [-1000.49, "-1,000"], [100.47, "100"],
    [99.93, "99.9"], [-12.04, "-12"], [1.2359, "1.24"],
    [-0.8249, "-0.825"], [0.0012, "0.001"], [0.00003142, "3.14E-5"],
    [-0.00003142, "-3.14E-5"], [0, "0"]
  ];
  for (const [input, expected] of cases) assert.equal(formatDisplayedValue(input), expected);
});
