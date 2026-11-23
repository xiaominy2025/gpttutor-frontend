const day = 86400000;
export const methods = { moving: "Moving average", trend: "Linear regression", seasonal: "Seasonal forecast" };
const seasonalTrainingMonths = 24;
const minimumHistoricalComparisons = 3;
export const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function normalTail(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const polynomial = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * polynomial;
}

export function runsTest(values) {
  const mean = average(values);
  const signs = values.map(value => value >= mean);
  const above = signs.filter(Boolean).length;
  const below = values.length - above;
  const ties = values.filter(value => value === mean).length;
  const runs = signs.reduce((count, sign, index) => count + Number(!index || sign !== signs[index - 1]), 0);
  const expected = 1 + 2 * above * below / values.length;
  const deviation = Math.sqrt((expected - 1) * (expected - 2) / (values.length - 1));
  const z = deviation > 0 ? (runs - expected) / deviation : null;
  const tail = z === null ? null : z === 0 ? 0.5 : normalTail(z);
  const cumulative = tail === null ? null : z < 0 ? tail : 1 - tail;
  const p = above > 10 && below > 10 && tail !== null ? 2 * tail : null;
  return { mean, above, below, ties, runs, expected, z, cumulative, p };
}

export function movingAverage(values, window, horizon) {
  const buffer = values.slice(-window);
  return Array.from({ length: horizon }, () => {
    const value = average(buffer);
    buffer.shift();
    buffer.push(value);
    return value;
  });
}

export function coordinate(time) {
  return time instanceof Date ? time.getTime() / day : time;
}

export function linearFit(points) {
  const x = points.map(({ time }) => coordinate(time));
  const xMean = average(x);
  const yMean = average(points.map(({ value }) => value));
  const slope = points.reduce((sum, { value }, i) => sum + (x[i] - xMean) * (value - yMean), 0) /
    x.reduce((sum, time) => sum + (time - xMean) ** 2, 0);
  return { slope, predict: time => yMean + slope * (coordinate(time) - xMean) };
}

export function seasonalFactors(points) {
  const ratios = Array.from({ length: 12 }, () => []);
  for (let i = 6; i < points.length - 6; i++) {
    const left = average(points.slice(i - 6, i + 6).map(point => point.value));
    const right = average(points.slice(i - 5, i + 7).map(point => point.value));
    ratios[points[i].time.getUTCMonth()].push(points[i].value / ((left + right) / 2));
  }
  return ratios.map(values => ({ factor: average(values), count: values.length }));
}

export function nextTime(time, cadence, steps) {
  if (typeof time === "number") return time + steps;
  const months = { monthly: 1, quarterly: 3, annual: 12 }[cadence];
  if (months) return new Date(Date.UTC(time.getUTCFullYear(), time.getUTCMonth() + steps * months, 1));
  return new Date(time.getTime() + day * steps * (cadence === "weekly" ? 7 : 1));
}

export function forecast(points, cadence, horizon, window, allowSeasonal, { student = false, method, windowEvaluationSize } = {}) {
  const last = points.at(-1).time;
  const future = Array.from({ length: horizon }, (_, i) => nextTime(last, cadence, i + 1));
  const values = points.map(point => point.value);
  const fit = linearFit(points);
  const choices = ["trend", ...(points.length >= window && (!student || horizon === 1) ? ["moving"] : [])];
  if (allowSeasonal && cadence === "monthly" && points.length >= seasonalTrainingMonths && values.every(value => value > 0)) choices.push("seasonal");

  function predict(method, history, times) {
    if (method === "moving") {
      const values = history.map(point => point.value);
      return student ? [average(values.slice(-window))] : movingAverage(values, window, times.length);
    }
    const trend = linearFit(history);
    if (method === "trend") return times.map(trend.predict);
    const factors = seasonalFactors(history);
    return times.map(time => trend.predict(time) * factors[time.getUTCMonth()].factor);
  }

  if (method) {
    const minimum = method === "seasonal" ? seasonalTrainingMonths : method === "moving" ? points.length - windowEvaluationSize : 3;
    const originLimit = method === "moving" ? windowEvaluationSize : 48;
    const errorsByLead = future.map(() => []);
    const completeErrors = [];
    const firstOrigin = Math.max(minimum, points.length - horizon - originLimit + 1);
    for (let end = firstOrigin; end < points.length; end++) {
      const actual = points.slice(end, end + horizon);
      const estimates = predict(method, points.slice(0, end), actual.map(point => point.time));
      estimates.forEach((value, i) => {
        const error = value - actual[i].value;
        if (end >= points.length - i - originLimit) errorsByLead[i].push(error);
        if (actual.length === horizon) completeErrors.push(error);
      });
    }
    const summarize = errors => ({ mae: average(errors.map(Math.abs)), mse: average(errors.map(error => error ** 2)) });
    const scoredOrigins = completeErrors.length / horizon;
    return {
      future, scoredOrigins, runs: runsTest(values), slope: fit.slope,
      scores: scoredOrigins >= 3 ? { [method]: summarize(completeErrors) } : {},
      leadScores: errorsByLead.map(errors => errors.length >= minimumHistoricalComparisons
        ? { ...summarize(errors), count: errors.length } : null),
      ...(method === "seasonal" && { seasonalBacktest: {
        trainingMonths: seasonalTrainingMonths,
        minimumComparisons: minimumHistoricalComparisons,
        comparisons: errorsByLead.map(errors => errors.length),
        centeredObservations: points.length - 12
      } }),
      factors: method === "seasonal" ? seasonalFactors(points) : null,
      predictions: { [method]: predict(method, points, future) }
    };
  }

  const minimum = Math.max(3, choices.includes("moving") ? (student === "auto" ? 7 : window) : 0,
    choices.includes("seasonal") ? seasonalTrainingMonths : 0);
  const origins = Math.max(0, points.length - minimum - horizon + 1);
  const scoredOrigins = Math.min(48, origins);
  const scores = {};
  if (scoredOrigins >= 3) {
    for (const method of choices) {
      const errors = [];
      for (let end = points.length - horizon - scoredOrigins + 1; end <= points.length - horizon; end++) {
        const actual = points.slice(end, end + horizon);
        const history = points.slice(0, end);
        // Select automatic windows again using only the training history at each origin.
        let predictions;
        if (method === "moving" && student === "auto") {
          const training = history.map(point => point.value);
          predictions = [average(training.slice(-movingWindows(training).selected))];
        } else {
          predictions = predict(method, history, actual.map(point => point.time));
        }
        errors.push(...predictions.map((value, i) => value - actual[i].value));
      }
      scores[method] = { mae: average(errors.map(Math.abs)), mse: average(errors.map(error => error ** 2)) };
    }
  }
  const ranked = choices.filter(method => scores[method]).sort((a, b) => scores[a].mae - scores[b].mae);
  return {
    future, choices, scores, scoredOrigins, recommendation: ranked[0] ?? null,
    fallback: choices.includes("moving") ? "moving" : "trend",
    runs: runsTest(values), slope: fit.slope,
    factors: choices.includes("seasonal") ? seasonalFactors(points) : null,
    predictions: Object.fromEntries(choices.map(method => [method, predict(method, points, future)]))
  };
}

export function planningScenarios(predictions, leadScores) {
  return predictions.map((base, i) => {
    const mae = leadScores[i]?.mae;
    if (!Number.isFinite(base) || !Number.isFinite(mae) || mae < 0) return null;
    const low = base - mae;
    const high = base + mae;
    return Number.isFinite(low) && Number.isFinite(high) ? { low, base, high } : null;
  });
}

export function movingWindows(values, manualWindow) {
  const largest = Math.min(12, Math.floor(values.length / 2), values.length - 5);
  const eligible = Array.from({ length: Math.max(0, largest - 1) }, (_, i) => i + 2);
  const mse = eligible.length ? workbookMovingMse(values, eligible) : [];
  const candidates = eligible.map((window, i) => ({ window, mse: mse[i] }));
  const selected = manualWindow ?? candidates.reduce((best, option) =>
    !best || option.mse < best.mse ? option : best, null)?.window ?? Math.min(3, values.length);
  return { candidates, selected, evaluationSize: eligible.length ? values.length - largest : 0 };
}

export function workbookMovingMse(values, windows) {
  const start = Math.max(...windows);
  return windows.map(window => average(values.slice(start).map((actual, i) =>
    (actual - average(values.slice(start + i - window, start + i))) ** 2)));
}
