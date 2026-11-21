import Excel from "exceljs/dist/exceljs.min.js";
import "./style.css";
import { forecast, methods } from "./engine.js";
import { readSeries, resultWorkbook, cellValue } from "./excel.js";

const by = id => document.getElementById(id);
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
const format = x => nf.format(x);
const timeLabel = t => t instanceof Date ? t.toISOString().slice(0, 10) : String(t);
const probability = p => p === null ? "Unavailable" : p.toPrecision(6);
let workbook, report, workbookRead = 0;

function element(type, content) {
  const node = document.createElement(type);
  if (content !== undefined) node.textContent = content;
  return node;
}

function options(id, list, selected) {
  by(id).replaceChildren(...list.map(([value, label]) => new Option(label, value)));
  if (selected !== undefined) by(id).value = selected;
}

function step(index) {
  document.querySelectorAll(".steps li").forEach((item, i) => {
    if (i === index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

function currentSheet() { return workbook.worksheets[Number(by("sheet").value)]; }

function table(headers, rows) {
  const wrapper = element("div");
  wrapper.className = "table-wrap";
  const grid = element("table");
  const header = grid.createTHead().insertRow();
  for (const title of headers) {
    const cell = element("th", title);
    cell.scope = "col";
    header.append(cell);
  }
  const body = grid.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    row.forEach(value => { tr.insertCell().textContent = value; });
  }
  wrapper.append(grid);
  return wrapper;
}

function invalidate() {
  report = undefined;
  by("results").hidden = true;
  by("preview").hidden = false;
  by("error").hidden = true;
  if (workbook) step(1);
}

function selectedSeries() {
  return readSeries(currentSheet(), +by("date").value, +by("target").value, by("cadence").value, +by("row").value);
}

function preview() {
  invalidate();
  if (!workbook) return;
  try {
    const { points, cached } = selectedSeries();
    by("preview-body").replaceChildren(element("p", `${points.length} observations from ${timeLabel(points[0].time)} to ${timeLabel(points.at(-1).time)}.`),
      table(["Time", "Actual"], points.slice(0, 8).map(p => [timeLabel(p.time), format(p.value)])));
    if (cached) by("preview-body").append(element("p", `${cached} rows use saved Excel formula results.`));
    by("run").disabled = false;
  } catch (error) {
    by("preview-body").replaceChildren(element("p", error.message));
    by("run").disabled = true;
  }
}

function columns() {
  const sheet = currentSheet();
  const entries = Array.from({ length: sheet.columnCount }, (_, i) => {
    const header = cellValue(sheet.getCell(1, i + 1));
    return [i + 1, typeof header === "string" ? header : `Column ${i + 1}`];
  });
  options("date", entries, 1);
  options("target", entries, 2);
  preview();
}

by("file").addEventListener("change", async () => {
  const read = ++workbookRead;
  workbook = undefined;
  invalidate();
  step(0);
  by("run").disabled = true;
  by("mapping").disabled = true;
  by("preview-body").replaceChildren(element("p", "Choose a workbook to preview your data."));
  const file = by("file").files[0];
  if (!file) { by("file-status").textContent = "Files are processed in your browser."; return; }
  by("file-status").textContent = "Reading workbook…";
  try {
    if (!/\.xlsx$/i.test(file.name) || file.size > 10 * 1024 * 1024) throw Error("Choose an .xlsx workbook up to 10 MB.");
    const imported = new Excel.Workbook();
    await imported.xlsx.load(await file.arrayBuffer());
    if (read !== workbookRead) return;
    if (!imported.worksheets.length) throw Error("The workbook has no worksheets.");
    workbook = imported;
    options("sheet", workbook.worksheets.map(({name}, i) => [i, name]));
    by("file-status").textContent = file.name;
    by("mapping").disabled = false;
    columns();
  } catch (error) {
    if (read === workbookRead) by("file-status").textContent = `Could not open workbook. ${error.message}`;
  }
});
by("sheet").addEventListener("change", columns);
for (const id of ["date", "target", "row", "cadence"]) by(id).addEventListener("input", preview);
for (const id of ["goal", "unit", "horizon", "window", "seasonality"]) by(id).addEventListener("input", invalidate);

function drawChart(points, future, predictions, unit) {
  const before = points.map(p => p.value);
  const all = before.concat(predictions);
  const dates = points.map(p => p.time).concat(future);
  const lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
  const left = 78, right = 718, top = 20, bottom = 235;
  const x = i => left + (right - left) * i / (all.length - 1);
  const y = v => bottom - (v - lo + span * .07) / (span * 1.14) * (bottom - top);
  const line = (values, i = 0) => values.map((v, j) => `${x(i + j)},${y(v)}`).join(" ");
  const divider = (x(before.length - 1) + x(before.length)) / 2;
  const ticks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4).filter((v, i, a) => !i || v !== a[i - 1]);
  const endLabel = timeLabel(dates.at(-1));
  const startLabel = timeLabel(dates[0]);
  const markup = `<svg class="chart" viewBox="0 0 740 273" role="img" aria-label="Historical actuals and projected forecast across time">
    <rect x="${divider}" y="${top}" width="${right - divider}" height="${bottom - top}" fill="#e4f4ef"/>
    ${ticks.map(v => `<line x1="${left}" y1="${y(v)}" x2="${right}" y2="${y(v)}" stroke="#d8e5eb"/><text x="${left - 8}" y="${y(v) + 5}" text-anchor="end" fill="#375469" font-size="13">${format(v)}</text>`).join("")}
    <line x1="${divider}" y1="${top}" x2="${divider}" y2="${bottom}" stroke="#6e9c99" stroke-dasharray="3 5"/>
    <polyline points="${line(before)}" fill="none" stroke="#1c526b" stroke-width="3"/>
    <polyline points="${line([before.at(-1), ...predictions], before.length - 1)}" fill="none" stroke="#087167" stroke-width="3" stroke-dasharray="7 4"/>
    <text x="${left}" y="256" fill="#375469" font-size="13">${startLabel}</text><text x="${right}" y="256" text-anchor="end" fill="#375469" font-size="13">${endLabel}</text>
  </svg>`;
  const legend = element("p", `Actual (solid) · Forecast (dashed)${unit ? " · " + unit : ""}`);
  legend.className = "legend";
  by("chart").replaceChildren(legend);
  by("chart").insertAdjacentHTML("beforeend", markup);
}

function render() {
  const { analysis: a, points, unit, cadence, horizon, seasonal } = report;
  const method = by("method").value;
  const pred = a.predictions[method];
  const score = a.scores[method];
  const recommended = a.recommendation;
  by("recommendation").textContent = recommended
    ? `${methods[recommended]} had the lowest historical MAE across ${a.scoredOrigins} common forecast origins.`
    : `Selected ${methods[a.fallback].toLowerCase()} as a starting point. There are too few common historical origins to rank methods at this horizon.`;
  drawChart(points, a.future, pred, unit);
  by("prediction-table").replaceChildren(table(["Forecast date / period", unit || "Forecast"], a.future.map((time, i) => [timeLabel(time), format(pred[i])])));
  by("accuracy").replaceChildren(element("p", Object.keys(a.scores).length
    ? `Rolling-origin errors over ${a.scoredOrigins} origins, ${horizon} step(s) each. MAE is in series units and MSE is in squared units.`
    : `Accuracy unavailable. This setup has ${a.scoredOrigins} common historical origins with enough training data and known outcomes. At least 3 are required.`));
  if (Object.keys(a.scores).length) by("accuracy").append(table(["Method", "MAE", "MSE"], Object.entries(a.scores).map(([key, s]) => [methods[key], format(s.mae), format(s.mse)])));
  if (seasonal && !a.factors) by("accuracy").append(element("p", "Seasonal forecasting needs positive values and at least 24 consecutive monthly observations."));
  const r = a.runs;
  const verdict = r.p === null ? "The normal approximation requires more than 10 observations in each group and nonzero variance."
    : r.p < .05 ? `There is evidence of ${r.z < 0 ? "clustering (too few runs)" : "alternation (too many runs)"} at the 5% level.`
      : "There is insufficient evidence of nonrandom runs at the 5% level.";
  by("runs").replaceChildren(element("p", `${r.runs} runs around a mean of ${format(r.mean)}. ${r.above} at or above, ${r.below} below, ${r.ties} ties.`),
    element("p", `Expected runs ${format(r.expected)} · z ${r.z === null ? "unavailable" : format(r.z)} · Normal cumulative probability ${probability(r.cumulative)} · Two-sided normal p-value ${probability(r.p)}.`),
    element("p", verdict));
  const direction = a.slope > 0 ? "rises" : a.slope < 0 ? "falls" : "is flat";
  const notes = [
    `The fitted historical trend ${direction}. Your selected method forecasts ${format(pred[0])} for ${timeLabel(a.future[0])} and ${format(pred.at(-1))} for ${timeLabel(a.future.at(-1))}.`,
    score ? `Historical predictions missed by ${format(score.mae)} ${unit || "series units"} on average in absolute terms. Use this error as a sense of scale when testing your decision threshold.`
      : "This setup has limited evidence about future errors. Consider how a higher or lower outcome would affect the decision.",
    method === "moving" ? "A moving average can lag a changing trend. Later forecasts reuse earlier predicted values."
      : method === "trend" ? "The regression extends the observed trend. A change in conditions could invalidate that assumption."
        : "The seasonal forecast assumes the historical monthly pattern repeats. Inspect how many centered ratios support each month."
  ];
  if (pred.some(x => x < 0)) notes.push("Some predictions are negative. Check whether negative values make sense for this decision.");
  by("interpretation").replaceChildren(...notes.map(note => element("p", note)));
  if (a.factors && method === "seasonal") {
    const details = element("details");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    details.append(element("summary", "Monthly factors"), table(["Month", "Factor", "Centered ratios"], a.factors.map(({factor, count}, i) => [months[i], factor.toFixed(4), count])));
    by("interpretation").append(details);
  }
  by("results").hidden = false;
}

by("goal-form").addEventListener("submit", event => {
  event.preventDefault();
  try {
    const { points } = selectedSeries();
    const cadence = by("cadence").value;
    const horizon = +by("horizon").value;
    const window = +by("window").value;
    const seasonal = by("seasonality").checked;
    const analysis = forecast(points, cadence, horizon, window, seasonal);
    report = { analysis, points, cadence, horizon, window, seasonal, unit: by("unit").value.trim(), goal: by("goal").value.trim() };
    options("method", analysis.choices.map(key => [key, methods[key]]), analysis.recommendation ?? analysis.fallback);
    by("error").hidden = true;
    by("preview").hidden = true;
    step(2);
    render();
    if (matchMedia("(max-width: 735px)").matches) by("results").scrollIntoView({ block: "start" });
  } catch (error) {
    by("error").textContent = error.message;
    by("error").hidden = false;
  }
});
by("method").addEventListener("change", render);
by("reflection").addEventListener("focus", () => step(3));
by("export").addEventListener("click", async () => {
  const button = by("export");
  button.disabled = true;
  try {
    const out = resultWorkbook(Excel, report.analysis, report.points, by("method").value, report.goal, report.cadence, report.window, report.unit);
    out.getWorksheet("Analysis").addRow(["Decision threshold", by("reflection").value.trim()]);
    const blob = new Blob([await out.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = element("a");
    anchor.href = url;
    anchor.download = "forecasting-coach-results.xlsx";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    by("error").textContent = "The Excel export could not be created. Try again.";
    by("error").hidden = false;
  } finally {
    button.disabled = false;
  }
});
