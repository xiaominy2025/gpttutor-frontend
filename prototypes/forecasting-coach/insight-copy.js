import { formatBusinessPercent, formatDisplayedValue } from "./display-number.js";

const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const periods = { daily: "day", weekly: "week", monthly: "month", quarterly: "quarter", annual: "year", periods: "period" };

export function forecastPeriodLabel(time, cadence) {
  if (!(time instanceof Date)) return "period " + time;
  return cadence === "monthly" ? monthLabel.format(time) : time.toISOString().slice(0, 10);
}

export function measuredValue(value, unit) {
  return formatDisplayedValue(value) + (unit ? " " + unit : "");
}

function nearlyUnchanged(change) {
  // A tiny relative move is negligible here only when both values also display identically.
  const scale = Math.max(Math.abs(change.from), Math.abs(change.to));
  return change.difference === 0 || (Math.abs(change.difference) < scale * 0.0001 &&
    formatDisplayedValue(change.from) === formatDisplayedValue(change.to));
}

function endpoints(change, start, end, unit, fitted = false) {
  const reference = fitted ? "the fitted historical level of " : "";
  return "from " + reference + measuredValue(change.from, unit) + " in " + start +
    " to " + measuredValue(change.to, unit) + " in " + end;
}

export function regressionInsight(change, cadence, subject, unit) {
  const start = forecastPeriodLabel(change.start, cadence);
  const end = forecastPeriodLabel(change.end, cadence);
  const values = endpoints(change, start, end, unit, change.crossesBoundary);
  if (nearlyUnchanged(change)) return subject + " is projected to be approximately unchanged, " + values + ".";
  const rising = change.difference > 0;
  const direction = rising ? "growth" : "decline";
  const amount = change.percentage === null ? "" : "approximately " + formatBusinessPercent(Math.abs(change.percentage)) + " ";
  return "The forecast suggests " + amount + direction + " in " + subject + " " + values + ".";
}

export function movingInsight(change, start, end, cadence, subject, unit) {
  const date = forecastPeriodLabel(start, cadence);
  const next = forecastPeriodLabel(end, cadence);
  let comparison = "approximately unchanged from";
  if (!nearlyUnchanged(change)) {
    const amount = change.percentage === null ? "" : "approximately " + formatBusinessPercent(Math.abs(change.percentage)) + " ";
    comparison = amount + (change.difference > 0 ? "higher than" : "lower than");
  }
  return "The next-" + periods[cadence] + " forecast for " + subject + " is " + comparison +
    " the latest actual: " + measuredValue(change.to, unit) + " in " + next + " versus " + measuredValue(change.from, unit) + " in " + date + ".";
}

export function seasonalForecastRange(values, future) {
  let low = 0, high = 0;
  for (const [i, value] of values.entries()) {
    if (value < values[low]) low = i;
    if (value > values[high]) high = i;
  }
  return { min: values[low], max: values[high], lowDate: future[low], highDate: future[high], difference: values[high] - values[low] };
}

export function seasonalRangeInsight(values, future, cadence, subject, unit) {
  const range = seasonalForecastRange(values, future);
  const first = forecastPeriodLabel(future[0], cadence);
  const last = forecastPeriodLabel(future.at(-1), cadence);
  if (values.length === 1) return subject + " is forecast at " + measuredValue(range.min, unit) + " in " + first + ".";
  if (range.difference === 0 || formatDisplayedValue(range.min) === formatDisplayedValue(range.max)) {
    return subject + " is forecast to stay at around " + measuredValue(range.min, unit) + " from " + first + " to " + last + ".";
  }
  return "The forecast for " + subject + " ranges from " + measuredValue(range.min, unit) + " in " +
    forecastPeriodLabel(range.lowDate, cadence) + " to " + measuredValue(range.max, unit) + " in " +
    forecastPeriodLabel(range.highDate, cadence) + " across the selected horizon. The spread is about " +
    measuredValue(range.difference, unit) + ".";
}

export function reliabilityInsight(leadScores, unit) {
  if (!leadScores.some(Boolean)) return "There are too few comparable past forecasts to estimate historical error.";
  const first = leadScores[0];
  const historical = first ? "Past one-period forecasts were off by about " + measuredValue(first.mae, unit) + " on average. " : "";
  const filter = leadScores.some(score => !score) ? "Low and High are shown only where enough comparable history is available. " : "";
  return (historical + "Low and High illustrate planning alternatives based on historical forecast errors. They are not guaranteed ranges. " + filter).trimEnd();
}

export function seasonalReliabilityInsight(leadScores, backtest, unit) {
  const first = leadScores[0];
  if (!first) {
    const available = backtest.comparisons[0];
    const count = available === 1 ? "1 comparable one-month forecast" : available + " comparable one-month forecasts";
    return "The first seasonal model used " + backtest.trainingMonths + " months of history. The available history provides " +
      count + " after that. Reporting a historical error requires at least " + backtest.minimumComparisons + ".";
  }
  const historical = "Historical one-month forecasts differed from actuals by an average of " +
    measuredValue(first.mae, unit) + " across " + first.count + " comparisons.";
  if (!leadScores.slice(1).some(Boolean) && leadScores.length > 1) return historical + " Longer-horizon accuracy has not been established.";
  if (leadScores.some(score => !score)) return historical + " Statistical Details shows which longer horizons had enough comparisons.";
  return historical;
}
