import assert from "node:assert/strict";
import test from "node:test";
import { defaultHorizons, parseProject, projectApp, projectFilename, projectVersion } from "./project.js";
import { convertFrequency } from "./frequency.js";
import { forecast } from "./engine.js";
import { businessPatterns } from "./trend-evidence.js";

const project = {
  application: projectApp, version: projectVersion,
  data: { source: "Forecast.xlsx", worksheet: "Sales Actuals", timeHeading: "Time", targetHeading: "Sales (thousands)",
    observations: Array.from({ length: 12 }, (_, i) => [i + 1, 100 + i]) },
  settings: { approach: "trend", frequency: "periods", aggregation: "", windowMode: "manual", manualWindow: 3, horizons: { ...defaultHorizons } },
  goal: "Review capacity", units: "", communication: "Discuss material uncertainties."
};

test("JSON preserves original observations and reproduces a forecast", () => {
  const restored = parseProject(JSON.stringify(project));
  assert.deepEqual(restored.data, project.data);
  assert.deepEqual(restored.settings, project.settings);
  assert.equal(restored.communication, project.communication);
  const { points } = convertFrequency(restored.points, "periods", restored.settings.frequency, restored.settings.aggregation);
  assert.deepEqual(forecast(points, "periods", 6, Infinity, false, { method: "trend", student: true }).predictions.trend, [112, 113, 114, 115, 116, 117]);
  assert.equal(projectFilename(restored.data.worksheet), "forecasting-coach-sales-actuals.json");
});

test("JSON accepts prior decision reflection text and source-free drafts", () => {
  const draft = { ...project, data: null, settings: { ...project.settings, frequency: null }, communication: undefined, decisionReflection: "Prior note" };
  assert.equal(parseProject(JSON.stringify(draft)).communication, "Prior note");
});

test("rejects malformed, incompatible and out-of-bounds project files", () => {
  assert.throws(() => parseProject("{broken"), /malformed JSON/);
  for (const invalid of [
    { ...project, application: "another-app" }, { ...project, version: 2 },
    { ...project, settings: { ...project.settings, frequency: "daily" } },
    { ...project, settings: { ...project.settings, horizons: { ...defaultHorizons, trend: 61 } } },
    { ...project, data: { ...project.data, worksheet: "Sheet[1]" } },
    { ...project, data: { ...project.data, observations: [["2024-02-31", 20]] } },
    { ...project, data: { ...project.data, observations: [[1, { formula: "1+1" }]] } },
    { ...project, data: { ...project.data, observations: Array(5001).fill([1, 20]) } }
  ]) assert.throws(() => parseProject(JSON.stringify(invalid)));
});

test("management takeaways combine direction and pattern evidence", () => {
  const increasing = businessPatterns({ slope: 1, p: 0.08 }, { z: 2, p: 0.04 });
  assert.equal(increasing.trendLevel, "Strong");
  assert.equal(increasing.runsLevel, "Very Strong");
  assert.match(increasing.fluctuation, /switched sides/);
  assert.match(increasing.takeaway, /growth.*reversals/);
  const decreasing = businessPatterns({ slope: -1, p: 0.13 }, { z: -2, p: 0.08 });
  assert.match(decreasing.fluctuation, /same side/);
  assert.match(decreasing.takeaway, /lower values persist/);
  const weak = businessPatterns({ slope: 1, p: 0.5 }, { z: 1, p: 0.7 });
  assert.match(weak.takeaway, /additional business evidence/);
  assert.equal(businessPatterns({ slope: 0, p: null }, { z: null, p: null }).runsLevel, null);
});
