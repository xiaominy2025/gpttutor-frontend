export function cellValue(cell) {
  const value = cell.value;
  if (value && typeof value === "object" && ("formula" in value || "sharedFormula" in value)) {
    return value.result;
  }
  return value;
}

export function readSeries(sheet, dateColumn, valueColumn, cadence, firstRow = 2) {
  if (dateColumn === valueColumn) throw Error("Choose two different columns.");
  const points = [];
  let cached = 0;
  for (let row = firstRow; row <= sheet.rowCount; row++) {
    const a = sheet.getCell(row, dateColumn);
    const b = sheet.getCell(row, valueColumn);
    const x = cellValue(a);
    const value = cellValue(b);
    if (a.value == null && b.value == null) continue;
    let time;
    if ((cadence === "periods" || cadence === "auto") && Number.isSafeInteger(x)) time = x;
    if (cadence !== "periods") {
      if (x instanceof Date && Number.isFinite(x.getTime())) time = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
      if (typeof x === "string" && /^\d{4}-\d\d-\d\d$/.test(x)) {
        const date = new Date(x + "T00:00:00Z");
        if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === x) time = date;
      }
    }
    if (time === undefined || typeof value !== "number" || !Number.isFinite(value)) {
      throw Error(`Row ${row} needs a valid time and numeric actual. Formula cells need a saved result.`);
    }
    if (cadence === "monthly") time.setUTCDate(1);
    if (a.type === 6 || b.type === 6) cached++;
    points.push({ time, value, row });
    if (points.length > 5000) throw Error("Choose a series with at most 5,000 observations.");
  }
  points.sort((a, b) => a.time - b.time);
  if (!points.length) throw Error("Choose a column with historical observations.");
  if (cadence === "auto") return { points, cached };
  if (points.length < 3) throw Error("Choose at least three observations.");
  for (let i = 1; i < points.length; i++) {
    const expected = nextTime(points[i - 1].time, cadence, 1);
    if (+expected !== +points[i].time) throw Error(`Check row ${points[i].row}. A period is missing or duplicated for this cadence.`);
  }
  return { points, cached };
}

import { methods, nextTime, planningScenarios } from "./engine.js";

export function resultWorkbook(Excel, result, points, method, goal, cadence, window, unit, headings) {
  const workbook = new Excel.Workbook();
  const series = workbook.addWorksheet("Series");
  const titles = headings ? [headings.time, headings.target, `${headings.target} — forecast`] : ["Time", "Actual", "Forecast"];
  series.addRow([...titles, "Low (MAE planning)", "High (MAE planning)"]);
  series.getColumn(1).numFmt = "yyyy-mm-dd";
  if (cadence === "periods") series.getColumn(1).numFmt = "0";
  points.forEach(point => series.addRow([point.time, point.value]));
  const values = result.predictions[method];
  const scenarios = planningScenarios(values, result.leadScores ?? []);
  result.future.forEach((time, i) => series.addRow([time, null, values[i], scenarios[i]?.low ?? null, scenarios[i]?.high ?? null]));
  const setup = workbook.addWorksheet("Analysis");
  [
    ["Goal", goal], ["Units", unit], ["Cadence", cadence], ["Horizon", result.future.length], ["Method", methods[method]],
    ["Moving window", method === "moving" ? window : null], ["Runs mean", result.runs.mean], ["Runs", result.runs.runs], ["At or above", result.runs.above],
    ["Below", result.runs.below], ["Ties", result.runs.ties], ["Runs z", result.runs.z],
    ["Normal cumulative probability", result.runs.cumulative], ["Two-sided normal p", result.runs.p],
    ["Backtest origins used", Object.keys(result.scores).length ? result.scoredOrigins : 0]
  ].forEach(row => setup.addRow(row));
  const accuracy = workbook.addWorksheet("Accuracy");
  accuracy.addRow(["Method", "Rolling-origin MAE", "Rolling-origin MSE"]);
  Object.entries(result.scores).forEach(([key, score]) => accuracy.addRow([methods[key], score.mae, score.mse]));
  if (result.factors) {
    const seasonal = workbook.addWorksheet("Seasonal factors");
    seasonal.addRow(["Month number", "Factor", "Centered ratios"]);
    result.factors.forEach(({ factor, count }, i) => seasonal.addRow([i + 1, factor, count]));
  }
  for (const sheet of workbook.worksheets) {
    sheet.getColumn(1).width = 34;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 24;
  }
  series.getColumn(4).width = 24;
  series.getColumn(5).width = 24;
  if (headings) {
    series.getRow(1).eachCell((cell, columnNumber) => {
      const column = series.getColumn(columnNumber);
      column.width = Math.max(column.width, Math.min(65, cell.text.length + 2));
      cell.alignment = { wrapText: true };
    });
  }
  return workbook;
}
