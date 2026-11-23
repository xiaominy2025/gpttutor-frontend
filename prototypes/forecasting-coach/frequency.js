import { average, nextTime } from "./engine.js";

const day = 86400000;
const month = date => date.getUTCFullYear() * 12 + date.getUTCMonth();
const dateAt = (date, offset = 0) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
export const frequencies = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annual: "Annual", periods: "Consecutive numeric periods" };
export const conversions = {
  daily: ["daily", "weekly", "monthly", "quarterly", "annual"],
  weekly: ["weekly"], monthly: ["monthly", "quarterly", "annual"],
  quarterly: ["quarterly", "annual"], annual: ["annual"], periods: ["periods"]
};

export function detectFrequency(points) {
  if (points.length < 3) throw Error("At least three observations are required to detect Data Frequency.");
  const times = points.map(point => point.time);
  if (times.every(Number.isSafeInteger) && consecutive(times, (a, b) => b - a === 1)) return "periods";
  if (!times.every(time => time instanceof Date)) throw Error("Use dates or consecutive numeric periods throughout the time column.");
  if (consecutive(times, (a,b) => b - a === day)) return "daily";
  if (consecutive(times, (a,b) => b - a === 7 * day)) return "weekly";
  const aligned = times.every(t => t.getUTCDate() === times[0].getUTCDate()) ||
    times.every(t => new Date(+t + day).getUTCDate() === 1);
  if (aligned) {
    for (const [frequency, interval] of [["monthly", 1], ["quarterly", 3], ["annual", 12]]) {
      if (consecutive(times, (a,b) => month(b) - month(a) === interval)) return frequency;
    }
  }
  throw Error("Data Frequency is irregular or ambiguous. Check for duplicate observations, gaps, or inconsistent date labels.");
}

function consecutive(times, matches) {
  return times.slice(1).every((time, index) => matches(times[index], time));
}

function periodStart(date, frequency) {
  if (frequency === "weekly") return new Date(+date - ((date.getUTCDay() + 6) % 7) * day);
  const monthIndex = date.getUTCMonth();
  const offset = frequency === "quarterly" ? -(monthIndex % 3) : frequency === "annual" ? -monthIndex : 0;
  return dateAt(date, offset);
}

export function convertFrequency(points, source, target, aggregation) {
  if (!conversions[source].includes(target)) throw Error("That Forecast Frequency is incompatible with the data. Weekly totals cannot be split across calendar months.");
  if (source === target) {
    const normalized = ["monthly", "quarterly", "annual"].includes(source)
      ? points.map(point => ({ ...point, time: dateAt(point.time) })) : points;
    return { points: normalized, omitted: [] };
  }
  if (!["sum", "average", "last"].includes(aggregation)) throw Error("Confirm an aggregation method before forecasting.");
  const groups = new Map();
  for (const point of points) {
    const key = +periodStart(point.time, target);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(point.value);
  }
  const converted = [], omitted = [];
  for (const [key, values] of groups) {
    const time = new Date(key);
    const end = nextTime(time, target, 1);
    const expected = source === "daily" ? (end - time) / day : (month(end) - month(time)) / (source === "quarterly" ? 3 : 1);
    if (values.length !== expected) {
      omitted.push(time);
      continue;
    }
    const value = aggregation === "last" ? values.at(-1) : aggregation === "average" ? average(values) : values.reduce((sum, v) => sum + v, 0);
    converted.push({ time, value });
  }
  return { points: converted, omitted };
}

