import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import Excel from "exceljs";
import { forecast, linearFit, movingAverage, runsTest, seasonalFactors, workbookMovingMse } from "./engine.js";
import { readSeries, resultWorkbook } from "./excel.js";

const source = process.env.FORECASTING_WORKBOOK_DIR;
const near = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
const date = (year, month) => new Date(Date.UTC(year, month, 1));
const points = count => Array.from({ length: count }, (_, i) => ({
  time: date(2016, i), value: (100 + i) * (1 + (i % 12) / 30)
}));
async function open(name) {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile(join(source, name));
  return workbook;
}
const cell = (sheet, address) => sheet.getCell(address).result ?? sheet.getCell(address).value;

test("runs handles ties, degenerate groups and opposite extremes", () => {
  assert.equal(runsTest([3, 3, 3]).p, null);
  assert.equal(runsTest([1, 2, 3]).ties, 1);
  const grouped = runsTest([...Array(11).fill(1), ...Array(11).fill(2)]);
  const alternating = runsTest(Array.from({ length: 22 }, (_, i) => i % 2 + 1));
  assert.equal(grouped.runs, 2);
  assert.equal(alternating.runs, 22);
  near(grouped.p, alternating.p);
  assert.ok(grouped.p < .05);
});

test("rolling-origin compares equal horizons without using future actuals", () => {
  const data = Array.from({ length: 12 }, (_, i) => ({time: i, value: 2 * i + 8}));
  const run = forecast(data, "periods", 3, 3, false);
  assert.deepEqual(run.future, [12, 13, 14]);
  assert.equal(run.scoredOrigins, 7);
  assert.equal(run.recommendation, "trend");
  assert.deepEqual(run.scores.trend, { mae: 0, mse: 0 });
  assert.ok(run.scores.moving.mae > 0);
  assert.equal(forecast(data, "periods", 11, 3, false).recommendation, null);
});

test("seasonal factor aggregation, eligibility and insufficient common origins", () => {
  assert.ok(seasonalFactors(points(36)).every(factor => factor.count === 2));
  assert.ok(seasonalFactors(points(24)).every(factor => factor.count === 1));
  assert.equal(forecast(points(23), "monthly", 1, 3, true).factors, null);
  assert.equal(forecast(points(24), "monthly", 1, 3, true).recommendation, null);
  const zero = points(24);
  zero[0].value = 0;
  assert.equal(forecast(zero, "monthly", 1, 3, true).factors, null);
});

test("seasonal reliability uses held-out actuals at matching leads after full annual training", () => {
  const run = count => forecast(points(count), "monthly", 12, 3, true, { student: true, method: "seasonal" });
  const cold = run(24);
  assert.equal(cold.seasonalBacktest.centeredObservations,12);
  assert.deepEqual(cold.seasonalBacktest.comparisons, Array(12).fill(0));
  assert.equal(run(26).leadScores[0], null);
  const eligible = run(27);
  assert.deepEqual(eligible.seasonalBacktest.comparisons, [3,2,1,0,0,0,0,0,0,0,0,0]);
  assert.equal(eligible.leadScores[0].count,3);
  assert.ok(eligible.leadScores.slice(1).every(score => score === null));
  const history = points(27);
  const independent = [24,25,26].map(end => {
    const training = history.slice(0,end);
    const target = history[end];
    const index = seasonalFactors(training)[target.time.getUTCMonth()].factor;
    return Math.abs(linearFit(training).predict(target.time) * index - target.value);
  });
  near(eligible.leadScores[0].mae, independent.reduce((sum,error)=>sum+error,0)/3);
  assert.equal(run(38).leadScores[11].count,3);
});

test("Excel mapping rejects missing periods and absent formula caches", () => {
  const sheet = new Excel.Workbook().addWorksheet("Source");
  sheet.addRows([["Date", "Sales"], [date(2024, 0), 0], [date(2024, 2), 4], [date(2024, 3), 5]]);
  assert.throws(() => readSeries(sheet, 1, 2, "monthly"), /missing or duplicated/);
  sheet.getCell("A3").value = date(2024, 1);
  sheet.getCell("A4").value = date(2024, 2);
  sheet.getCell("B3").value = { formula: "2+2", result: 4 };
  assert.equal(readSeries(sheet, 1, 2, "monthly").cached, 1);
  sheet.getCell("B3").value = { formula: "2+2" };
  assert.throws(() => readSeries(sheet, 1, 2, "monthly"), /saved result/);
});

test("Excel result round trip separates actuals and forecasts", async () => {
  const history = points(24);
  const analysis = forecast(history, "monthly", 12, 3, true);
  const out = resultWorkbook(Excel, analysis, history, "seasonal", "=1+1", "monthly", 3, "units");
  const reopened = new Excel.Workbook();
  await reopened.xlsx.load(await out.xlsx.writeBuffer());
  const series = reopened.getWorksheet("Series");
  assert.equal(series.getCell("B26").value, null);
  near(series.getCell("C26").value, analysis.predictions.seasonal[0]);
  assert.equal(reopened.getWorksheet("Analysis").getCell("B1").value, "=1+1");
  assert.equal(reopened.getWorksheet("Seasonal factors").getCell("C2").value, 1);
});

const workbookOptions = { skip: !source && "Set FORECASTING_WORKBOOK_DIR to the directory with the three original workbooks" };
test("original Runs Test workbook, all eight sheets", workbookOptions, async () => {
  const workbook = await open("Module 6 Tools- Runs test tool.xlsx");
  assert.equal(workbook.worksheets.length, 8);
  for (const sheet of workbook.worksheets) {
    const values = Array.from({ length: 22 }, (_, i) => cell(sheet, `B${i + 3}`));
    const result = runsTest(values);
    for (const [key, column] of Object.entries({above:"I4", below:"I5", runs:"I6", expected:"I9", z:"I11"})) near(result[key], cell(sheet, column));
    near(result.cumulative, cell(sheet, "I12"), 8e-8);
  }
});

test("original Moving Average and Regression workbook", workbookOptions, async () => {
  const workbook = await open("Module 6 Tools- Moving average forecasting _ regression tools.xlsx");
  const short = workbook.getWorksheet("Moving average (short-term)");
  const data = readSeries(workbook.getWorksheet("OCT sale data"), 1, 2, "monthly").points;
  const values = data.map(p => p.value);
  workbookMovingMse(values, [2, 3, 4]).forEach((mse, i) => near(mse, cell(short, "CDE"[i] + "29")));
  const long = workbook.getWorksheet("Moving average (long-term)");
  movingAverage(values, 3, 7).forEach((value, i) => near(value, cell(long, `C${i + 26}`)));
  const regression = workbook.getWorksheet("Trend regression");
  const fit = linearFit(data);
  near(fit.slope, 1.151270755106431);
  near(fit.predict(date(2018, 0)), 2982.3044666303904);
  const serial = time => time.getTime() / 86400000 + 25569;
  for (let row = 2; row <= 37; row++) near(1.1513 * serial(cell(regression, `A${row}`)) - 46639, cell(regression, `C${row}`));
});

test("original Seasonal workbook, all factors and forecasts", workbookOptions, async () => {
  const workbook = await open("Module 6 Tools - Seaonal business forecasting.xlsx");
  const history = readSeries(workbook.getWorksheet("Raw data"), 1, 2, "monthly").points;
  const sheet = workbook.getWorksheet("Seasonal forecast communication");
  const factors = seasonalFactors(history);
  for (let row = 26; row <= 37; row++) {
    const time = cell(sheet, `A${row}`);
    const { factor, count } = factors[time.getUTCMonth()];
    near(factor, cell(sheet, `E${row}`));
    near(factor * cell(sheet, `D${row}`), cell(sheet, `F${row}`));
    assert.equal(count, 1);
  }
  const fullPrecision = forecast(history, "monthly", 12, 3, true);
  near(fullPrecision.predictions.seasonal[0], 2982.3044666303904 * factors[0].factor);
  assert.deepEqual(forecast(history, "monthly", 12, 3, true, { student: true, method: "seasonal" })
    .seasonalBacktest.comparisons, Array(12).fill(0));
});
