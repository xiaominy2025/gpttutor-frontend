import { methods, planningScenarios } from "./engine.js";
import { frequencies } from "./frequency.js";
import { formatDisplayedValue } from "./display-number.js";
import { forecastPeriodLabel } from "./insight-copy.js";
import "./print-report.css";

function node(tag, text) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  return element;
}

function appendSection(report, title, ...content) {
  const present = content.filter(Boolean);
  if (!present.length) return;
  const section = node("section");
  section.append(node("h2", title), ...present);
  report.append(section);
}

function copyContent(source) {
  if (!source?.textContent.trim()) return null;
  const clone = source.cloneNode(true);
  clone.querySelectorAll("button, [role=tooltip], input, .timeline-marker").forEach(element => element.remove());
  for (const element of [clone, ...clone.querySelectorAll("[id]")]) element.removeAttribute("id");
  return clone;
}

function forecastTable({ analysis, method, cadence }) {
  const table = node("table");
  const values = analysis.predictions[method];
  const scenarios = planningScenarios(values, analysis.leadScores ?? []);
  const ranges = scenarios.some(Boolean);
  function row(parent, tag, cells) {
    const tr = node("tr");
    tr.append(...cells.map(value => node(tag, value)));
    parent.append(tr);
  }
  row(table.createTHead(), "th", ["Period", ranges ? "Base forecast" : "Forecast",
    ...(ranges ? ["Illustrative low", "Illustrative high"] : [])]);
  const body = table.createTBody();
  analysis.future.forEach((time, i) => row(body, "td", [
    forecastPeriodLabel(time, cadence), formatDisplayedValue(values[i]),
    ...(ranges ? [scenarios[i]?.low, scenarios[i]?.high].map(value => value == null ? "—" : formatDisplayedValue(value)) : [])
  ]));
  return [table, ranges && node("p", "Illustrative planning estimates use historical MAE at the matching lead. No probabilities are assigned.")];
}

export function printForecastReport(snapshot) {
  const prior = document.querySelector(".forecast-print-report");
  if (prior) return;
  const report = node("article");
  report.className = "forecast-print-report";
  const { method, cadence, headings, source, unit, goal, chart, legend, actions, advice } = snapshot;
  const header = node("header");
  header.append(node("p", "Engent Labs"), node("h1", "Forecasting Report"),
    node("p", [headings.target, unit, methods[method], frequencies[cadence], source].filter(Boolean).join(" · ")));
  report.append(header);
  appendSection(report, "Business Decision or Challenge", goal && node("p", goal));
  const figure = chart && node("figure");
  if (figure) {
    const svg = chart.cloneNode(true);
    svg.querySelector(".timeline-marker")?.remove();
    figure.append(svg);
    if (legend) figure.append(node("figcaption", legend));
  }
  appendSection(report, "Forecast", figure, ...forecastTable(snapshot));
  appendSection(report, "Historical Patterns & Business Implications", copyContent(snapshot.patterns));
  appendSection(report, "Discover Key Insights", copyContent(snapshot.insights));
  appendSection(report, "AI Management Insight", advice && node("p", advice));
  appendSection(report, "Your Management Actions", actions && node("p", actions));
  document.body.append(report);
  const cleanup = () => report.remove();
  window.addEventListener("afterprint", cleanup, { once: true });
  try {
    window.print();
  } catch (error) {
    window.removeEventListener("afterprint", cleanup);
    cleanup();
    throw error;
  }
}
