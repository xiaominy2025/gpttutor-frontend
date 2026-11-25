import assert from "node:assert/strict";
import test from "node:test";
import Excel from "exceljs";
import { forecast, linearFit, movingWindows, planningScenarios } from "./engine.js";
import { resultWorkbook } from "./excel.js";

const series = count => Array.from({ length: count }, (_, i) => ({
  time: new Date(Date.UTC(2022, i, 1)), value: 50.123456789 + i * 1.8 + (i % 12) * 3
}));

test("enhanced export preserves source formulas, styles and case-insensitive sheet names", async () => {
  const original = new Excel.Workbook();
  const sheet = original.addWorksheet("sErIeS");
  original.addWorksheet("Series (2)");
  original.addWorksheet("Analysis");
  sheet.getCell("A1").value = { formula: "'Series (2)'!A1+2", result: 7 };
  sheet.getCell("A1").numFmt = "0.00";
  sheet.getCell("A1").font = { bold: true };
  sheet.getCell("G8").value = "Unrelated source column";
  const points = series(36);
  const method = "seasonal";
  const analysis = forecast(points, "monthly", 3, Infinity, true, { student: true, method });
  const out = resultWorkbook(Excel, analysis, points, method, "Stock review", "monthly", null, "cases",
    { time: "Month", target: "Monthly orders" }, { original });
  const reopened = new Excel.Workbook();
  await reopened.xlsx.load(await out.xlsx.writeBuffer());
  assert.deepEqual(reopened.worksheets.slice(0, 3).map(sheet => sheet.name), ["sErIeS", "Series (2)", "Analysis"]);
  const source = reopened.getWorksheet("sErIeS");
  assert.equal(source.getCell("A1").formula, "'Series (2)'!A1+2");
  assert.equal(source.getCell("A1").numFmt, "0.00");
  assert.equal(source.getCell("A1").font.bold, true);
  assert.equal(source.getCell("G8").value, "Unrelated source column");
  const exported = reopened.getWorksheet("Series (3)");
  assert.deepEqual(exported.getCell("A2").value, points[0].time);
  assert.equal(exported.getCell("B2").value, points[0].value);
  assert.equal(exported.getCell("C38").value, analysis.predictions.seasonal[0]);
  const range = planningScenarios(analysis.predictions.seasonal, analysis.leadScores)[0];
  assert.equal(exported.getCell("D38").value, range.low);
  assert.equal(exported.getCell("E38").value, range.high);
  assert.equal(reopened.getWorksheet("Seasonal factors").getCell("B2").value, analysis.factors[0].factor);
  assert.equal(reopened.getWorksheet("Historical accuracy").getCell("C2").value, analysis.leadScores[0].mae);
  assert.equal(reopened.getWorksheet("Runs test"), undefined);
});

test("exports only available selected-method analysis and identifies analysis-only workbooks", () => {
  const points = series(8);
  const windowComparison = movingWindows(points.map(point => point.value));
  const moving = forecast(points, "monthly", 1, windowComparison.selected, false, {
    student: true, method: "moving", windowEvaluationSize: windowComparison.evaluationSize
  });
  const out = resultWorkbook(Excel, moving, points, "moving", "", "monthly", windowComparison.selected, "cases", null, { windowComparison });
  assert.equal(out.getWorksheet("Moving window comparison").getCell("C2").value, windowComparison.candidates[0].mse);
  assert.equal(out.getWorksheet("Series").getCell("C10").value, moving.predictions.moving[0]);
  assert.equal(out.getWorksheet("Runs test"), undefined);
  assert.ok(out.getWorksheet("Analysis").getSheetValues().some(row => row?.[2]?.startsWith?.("Unavailable.")));

  const short = points.slice(0, 3);
  const fitted = short.map(point => linearFit(short).predict(point.time));
  const regression = forecast(short, "monthly", 2, Infinity, false, { student: true, method: "trend" });
  const workbook = resultWorkbook(Excel, regression, short, "trend", "", "monthly", null, "", null, { fitted });
  assert.ok(workbook.getWorksheet("Runs test"));
  assert.equal(workbook.getWorksheet("Historical fitted values").getCell("C2").value, fitted[0]);
  assert.equal(workbook.getWorksheet("Historical accuracy"), undefined);
  assert.equal(workbook.getWorksheet("Seasonal factors"), undefined);
  assert.equal(workbook.getWorksheet("Series").getRow(1).actualCellCount, 3);
});
