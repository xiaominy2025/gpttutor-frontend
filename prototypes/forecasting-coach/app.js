import Excel from "exceljs/dist/exceljs.min.js";
import "./style.css";
import { coordinate, forecast, methods, movingWindows, planningScenarios } from "./engine.js";
import { businessPatterns, evidenceCategory, regressionEvidence } from "./trend-evidence.js";
import { compareValues, describeSeason, months, regressionChange } from "./interpretation.js";
import { conversions, convertFrequency, detectFrequency, frequencies } from "./frequency.js";
import { readSeries, resultWorkbook } from "./excel.js";
import { defaultHorizons, parseProject, projectApp, projectFilename, projectSizeLimit, projectVersion, validateProject } from "./project.js";
import { formatBusinessPercent, formatDisplayedValue } from "./display-number.js";
import { forecastPeriodLabel, measuredValue, movingInsight, regressionInsight, reliabilityInsight, seasonalReliabilityInsight, seasonalRangeInsight } from "./insight-copy.js";
import { buildAdvisorRequest, requestAdvisor } from "./management-advisor.js";

const by = id => document.getElementById(id);
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
const format = x => nf.format(x);
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format;
const timeLabel = t => t instanceof Date ? t.toISOString().slice(0, 10) : String(t);
const probability = p => p === null ? "Unavailable" : p.toPrecision(6);
let workbook, report, history, workspaceSeries, workbookRead = 0, projectRead = 0;
let manualWindow, sourceName, dirty = false;
let timelineSelection;
let advisorRequest;
const mockAdvisorEnabled = import.meta.env.DEV && import.meta.env.MODE === "advisor-mock" && location.hostname === "127.0.0.1";
const alphaPlatform = import.meta.env.PROD &&
  ["alpha-workspace", "advisor-alpha"].includes(import.meta.env.MODE) &&
  location.origin === "https://d6owpirihdsus.cloudfront.net";
const alphaAdvisorEnabled = alphaPlatform && import.meta.env.MODE === "advisor-alpha";
const horizons = { ...defaultHorizons };

function element(type, content) {
  const node = document.createElement(type);
  if (content !== undefined) node.textContent = content;
  return node;
}

const definitions = {
  "Historical Tests (n)": "The number of past forecasts compared against actual observations at the same lead time.",
  "Evidence categories": "Engent Labs exploratory screening conventions for two-sided p-values, not conventional statistical standards. Very Strong: below 0.05. Strong: 0.05 to below 0.15. Modest: 0.15 to below 0.30. Weak: 0.30 or higher. These categories help identify patterns worth investigating. They do not measure the size of a trend, forecast accuracy, or the probability that a trend is true or will continue.",
  "Seasonal Indices": "An index of 1.00 represents the underlying trend. Above 1.00 is higher than trend, and below 1.00 is lower than trend. Indices are estimated from historical observations using centered moving averages and ratios for each period.",
  MAE: "Historical MAE shows the average size of past forecast misses at the same forecast horizon, in the original units. It helps managers understand the scale of historical forecast errors but does not guarantee future accuracy.",
  MSE: "MSE gives larger forecasting mistakes more weight. It is used to compare moving-average windows evaluated over the same historical periods. Lower historical MSE does not guarantee better future performance.",
  "Planning Scenarios": "Low and High are the calculated forecast minus and plus historical MAE at the matching lead time. They are illustrative planning scenarios, not prediction intervals or guaranteed bounds. No probabilities are assigned.",
  "Moving-average window": "How many recent actual observations go into the next forecast. A shorter window reacts faster to changes. A longer window smooths fluctuations.",
  "Data Frequency": "How often the original observations are recorded, such as monthly or quarterly.",
  "Forecast Frequency": "The time unit for each projected value. A coarser frequency combines the historical data first.",
  "Forecast Horizon": "How many future periods you want to plan for. The frequency determines how long each period lasts.",
  "Seasonal Cycle": "How often the pattern is assumed to repeat. Here, a yearly cycle repeats every 12 months."
};
let tooltipId = 0;
let activeTooltip;
const repositionTooltip = () => activeTooltip?.position();
window.addEventListener("resize", repositionTooltip);
window.addEventListener("scroll", repositionTooltip, true);
window.visualViewport?.addEventListener("resize", repositionTooltip);
window.visualViewport?.addEventListener("scroll", repositionTooltip);

function help(term, label = term, action) {
  const wrapper = element("span", label);
  wrapper.className = "term-help";
  const button = action?.control ?? element("button", "ⓘ");
  const trigger = action?.trigger ?? button;
  const tip = element("span", action ? term : definitions[term]);
  tip.className = "term-tooltip";
  tip.id = "term-help-" + ++tooltipId;
  tip.setAttribute("role", "tooltip");
  tip.setAttribute("popover", "manual");
  if (!action) {
    button.type = "button";
    button.setAttribute("aria-label", "About " + term);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-describedby", tip.id);
  }
  let pinned = false;
  const position = () => {
    if (!button.isConnected) { close(); return; }
    const anchor = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const x = viewport?.offsetLeft ?? 0;
    const y = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? innerWidth;
    const height = viewport?.height ?? innerHeight;
    if (anchor.bottom < y || anchor.top > y + height || anchor.right < x || anchor.left > x + width) { close(); return; }
    tip.style.maxWidth = Math.min(272, width - 16) + "px";
    tip.style.maxHeight = height - 16 + "px";
    const left = Math.max(x + 8, Math.min(anchor.left, x + width - tip.offsetWidth - 8));
    const preferredTop = anchor.bottom + tip.offsetHeight + 8 <= y + height ? anchor.bottom : anchor.top - tip.offsetHeight;
    tip.style.left = left + "px";
    tip.style.top = Math.max(y + 8, Math.min(preferredTop, y + height - tip.offsetHeight - 8)) + "px";
  };
  const close = () => {
    pinned = false;
    tip.hidePopover();
    if (!action) button.setAttribute("aria-expanded", "false");
    if (activeTooltip?.position === position) activeTooltip = undefined;
  };
  const open = () => {
    if (activeTooltip?.position !== position) activeTooltip?.close();
    tip.showPopover();
    activeTooltip = { close, position };
    if (!action) button.setAttribute("aria-expanded", "true");
    position();
  };
  button.addEventListener("click", () => {
    if (action) { close(); return; }
    if (pinned) close();
    else { pinned = true; open(); }
  });
  trigger.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") open(); });
  trigger.addEventListener("pointerleave", event => {
    if (!pinned && !button.matches(":focus-visible") && event.relatedTarget !== tip) close();
  });
  tip.addEventListener("pointerleave", event => {
    if (!pinned && !button.matches(":focus-visible") && event.relatedTarget !== trigger) close();
  });
  button.addEventListener("focus", () => { if (button.matches(":focus-visible")) open(); });
  button.addEventListener("blur", close);
  button.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
  });
  if (action) trigger.after(tip);
  else wrapper.append(button, tip);
  return wrapper;
}

document.querySelectorAll("[data-term], [data-help]").forEach(node =>
  node.replaceWith(node.dataset.term ? help(node.dataset.term) : help(node.dataset.help, "")));

const icons = {
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5",
  forecast: "M3 3v17h18M7 15l4-4 3 2 6-7m-5 0h5v5",
  export: "M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5",
  advisor: "M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9L10 3Zm9 10v6m-3-3h6M19 3v4m-2-2h4"
};
document.querySelectorAll("[data-icon]").forEach(trigger => {
  trigger.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[trigger.dataset.icon]}"/></svg>`;
  const control = trigger.dataset.icon === "upload" ? by("file") : trigger;
  help(control.getAttribute("aria-label"), "", { control, trigger });
});
document.querySelectorAll("[data-project-icon]").forEach(control => {
  const glyph = element("span");
  glyph.className = "project-icon project-icon-" + control.dataset.projectIcon;
  glyph.setAttribute("aria-hidden", "true");
  control.append(glyph);
  help(control.getAttribute("aria-label"), "", { control });
});

function putCell(cell, value) {
  if (value instanceof Node) cell.append(value);
  else cell.textContent = value;
}
function options(id, list, selected) {
  by(id).replaceChildren(...list.map(([value, label]) => new Option(label, value)));
  if (selected !== undefined) by(id).value = selected;
}

function currentSheet() { return workbook.worksheets[Number(by("sheet").value)]; }

function columnHeading(sheet, column) {
  const heading = sheet.getCell(1, column).text;
  return heading.trim() ? heading : `Column ${column}`;
}

function selectedHeadings() {
  const sheet = currentSheet();
  return { time: columnHeading(sheet, +by("date").value), target: columnHeading(sheet, +by("target").value) };
}

function table(headers, rows, numericColumns = []) {
  const wrapper = element("div");
  wrapper.className = "table-wrap";
  const grid = element("table");
  const header = grid.createTHead().insertRow();
  for (const [index, title] of headers.entries()) {
    const cell = element("th");
    putCell(cell, title);
    cell.classList.toggle("numeric", numericColumns.includes(index));
    cell.scope = "col";
    header.append(cell);
  }
  const body = grid.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    row.forEach((value, index) => {
      const cell = tr.insertCell();
      cell.classList.toggle("numeric", numericColumns.includes(index));
      putCell(cell, value);
    });
  }
  wrapper.append(grid);
  return wrapper;
}

function invalidate() {
  resetAdvisor();
  report = undefined;
  by("results").hidden = true;
  by("export").disabled = true;
  by("error").hidden = true;
}

function resetAdvisor() {
  advisorRequest?.abort();
  advisorRequest = undefined;
  by("advisor-result").hidden = true;
  by("advisor-text").textContent = "";
  by("advisor-run").disabled = false;
  by("advisor-run").removeAttribute("aria-busy");
  if (mockAdvisorEnabled) {
    by("advisor-run").hidden = false;
    by("advisor-status").textContent = "Local mock preview. No provider call is made.";
  } else if (alphaAdvisorEnabled) {
    by("advisor-run").hidden = false;
    by("advisor-status").textContent = "Generating sends the business challenge and a forecast summary to the AI provider.";
  }
}

function selectedSeries() {
  return readSeries(currentSheet(), +by("date").value, +by("target").value, "auto", +by("row").value);
}

function preview() {
  invalidate();
  timelineSelection = undefined;
  history = undefined;
  by("patterns").hidden = true;
  by("preview").hidden = !workbook;
  if (!workbook) return;
  try {
    const { points, cached } = selectedSeries();
    const { time, target } = selectedHeadings();
    const grid = table([time, target], points.map(p => [timeLabel(p.time), format(p.value)]), [1]);
    grid.classList.add("preview-grid");
    grid.tabIndex = 0;
    grid.setAttribute("role", "region");
    grid.setAttribute("aria-label", "Imported observations");
    by("preview-body").replaceChildren(element("p", `${points.length} observations from ${timeLabel(points[0].time)} to ${timeLabel(points.at(-1).time)}.`),
      grid);
    if (cached) by("preview-body").append(element("p", `${cached} rows use saved Excel formula results.`));
    by("unit-field").hidden = /\([^()]+\)|\[[^\]]+\]/.test(target);
    renderHistory(points);
    try {
      const frequency = detectFrequency(points);
      history = { points, frequency };
      by("preview-body").prepend(element("p", "Data Frequency: " + frequencies[frequency]));
      options("cadence", conversions[frequency].map(key => [key, frequencies[key]]), frequency);
      manualWindow = undefined;
      by("aggregation").value = "";
    } catch (error) {
      by("preview").open = true;
      by("preview-body").prepend(element("p", error.message));
    }
  } catch (error) {
    by("preview").open = true;
    by("preview-body").replaceChildren(element("p", error.message));
  }
  updateSettings();
}

function columns() {
  const sheet = currentSheet();
  const entries = Array.from({ length: sheet.columnCount }, (_, i) => [i + 1, columnHeading(sheet, i + 1)]);
  options("date", entries, 1);
  options("target", entries, 2);
  preview();
}

function showWorkbook(imported, label) {
  workbook = imported;
  sourceName = label;
  options("sheet", workbook.worksheets.map(({name}, i) => [i, name]));
  by("file-status").textContent = label;
  by("mapping").disabled = false;
  by("row").value = 2;
  by("preview").open = false;
  by("patterns").open = true;
  projectError();
  columns();
}

by("sample").addEventListener("click", () => {
  workbookRead++;
  by("file").value = "";
  const sample = new Excel.Workbook();
  const sheet = sample.addWorksheet("Monthly demand");
  const seasonal = [-14, -10, -5, 2, 8, 13, 17, 12, 5, -1, -7, -11];
  const variation = [1, -3, 2, -1, 3];
  sheet.addRow(["Month", "Units sold"]);
  for (let i = 0; i < 36; i++) {
    sheet.addRow([new Date(Date.UTC(2023, i, 1)), 100 + i * 2 + seasonal[i % 12] + variation[i % 5]]);
  }
  by("approach").value = "recommend";
  horizons.recommend = 6;
  by("horizon").value = 6;
  by("window-mode").value = "auto";
  by("goal").value = "How many units should we stock over the next six months?";
  by("unit").value = "";
  by("reflection").value = "";
  showWorkbook(sample, "Sample monthly demand · synthetic data");
  setDirty(true);
});

by("file").addEventListener("change", async () => {
  const read = ++workbookRead;
  const file = by("file").files[0];
  by("file").value = "";
  if (!file) return;
  by("file").disabled = true;
  by("file").setAttribute("aria-busy", "true");
  by("file-status").textContent = "Reading workbook…";
  try {
    if (!/\.xlsx$/i.test(file.name) || file.size > 10 * 1024 * 1024) throw Error("Choose an .xlsx workbook up to 10 MB.");
    const imported = new Excel.Workbook();
    await imported.xlsx.load(await file.arrayBuffer());
    if (read !== workbookRead) return;
    if (!imported.worksheets.length) throw Error("The workbook has no worksheets.");
    by("reflection").value = "";
    showWorkbook(imported, file.name);
    setDirty(true);
  } catch (error) {
    if (read === workbookRead) {
      by("file-status").textContent = sourceName ?? "No Excel workbook loaded.";
      projectError("Could not load the Excel workbook. " + error.message);
    }
  } finally {
    by("file").disabled = false;
    by("file").removeAttribute("aria-busy");
  }
});
by("sheet").addEventListener("change", () => { columns(); setDirty(true); });
for (const id of ["date", "target", "row"]) by(id).addEventListener("input", preview);

by("unit").addEventListener("input", () => {
  invalidate();
  if (history) renderHistory(history.points);
});
by("goal").addEventListener("input", resetAdvisor);
resetAdvisor();
if (alphaPlatform) {
  import("./alpha-header.jsx").then(({ mountAlphaHeader }) => mountAlphaHeader()).catch(() => {
    document.querySelector(".session-state").textContent = "Account unavailable";
  });
}
by("advisor-run").addEventListener("click", async () => {
  if (!(mockAdvisorEnabled || alphaAdvisorEnabled) || !report || advisorRequest) return;
  const active = new AbortController();
  advisorRequest = active;
  by("advisor-run").disabled = true;
  by("advisor-run").setAttribute("aria-busy", "true");
  by("advisor-result").hidden = true;
  by("advisor-status").textContent = mockAdvisorEnabled ? "Preparing a local mock insight…" : "Preparing a management insight…";
  try {
    const selected = Number(by("forecast-period").value) - report.points.length - 1;
    const summary = buildAdvisorRequest(report, by("goal").value, selected);
    const draft = await requestAdvisor(summary, { signal: active.signal, guest: alphaAdvisorEnabled });
    if (advisorRequest !== active) return;
    by("advisor-text").textContent = draft;
    by("advisor-result").hidden = false;
    by("advisor-status").textContent = (mockAdvisorEnabled ? "Local mock insight. " : "AI-generated draft. ") +
      "Review it before writing your own actions.";
  } catch (error) {
    if (advisorRequest === active) by("advisor-status").textContent = error.message;
  } finally {
    if (advisorRequest === active) {
      advisorRequest = undefined;
      by("advisor-run").disabled = false;
      by("advisor-run").removeAttribute("aria-busy");
    }
  }
});
for (const id of ["cadence", "aggregation", "approach", "horizon", "window-mode", "window"]) {
  by(id).addEventListener("input", () => {
    const hadForecast = Boolean(report);
    if (id === "window") manualWindow = Number(by("window").value);
    if (id === "cadence") {
      by("aggregation").value = "";
      timelineSelection = undefined;
    }
    if (id === "horizon") horizons[by("approach").value] = by("horizon").value;
    if (id === "approach") by("horizon").value = horizons[by("approach").value] ?? 6;
    invalidate();
    updateSettings();
    if (hadForecast && !by("run").disabled) generateForecast();
  });
}

function seasonalSupported(points, frequency) {
  return frequency === "monthly" && points.length >= 24 && points.every(point => point.value > 0);
}

function renderWindowComparison({ candidates, evaluationSize }, selected, container = by("window-comparison")) {
  if (!candidates.length) {
    container.append(element("p", "Too few common historical forecasts to compare windows. At least five are required. Use another forecasting method or add more observations."));
    return;
  }
  const ranked = [...candidates].sort((a, b) => a.mse - b.mse || a.window - b.window);
  const displayed = ranked.slice(0, 3);
  const grid = table([help("Moving-average window", "Window"), help("MSE"), "Status"], displayed.map(({ window, mse }, index) => [
    window + " periods", whole(mse),
    [index === 0 ? "Lowest Historical MSE" : "", window === selected ? "Selected" : ""].filter(Boolean).join(" · ")
  ]), [0, 1]);
  grid.classList.add("window-table");
  grid.querySelector("tbody tr").classList.add("lowest-mse");
  displayed.forEach(({ window, mse }, index) => {
    const row = grid.querySelectorAll("tbody tr")[index];
    row.dataset.mse = mse;
    if (window === selected) row.classList.add("selected-window");
  });
  container.append(grid, element("p", evaluationSize + " common one-period historical forecasts per window."));
  if (!displayed.some(option => option.window === selected)) {
    const manual = ranked.find(option => option.window === selected);
    container.append(element("p", "Selected: " + selected + " periods · Historical MSE " + whole(manual.mse) + "."));
  }
  if (evaluationSize < 10) container.append(element("p", "Small historical sample. Interpret this comparison cautiously."));
}

function updateSettings() {
  const cadence = by("cadence").value;
  const approach = by("approach").value;
  const coarser = Boolean(history && history.frequency !== cadence);
  const moving = approach === "moving";
  const manual = by("window-mode").value === "manual";
  by("cadence").disabled = !history;
  if (!history) options("cadence", []);
  by("aggregation-field").hidden = !coarser;
  by("moving-settings").hidden = !moving;
  by("manual-window").hidden = !moving || !manual;
  by("horizon-field").hidden = moving;
  by("horizon").disabled = moving;
  by("seasonal-cycle").hidden = approach !== "seasonal";
  by("window-comparison").replaceChildren();
  by("frequency-note").textContent = "";
  by("approach-note").textContent = "";
  by("data-frequency").textContent = history ? frequencies[history.frequency] : workbook ? "Unavailable" : "Upload data to detect frequency";
  by("complete-observations").textContent = "—";
  workspaceSeries = undefined;
  by("run").disabled = true;
  if (!history) return;
  if (coarser && !by("aggregation").value) {
    by("frequency-note").textContent = "Confirm Sum for period totals, Average for rates, or Last value for balances.";
    return;
  }
  const converted = convertFrequency(history.points, history.frequency, cadence, by("aggregation").value);
  const { points, omitted } = converted;
  by("complete-observations").textContent = points.length;
  const frequencyNotices = [];
  if (history.frequency === "weekly") frequencyNotices.push("Weekly observations stay weekly because calendar boundaries may split a week.");
  if (omitted.length) frequencyNotices.push("Incomplete periods omitted: " + omitted.map(timeLabel).join(", ") + ". Forecasts start after the last complete period.");
  if (points.length < 3) frequencyNotices.push("At least three complete periods are required.");
  by("frequency-note").textContent = frequencyNotices.join(" ");
  const notices = [];
  if (approach === "seasonal" && !seasonalSupported(points, cadence)) notices.push("Seasonal forecasting requires 24 or more consecutive positive monthly observations.");
  if (approach === "recommend") {
    notices.push(seasonalSupported(points, cadence) ? "Choose Seasonal Forecasting to model a repeating annual pattern." : "Monthly seasonal forecasting is unavailable for this series.");
  }
  by("approach-note").textContent = notices.join(" ");
  if (points.length < 3 || (approach === "seasonal" && !seasonalSupported(points, cadence))) return;
  const automatic = movingWindows(points.map(point => point.value));
  const manualDefault = automatic.candidates.some(option => option.window === 3) ? 3 : automatic.candidates[0]?.window;
  const selected = automatic.candidates.some(option => option.window === manualWindow) ? manualWindow : manualDefault;
  options("window", automatic.candidates.map(option => [option.window, option.window + " periods"]), selected);
  by("window").disabled = !automatic.candidates.length;
  const window = automatic.candidates.length ? (moving && manual ? selected : automatic.selected) : null;
  if (moving) {
    renderWindowComparison(automatic, window);
    if (window === null) return;
  }
  workspaceSeries = { points, window, omitted, windowComparison: automatic };
  by("run").disabled = false;
}

function renderHistory(points) {
  const headings = selectedHeadings();
  const unit = by("unit-field").hidden ? "" : by("unit").value.trim();
  const chart = drawChart(points, [], [], headings, unit, "history-chart");
  const control = by("observation-index");
  control.max = points.length;
  control.value = 1;
  control.oninput = () => {
    const index = Number(control.value) - 1;
    const { time, value } = points[index];
    const label = timeLabel(time) + " · " + headings.target + " " + format(value) + (unit ? " " + unit : "");
    const marker = by("history-chart").querySelector("circle");
    marker.setAttribute("cx", chart.x(index));
    marker.setAttribute("cy", chart.y(value));
    by("observation-value").textContent = label;
    control.setAttribute("aria-valuetext", label);
  };
  control.oninput();
  by("patterns").hidden = false;
}

function renderTrendEvidence({ analysis }, stats) {
  const insight = businessPatterns(stats, analysis.runs);
  const trendLabel = insight.trendLevel
    ? insight.trendLevel + (insight.direction === "flat" ? " evidence of a direction" : " evidence of " + (insight.direction === "increasing" ? "an " : "a ") + insight.direction + " trend")
    : "evidence unavailable";
  const runsLabel = insight.runsLevel ? insight.runsLevel + " evidence of a systematic pattern" : "evidence unavailable";
  const trendHeading = element("h3", "Trend Insight ");
  trendHeading.append(help("Evidence categories"));
  by("trend-evidence").replaceChildren(
    trendHeading,
    element("p", trendLabel + ". " + insight.trend),
    element("h3", "Fluctuation Insight"),
    element("p", runsLabel + ". " + insight.fluctuation),
    element("h3", "Management Takeaway"),
    element("p", insight.takeaway)
  );
}

function renderMethodStatistics({ analysis, method, cadence, approach, window, windowComparison, points }, stats) {
  const panel = by("statistical-details");
  if (panel.dataset.method !== method) panel.open = false;
  panel.dataset.method = method;
  const content = by("method-statistics");
  content.replaceChildren();
  if (method === "trend") {
    const runs = analysis.runs;
    const value = number => number === null ? "Unavailable" : format(number);
    content.append(
      element("h3", "Linear Regression"),
      table(["Statistic", "Value"], [
        ["Intercept at first observation", value(stats.startValue)],
        ["Slope per " + (cadence === "periods" ? "period" : "day"), value(stats.slope)],
        ["R² on historical data", value(stats.rSquared)],
        ["Slope standard error", value(stats.standardError)],
        ["Slope t statistic", value(stats.t)],
        ["Slope significance · two-sided t-test p-value", probability(stats.p)],
        ["Degrees of freedom", stats.df]
      ], [1]),
      element("p", "R² describes historical fit. The classical slope test assumes independent, normally distributed errors with constant variance. Dependence over time can make the p-value misleading."),
      element("h3", "Runs Test"),
      table(["Statistic", "Value"], [
        ["Observations", points.length], ["Historical mean", value(runs.mean)],
        ["At or above the mean", runs.above], ["Below the mean", runs.below], ["Ties at the mean", runs.ties],
        ["Observed runs", runs.runs], ["Expected runs under random ordering", value(runs.expected)],
        ["Runs z statistic", value(runs.z)], ["Two-sided p-value", probability(runs.p)],
        ["Workbook normal cumulative probability", probability(runs.cumulative)]
      ], [1]),
      element("p", "The workbook assigns ties to the upper group. The normal approximation needs more than 10 observations in each group and positive variance. The evidence category uses the two-sided p-value.")
    );
  } else if (method === "moving") {
    content.append(element("p", "Selected moving-average window: " + window + " periods."));
    if (approach === "moving") {
      const link = element("a", "View the Historical Window Comparison");
      link.href = "#window-heading";
      content.append(link);
    } else {
      content.append(element("h3", "Historical Window Comparison"));
      renderWindowComparison(windowComparison, window, content);
    }
  } else {
    const { entries } = describeSeason(analysis.factors);
    const heading = element("h3");
    heading.append(help("Seasonal Indices"));
    const details = element("details");
    const count = entries[0].count;
    const counts = entries.every(entry => entry.count === count)
      ? element("p", "Historical ratios used: " + count + " per month.")
      : table(["Period", "Historical ratios used"], entries.map(({ period, count }) => [period, count]), [1]);
    details.append(element("summary", "Seasonal calculation details"),
      element("p", "For each calendar month, the workbook averages the historical ratios of observations to their centered 12-month averages. It multiplies the fitted trend by that month's index."), counts);
    if (entries.some(entry => entry.count < 2)) details.append(element("p", "Some monthly indices use only one historical ratio. Treat the pattern as preliminary."));
    content.append(heading,
      table(["Period", "Seasonal Index"], entries.map(({ period, factor }) => [period, factor.toFixed(3)]), [1]), details);
  }
}

const chartObservers = new WeakMap();
const compactAxis = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

function drawChart(points, future, predictions, headings, unit, target = "chart") {
  const container = by(target);
  chartObservers.get(container)?.disconnect();
  const before = points.map(point => point.value);
  const all = before.concat(predictions);
  const dates = points.map(point => point.time).concat(future);
  const lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
  const left = 65, top = 16, bottom = 174;
  let right = 740 - 16;
  const first = coordinate(dates[0]);
  const last = coordinate(dates.at(-1));
  const dateAxis = !future.length && last > first && dates.every(date => typeof date === typeof dates[0]);
  const x = i => left + (right - left) * (dateAxis ? (coordinate(dates[i]) - first) / (last - first) : i / Math.max(1, all.length - 1));
  const y = value => bottom - (value - lo + span * .07) / (span * 1.14) * (bottom - top);
  const line = (values, i = 0) => values.map((value, j) => `${x(i + j)},${y(value)}`).join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4).filter((value, i, ticks) => !i || value !== ticks[i - 1]);
  const legend = element("p", `${headings.target} by ${headings.time} · Actual (solid)${future.length ? " · Forecast (dashed)" : ""}${unit && unit !== headings.target ? " · " + unit : ""}`);
  legend.className = "legend";
  const plot = element("div");
  container.replaceChildren(legend, plot);
  let previousWidth;
  let selectedTimeline = before.length;

  function selectTimeline(index) {
    selectedTimeline = index;
    const marker = plot.querySelector(".timeline-marker");
    if (!marker) return;
    const actual = index < before.length;
    marker.setAttribute("cx", x(index));
    marker.setAttribute("cy", y(all[index]));
    marker.setAttribute("fill", actual ? "#1c526b" : "#087167");
    marker.dataset.kind = actual ? "actual" : "forecast";
    marker.dataset.index = index + 1;
  }

  function paint(width) {
    if (previousWidth === width) return false;
    previousWidth = width;
    right = width - 16;
    const divider = future.length ? (x(before.length - 1) + x(before.length)) / 2 : right;
    plot.innerHTML = `<svg class="chart" viewBox="0 0 ${width} 210" role="img" aria-label="${future.length ? "Historical actuals and projected forecast across time" : "Historical observations across time"}">
      ${future.length ? `<rect x="${divider}" y="${top}" width="${right - divider}" height="${bottom - top}" fill="#e4f4ef"/>
      <line x1="${divider}" y1="${top}" x2="${divider}" y2="${bottom}" stroke="#6e9c99" stroke-dasharray="3 5"/>` : ""}
      ${ticks.map(value => {
        const label = formatDisplayedValue(value);
        return `<line x1="${left}" y1="${y(value)}" x2="${right}" y2="${y(value)}" stroke="#d8e5eb"/>
        <text x="${left - 7}" y="${y(value) + 4}" text-anchor="end" fill="#375469" font-size="12">${label.length > 8 ? compactAxis.format(value) : label}</text>`;
      }).join("")}
      <polyline points="${line(before)}" fill="none" stroke="#1c526b" stroke-width="2"/>
      ${future.length ? `<polyline points="${line([before.at(-1), ...predictions], before.length - 1)}" fill="none" stroke="#087167" stroke-width="2" stroke-dasharray="7 4"/>
      <circle class="timeline-marker" r="5" fill="#087167" stroke="white" stroke-width="2"/>`
        : '<circle r="5" fill="#087167" stroke="white" stroke-width="2"/>'}
      <text x="${left}" y="195" fill="#375469" font-size="12">${timeLabel(dates[0])}</text>
      <text x="${right}" y="195" text-anchor="end" fill="#375469" font-size="12">${timeLabel(dates.at(-1))}</text>
    </svg>`;
    if (future.length) selectTimeline(selectedTimeline);
    return true;
  }

  paint(Math.max(190, plot.clientWidth || 740));
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width && paint(Math.max(190, Math.round(entry.contentRect.width))) && target === "history-chart") {
      by("observation-index").oninput?.();
    }
  });
  chartObservers.set(container, observer);
  observer.observe(plot);
  return { x, y, selectTimeline };
}

function renderForecastAccuracy({ analysis, method, points, headings, unit }, { selectTimeline }) {
  const values = analysis.predictions[method];
  const valueLabel = headings.target + (unit && unit !== headings.target ? " (" + unit + ")" : "");
  const scenarios = planningScenarios(values, analysis.leadScores);
  const count = points.length + values.length;
  const dates = points.map(point => timeLabel(point.time)).concat(analysis.future.map(timeLabel));
  const results = by("prediction-table");
  const period = element("div");
  const description = element("p", valueLabel);
  description.className = "forecast-variable";
  const label = element("label", "Timeline period");
  const slider = element("input");
  slider.id = "forecast-period";
  slider.type = "range";
  slider.min = "1";
  slider.max = String(count);
  label.append(slider);
  const rangeLabels = element("div");
  rangeLabels.className = "timeline-labels";
  rangeLabels.append(element("span", "Historical observations"), element("span", "Forecast periods"));
  results.replaceChildren(description, label, rangeLabels, period);

  function select(index) {
    selectTimeline(index);
    const actual = index < points.length;
    const kind = actual ? "actual" : "forecast";
    const date = dates[index];
    const lead = index - points.length;
    const value = actual ? points[index].value : values[lead];
    const scenario = actual ? null : scenarios[lead];
    timelineSelection = { date, kind };
    slider.setAttribute("aria-valuetext", date + ", " + kind + " " + formatDisplayedValue(value) + " " + valueLabel);
    const names = scenario ? ["Time", "Low", "Base", "High"] : ["Time", actual ? "Actual" : "Base Forecast"];
    const amounts = scenario ? [scenario.low, value, scenario.high] : [value];
    const grid = table(names, [[date, ...amounts.map(formatDisplayedValue)]], scenario ? [1, 2, 3] : [1]);
    grid.classList.add("selected-period");
    period.replaceChildren(grid);
    if (scenario) period.append(help("Planning Scenarios", "MAE-based planning scenarios"));
    if (!actual && !scenario) {
      const notice = element("p");
      notice.append(help("Planning Scenarios", "Low/High unavailable: insufficient historical forecast data."));
      period.append(notice);
    }
  }

  const previous = dates.findIndex((date, i) =>
    timelineSelection?.date === date && timelineSelection.kind === (i < points.length ? "actual" : "forecast"));
  const initial = previous < 0 ? points.length : previous;
  slider.value = String(initial + 1);
  slider.addEventListener("input", () => select(Number(slider.value) - 1));
  select(initial);

  const accuracy = by("accuracy");
  const accuracyRows = analysis.leadScores.flatMap((score, i) => score
    ? [[i === 0 ? "1 period" : (i + 1) + " periods", format(score.mae), whole(score.mse), score.count]]
    : []);
  if (accuracyRows.length) {
    accuracy.replaceChildren(
      table([help("Forecast Horizon", "Lead time"), help("MAE", "MAE · original units"), help("MSE", "MSE · squared units"),
        help("Historical Tests (n)")], accuracyRows, [1, 2, 3])
    );
    accuracy.prepend(element("p", valueLabel + ". Each historical test uses only observations available at the time of the forecast."));
    if (accuracyRows.length < values.length) accuracy.append(element("p", "Only lead times with at least three historical forecasts are shown."));
  } else {
    accuracy.replaceChildren(element("p", "Historical accuracy is unavailable at these lead times. At least three historical forecasts with known outcomes are required."));
  }
  if (analysis.seasonalBacktest) {
    const { trainingMonths, centeredObservations, comparisons, minimumComparisons } = analysis.seasonalBacktest;
    accuracy.append(element("p", "The first historical test trains on " + trainingMonths + " months. Each subsequent test refits using only data available at that date. " +
      "Across this dataset, " + centeredObservations + " historical observations contribute centered ratios to the seasonal factors. " +
      "The complete model can be fitted across the historical series. Those fitted values use the full dataset. The error table uses held-out actuals only."));
    if (comparisons.some(count => count < minimumComparisons)) accuracy.append(element("p",
      "Available held-out comparisons by lead, starting at one month: " + comparisons.join(", ") + "."));
  }
}

function renderInterpretation({ analysis, method, points, cadence, unit, headings, window }, stats) {
  const subject = headings.target;
  const values = analysis.predictions[method];
  const measured = value => measuredValue(value, unit);
  let expected, past, caution, seasonalRows = [];
  if (method === "moving") {
    const latest = points.at(-1);
    const recent = points.slice(-window).map(point => point.value);
    expected = movingInsight(compareValues(latest.value, values[0]), latest.time, analysis.future[0], cadence, subject, unit);
    past = "The moving average uses the last " + window + " observations, which ranged from " +
      measured(Math.min(...recent)) + " to " + measured(Math.max(...recent)) + ".";
    caution = "A moving average smooths fluctuations and can lag a change in level.";
  } else if (method === "trend") {
    expected = regressionInsight(regressionChange(points, analysis.future, values, stats.endValue), cadence, subject, unit);
    const trends = businessPatterns(stats, analysis.runs);
    const fluctuation = !trends.runsLevel || trends.runsLevel === "Weak" ? "The runs test gives limited evidence of persistence or reversals."
      : analysis.runs.z < 0 ? "Observations tended to stay on one side of their average in stretches."
        : "Observations tended to switch sides of their average frequently.";
    past = "The historical fit is " + trends.direction + (trends.trendLevel ? " with " + trends.trendLevel.toLowerCase() + " evidence of a directional trend" : " with unavailable slope evidence") + ". " + fluctuation;
    caution = "The projection assumes the historical relationship continues.";
  } else {
    const season = describeSeason(analysis.factors);
    expected = seasonalRangeInsight(values, analysis.future, cadence, subject, unit);
    past = season.uniform ? "The estimated seasonal effects are effectively the same across the annual cycle."
      : "These months show the strongest and weakest seasonal effects and other notable departures from trend. Seasonal strength and the absolute forecast can peak in different months.";
    const effects = season.uniform ? [] : [...season.peaks, ...season.lows, ...season.notable.slice(0, 3)];
    seasonalRows = effects.map(({ period, factor }) => {
      const effect = Math.abs(factor - 1) < 1e-9 ? "at underlying trend"
        : formatBusinessPercent(Math.abs((factor - 1) * 100)) + (factor > 1 ? " above" : " below") + " underlying trend";
      const forecasts = analysis.future.flatMap((date, i) => months[date.getUTCMonth()] === period
        ? [forecastPeriodLabel(date, cadence) + ": " + measured(values[i])] : []);
      return [period + " — " + effect, forecasts.join(" · ")];
    });
  }
  const content = by("interpretation");
  content.replaceChildren(
    element("h3", "What should we expect?"), element("p", expected),
    element("h3", "What does history reveal?"), element("p", past)
  );
  if (seasonalRows.length) {
    const list = element("ul");
    list.className = "seasonal-insights";
    for (const [name, forecast] of seasonalRows) {
      const item = element("li");
      item.append(name);
      if (forecast) item.append(element("span", "Forecast: " + forecast));
      list.append(item);
    }
    content.append(list);
  }
  const reliability = analysis.seasonalBacktest ? seasonalReliabilityInsight(analysis.leadScores, analysis.seasonalBacktest, unit)
    : reliabilityInsight(analysis.leadScores, unit) + " " + caution;
  content.append(element("h3", "How reliable is the forecast?"), element("p", reliability));
}

function render() {
  const { analysis: a, points, unit, headings, horizon } = report;
  const { method, approach, window } = report;
  const pred = a.predictions[method];
  const summary = methods[method] + " · " + (horizon === 1 ? "1 forecast period" : horizon + " forecast periods");
  const reason = method === "moving" ? "Start with recent actuals for the next period."
    : "Start with the historical trend. Choose seasonal forecasting if a repeating annual pattern is relevant.";
  by("recommendation").textContent = summary + (method === "moving" ? " · " + window + "-period window" : "")
    + (approach === "recommend" ? ". " + reason : "");
  const plot = drawChart(points, a.future, pred, headings, unit);
  renderForecastAccuracy(report, plot);
  const stats = method === "trend" ? regressionEvidence(points) : null;
  by("trend-reliability").hidden = !stats;
  if (stats) renderTrendEvidence(report, stats);
  else by("trend-evidence").replaceChildren();
  renderInterpretation(report, stats);
  renderMethodStatistics(report, stats);
  by("results").hidden = false;
}

function generateForecast() {
  if (!workspaceSeries || !by("goal-form").reportValidity()) return;
  try {
    const { points, window, omitted, windowComparison } = workspaceSeries;
    const cadence = by("cadence").value;
    const approach = by("approach").value;
    const horizon = approach === "moving" ? 1 : +by("horizon").value;
    const method = approach === "recommend" ? (horizon === 1 && window ? "moving" : "trend") : approach;
    const analysis = forecast(points, cadence, horizon, window ?? Infinity, method === "seasonal",
      { student: true, method, windowEvaluationSize: windowComparison.evaluationSize });
    report = { analysis, method, approach, points, cadence, horizon, window, omitted, windowComparison, headings: selectedHeadings(),
      frequency: history.frequency, aggregation: by("aggregation").value,
      unit: by("unit-field").hidden ? "" : by("unit").value.trim() };
    by("error").hidden = true;
    by("forecast-panel").open = true;
    by("decision-panel").open = true;
    render();
    by("patterns").open = false;
    by("export").disabled = false;
  } catch (error) {
    by("error").textContent = error.message;
    by("error").hidden = false;
  }
}

by("goal-form").addEventListener("submit", event => {
  event.preventDefault();
  generateForecast();
  if (report) {
    const heading = by("forecast-heading");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start" });
  }
});

function warnOnLeave(event) {
  event.preventDefault();
  event.returnValue = true;
}

function setDirty(value, message = value ? "Unsaved changes" : "Untitled project") {
  if (value !== dirty) {
    window[value ? "addEventListener" : "removeEventListener"]("beforeunload", warnOnLeave);
    dirty = value;
  }
  by("project-status").textContent = message;
}

function projectError(message = "") {
  by("project-error").textContent = message;
  by("project-error").hidden = !message;
}

function confirmDiscard() {
  return !dirty || window.confirm("Discard unsaved changes to this Forecasting Coach project?");
}

function clearProject() {
  workbook = history = sourceName = manualWindow = timelineSelection = undefined;
  for (const id of ["goal", "unit", "reflection", "aggregation", "file", "project-file"]) by(id).value = "";
  for (const id of ["sheet", "date", "target"]) options(id, []);
  Object.assign(horizons, defaultHorizons);
  by("approach").value = "recommend";
  by("horizon").value = horizons.recommend;
  by("window-mode").value = "auto";
  by("row").value = 2;
  by("mapping").disabled = true;
  by("file-status").textContent = "No Excel workbook loaded.";
  by("unit-field").hidden = false;
  by("preview").hidden = true;
  by("patterns").hidden = true;
  by("statistical-details").open = false;
  invalidate();
  updateSettings();
}

function projectSnapshot() {
  let data = null;
  if (workbook) {
    const headings = selectedHeadings();
    data = {
      source: sourceName, worksheet: currentSheet().name, timeHeading: headings.time, targetHeading: headings.target,
      observations: selectedSeries().points.map(({ time, value }) => [time instanceof Date ? timeLabel(time) : time, value])
    };
  }
  return {
    application: projectApp, version: projectVersion, data,
    settings: { approach: by("approach").value, frequency: history ? by("cadence").value : null,
      aggregation: history ? by("aggregation").value : "", windowMode: by("window-mode").value,
      manualWindow: manualWindow ?? null,
      horizons: Object.fromEntries(Object.keys(defaultHorizons).map(key => [key, Number(horizons[key])])) },
    goal: by("goal").value, units: by("unit").value, communication: by("reflection").value
  };
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = element("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

document.addEventListener("input", event => {
  if (["date", "target", "row", "goal", "unit", "cadence", "aggregation", "approach", "horizon",
    "window-mode", "window", "reflection"].includes(event.target.id)) setDirty(true);
});

by("project-new").addEventListener("click", () => {
  if (!confirmDiscard()) return;
  workbookRead++;
  clearProject();
  projectError();
  setDirty(false);
});

by("project-save").addEventListener("click", () => {
  try {
    const project = projectSnapshot();
    validateProject(project);
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    if (blob.size > projectSizeLimit) throw Error("This project exceeds the 2 MB JSON limit.");
    const filename = projectFilename(project.data?.worksheet);
    download(blob, filename);
    projectError();
    setDirty(false, "Download started: " + filename);
  } catch (error) {
    projectError("Could not save the project. " + error.message);
  }
});

by("project-open").addEventListener("click", () => by("project-file").click());
by("project-file").addEventListener("change", async () => {
  const file = by("project-file").files[0];
  by("project-file").value = "";
  if (!file) return;
  const read = ++projectRead;
  const currentWorkbookRead = workbookRead;
  const isCurrent = () => read === projectRead && currentWorkbookRead === workbookRead;
  try {
    if (!/\.json$/i.test(file.name) || file.size > projectSizeLimit) throw Error("Choose a Forecasting Coach .json project up to 2 MB.");
    const project = parseProject(await file.text());
    if (!isCurrent()) return;
    let restored;
    if (project.data) {
      restored = new Excel.Workbook();
      const sheet = restored.addWorksheet(project.data.worksheet);
      sheet.addRow([project.data.timeHeading, project.data.targetHeading]);
      sheet.addRows(project.points.map(({ time, value }) => [time, value]));
    }
    if (!confirmDiscard()) return;
    workbookRead++;
    clearProject();
    if (restored) showWorkbook(restored, project.data.source);
    const { settings } = project;
    Object.assign(horizons, settings.horizons);
    by("approach").value = settings.approach;
    by("horizon").value = horizons[settings.approach] ?? defaultHorizons.recommend;
    if (history) by("cadence").value = settings.frequency;
    by("aggregation").value = settings.aggregation;
    by("window-mode").value = settings.windowMode;
    manualWindow = settings.manualWindow ?? undefined;
    by("goal").value = project.goal;
    by("unit").value = project.units;
    by("reflection").value = project.communication;
    if (project.points.length) renderHistory(project.points);
    updateSettings();
    if (workspaceSeries) generateForecast();
    projectError();
    setDirty(false, "Opened " + file.name);
  } catch (error) {
    if (read === projectRead) projectError("Could not open the project. " + error.message);
  }
});

by("export").addEventListener("click", async () => {
  const button = by("export");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    const out = resultWorkbook(Excel, report.analysis, report.points, report.method, by("goal").value.trim(), report.cadence, report.window, report.unit, report.headings);
    out.getWorksheet("Analysis").addRow(["Your Management Actions", by("reflection").value.trim()]);
    out.getWorksheet("Analysis").addRows([
      ["Data Frequency", frequencies[report.frequency]], ["Forecast Frequency", frequencies[report.cadence]],
      ["Aggregation", report.aggregation || "None"], ["Incomplete periods omitted", report.omitted.map(timeLabel).join(", ")],
      ["Seasonal Cycle", report.method === "seasonal" ? "12 months" : ""]
    ]);
    const blob = new Blob([await out.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    download(blob, "forecasting-coach-results.xlsx");
  } catch {
    by("error").textContent = "The Excel export could not be created. Try again.";
    by("error").hidden = false;
  } finally {
    button.disabled = !report;
    button.removeAttribute("aria-busy");
  }
});
