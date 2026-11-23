import { conversions, detectFrequency } from "./frequency.js";

export const projectApp = "engent-labs-forecasting-coach";
export const projectVersion = 1;
export const projectSizeLimit = 2 * 1024 * 1024;
export const defaultHorizons = Object.freeze({ recommend: 6, trend: 6, seasonal: 12 });
const approaches = ["recommend", "moving", "trend", "seasonal"];
const aggregations = ["", "sum", "average", "last"];
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const bounded = (value, max) => typeof value === "string" && value.length <= max;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const valid = (check, message) => { if (!check) throw Error(message); };

function readTime(value) {
  if (Number.isSafeInteger(value) && value < Number.MAX_SAFE_INTEGER - 60) return value;
  if (typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value)) {
    const date = new Date(value + "T00:00:00Z");
    if (Number.isFinite(+date) && date.toISOString().slice(0, 10) === value) return date;
  }
  throw Error("A historical observation has an invalid time.");
}

export function validateProject(project) {
  valid(record(project) && project.application === projectApp, "This is not a Forecasting Coach project.");
  valid(project.version === projectVersion, "This Forecasting Coach project version is unsupported.");
  const { data, settings, goal, units } = project;
  const communication = project.communication ?? project.decisionReflection;
  valid(bounded(goal, 250) && bounded(units, 50) && bounded(communication, 500), "Project text is missing or exceeds the supported limits.");
  valid(record(settings) && approaches.includes(settings.approach) && aggregations.includes(settings.aggregation) &&
    ["auto", "manual"].includes(settings.windowMode) && record(settings.horizons) &&
    Object.keys(defaultHorizons).every(key => integer(settings.horizons[key], 1, 60)) &&
    (settings.manualWindow === null || integer(settings.manualWindow, 2, 12)), "Invalid forecast settings.");

  let points = [];
  let frequency = null;
  if (data !== null) {
    valid(record(data) && bounded(data.source, 1024) && bounded(data.worksheet, 31) && data.worksheet.trim() &&
      !/[\\/*?:\[\]]/.test(data.worksheet) && bounded(data.timeHeading, 32767) && bounded(data.targetHeading, 32767) &&
      data.timeHeading.trim() && data.targetHeading.trim() && Array.isArray(data.observations) &&
      data.observations.length >= 1 && data.observations.length <= 5000, "Invalid dataset or worksheet information.");
    points = data.observations.map(row => {
      valid(Array.isArray(row) && row.length === 2 && Number.isFinite(row[1]) && Math.abs(row[1]) <= 1e140, "A historical observation has an invalid value.");
      return { time: readTime(row[0]), value: row[1] };
    }).sort((a, b) => a.time - b.time);
    try { frequency = detectFrequency(points); } catch { /* Keep irregular data available as a draft. */ }
  }
  valid(frequency ? conversions[frequency].includes(settings.frequency) : settings.frequency === null,
    "Forecast frequency does not match the historical data.");
  valid(settings.frequency !== frequency || settings.aggregation === "", "Aggregation requires a coarser forecast frequency.");
  return { data, settings, goal, units, communication, points };
}

export function parseProject(text) {
  let project;
  try { project = JSON.parse(text); } catch { throw Error("The project file contains malformed JSON."); }
  return validateProject(project);
}

export function projectFilename(worksheet) {
  const name = worksheet?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  return "forecasting-coach-" + name.slice(0, 60) + ".json";
}
