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

export function resultWorkbook(Excel, result, points, method, goal, cadence, window, unit, headings, context = {}) {
  const workbook = context.original ?? new Excel.Workbook();
  const added = [];
  function addSheet(name) {
    let candidate = name;
    for (let suffix = 2; workbook.worksheets.some(sheet => sheet.name.toLowerCase() === candidate.toLowerCase()); suffix++) {
      candidate = name + " (" + suffix + ")";
    }
    const sheet = workbook.addWorksheet(candidate);
    added.push(sheet);
    return sheet;
  }
  const series = addSheet("Series");
  const time = headings?.time ?? "Time";
  const target = headings?.target ?? "Value";
  const values = result.predictions[method];
  const scenarios = planningScenarios(values, result.leadScores ?? []);
  const hasPlanning = scenarios.some(Boolean);
  series.addRow([time, target + " · historical actual", target + " · future forecast (base)",
    ...(hasPlanning ? ["Illustrative planning low", "Illustrative planning high"] : [])]);
  series.getColumn(1).numFmt = "yyyy-mm-dd";
  if (cadence === "periods") series.getColumn(1).numFmt = "0";
  points.forEach(point => series.addRow([point.time, point.value]));
  result.future.forEach((time, i) => series.addRow([time, null, values[i], scenarios[i]?.low ?? null, scenarios[i]?.high ?? null]));
  const setup = addSheet("Analysis");
  [
    ["Goal", goal], ["Units", unit], ["Cadence", cadence], ["Horizon", result.future.length], ["Method", methods[method]],
    ["Target", target], ["Source", context.source],
    ["Source workbook", context.original || context.sourceIncluded ? "Included" :
      "Unavailable. The export contains the selected data and analysis."],
    ["Data frequency", context.frequency], ["Aggregation", context.aggregation],
    ["Incomplete periods omitted", context.omitted], ["Your management actions", context.actions],
    ["Moving window", method === "moving" ? window : null],
    ["Seasonal cycle", method === "seasonal" ? "12 months" : null],
    ["Planning estimates", hasPlanning ? "Base is the forecast. Low and high use historical MAE at the matching lead. No probabilities are assigned." : null]
  ].filter(([, value]) => value != null && value !== "").forEach(row => setup.addRow(row));
  if (context.history && context.aggregation) {
    const historical = addSheet("Selected historical data");
    historical.addRows([[time, target], ...context.history.map(point => [point.time, point.value])]);
    if (context.history[0]?.time instanceof Date) historical.getColumn(1).numFmt = "yyyy-mm-dd";
  }
  if (context.fitted?.length) {
    const fitted = addSheet("Historical fitted values");
    fitted.addRows([[time, "Historical actual", "In-sample fitted value"],
      ...points.map((point, i) => [point.time, point.value, context.fitted[i]])]);
    fitted.getColumn(1).numFmt = series.getColumn(1).numFmt;
  }
  if (method === "trend") {
    const runs = result.runs;
    addSheet("Runs test").addRows([["Statistic", "Value"], ["Historical mean", runs.mean], ["At or above", runs.above],
      ["Below", runs.below], ["Ties (included above)", runs.ties], ["Observed runs", runs.runs], ["Expected runs", runs.expected],
      ["Runs z", runs.z], ["Workbook cumulative probability", runs.cumulative], ["Two-sided normal p-value", runs.p]]
      .filter((row, i) => !i || Number.isFinite(row[1])));
    if (context.stats) {
      const { startValue, slope, rSquared, standardError, t, p, df } = context.stats;
      addSheet("Regression statistics").addRows([["Statistic", "Value"], ["Fitted first observation", startValue],
        ["Slope per " + (cadence === "periods" ? "period" : "day"), slope], ["Historical R²", rSquared],
        ["Slope standard error", standardError], ["Slope t statistic", t], ["Two-sided slope p-value", p], ["Degrees of freedom", df]]
        .filter((row, i) => !i || Number.isFinite(row[1])));
    }
  }
  const accuracy = (result.leadScores ?? []).flatMap((score, i) => score ? [[i + 1, score.count, score.mae, score.mse]] : []);
  if (accuracy.length) {
    addSheet("Historical accuracy").addRows([["Forecast lead", "Held-out forecasts", "Rolling-origin MAE" + (unit ? " (" + unit + ")" : ""),
      "Rolling-origin MSE"], ...accuracy]);
  }
  if (method === "moving" && context.windowComparison?.candidates.length) {
    const comparison = context.windowComparison;
    addSheet("Moving window comparison").addRows([["Window", "Common held-out forecasts", "Historical MSE", "Selected window"],
      ...comparison.candidates.map(candidate => [candidate.window, comparison.evaluationSize, candidate.mse, candidate.window === window])]);
  }
  if (method === "seasonal" && result.factors) {
    const seasonal = addSheet("Seasonal factors");
    seasonal.addRow(["Month number", "Factor", "Centered ratios"]);
    result.factors.forEach(({ factor, count }, i) => seasonal.addRow([i + 1, factor, count]));
  }
  for (const sheet of added) {
    if (sheet === setup) continue;
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).height = 32;
    sheet.getRow(1).eachCell((cell, col) => {
      sheet.getColumn(col).width = Math.min(58, Math.max(22, cell.text.length + 2));
      cell.alignment = { wrapText: true, vertical: "middle" };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF255B4B" } };
    });
  }
  setup.getColumn(1).width = 32;
  setup.getColumn(2).width = 72;
  setup.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  return workbook;
}
