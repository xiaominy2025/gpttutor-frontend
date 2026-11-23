import { average, coordinate, linearFit } from "./engine.js";

export function evidenceCategory(p) {
  if (!Number.isFinite(p) || p < 0 || p > 1) return null;
  if (p < 0.05) return "Very Strong";
  if (p < 0.15) return "Strong";
  if (p < 0.30) return "Modest";
  return "Weak";
}

export function businessPatterns(stats, runs) {
  const trendLevel = evidenceCategory(stats.p);
  const runsLevel = evidenceCategory(runs.p);
  const direction = stats.slope > 0 ? "increasing" : stats.slope < 0 ? "decreasing" : "flat";
  const trendSupported = direction !== "flat" && trendLevel && trendLevel !== "Weak";
  let trend = "Give the fitted direction limited weight in major commitments. Look for business evidence that conditions have changed.";
  if (trendSupported) {
    trend = direction === "increasing"
      ? "If the historical increase continues and raises resource needs, assess whether current capacity could accommodate it."
      : "If the historical decrease continues and changes resource needs, review commitments and investigate whether the conditions are likely to last.";
  }
  const pattern = !runsLevel || runsLevel === "Weak" ? "unclear" : runs.z < 0 ? "persistence" : "reversals";
  const fluctuation = pattern === "persistence"
    ? "Values tended to stay on the same side of their average. Consider whether plans can adapt to sustained changes, and investigate what may be driving them."
    : pattern === "reversals"
      ? "Values switched sides of their average more often than expected. Flexible plans can help avoid overreacting to individual changes."
      : runsLevel
        ? "The history gives little indication that deviations persist or reverse frequently. Avoid drawing strong conclusions from isolated observations."
        : "There are too few observations on one or both sides of the average to assess persistence or reversals reliably.";
  const takeaway = {
    increasing: {
      persistence: "If growth continues in stretches, consider how long existing resources could absorb additional pressure before commitments need review.",
      reversals: "Prepare for possible growth while keeping staffing, scheduling, or capacity flexible enough to handle reversals.",
      unclear: "Plan around possible growth if current conditions support it, and monitor whether actual values move far enough to change resource needs."
    },
    decreasing: {
      persistence: "Investigate whether lower values persist and why before changing long-term commitments.",
      reversals: "Review exposure to a possible decline while keeping plans flexible enough for short-term rebounds.",
      unclear: "Consider how a sustained decline would affect commitments, and review new observations before treating the projected direction as durable."
    },
    uncertain: {
      persistence: "The level may stay above or below its average for stretches even with limited evidence of a trend. Check the drivers and prepare for sustained deviations.",
      reversals: "With frequent reversals and limited evidence of a trend, keep near-term plans adjustable and review more than one observation before reacting.",
      unclear: "Base major commitments on additional business evidence and updated observations. The historical patterns offer limited guidance on their own."
    }
  }[trendSupported ? direction : "uncertain"][pattern];
  return { trendLevel, runsLevel, direction, trend, fluctuation, takeaway };
}

export function runsAssessment(p) {
  if (p === null) return "Insufficient observations for a reliable runs-test interpretation.";
  if (p < 0.05) return "Historical observations show statistically significant evidence of unusual ordering. Investigate whether this reflects a trend, seasonality, or another underlying process.";
  return "The runs test does not find sufficient evidence of unusual ordering. This does not establish that the data are random or that a historical trend is absent.";
}

// With t = sqrt(df) * tan(angle), the Student t density becomes proportional
// to cos(angle)^(df - 1). Integrate the bounded tail and normalize it.
function twoSidedStudentT(t, df) {
  if (t === 0) return 1;
  const end = Math.PI / 2;
  const integrate = start => {
    const intervals = 512;
    const width = (end - start) / intervals;
    const density = angle => Math.cos(angle) ** (df - 1);
    let sum = density(start) + density(end);
    for (let i = 1; i < intervals; i++) sum += (i % 2 ? 4 : 2) * density(start + i * width);
    return sum * width / 3;
  };
  return integrate(Math.atan(Math.abs(t) / Math.sqrt(df))) / integrate(0);
}

export function regressionEvidence(points) {
  const fit = linearFit(points);
  const values = points.map(point => point.value);
  const mean = average(values);
  const total = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residual = points.reduce((sum, point) => sum + (point.value - fit.predict(point.time)) ** 2, 0);
  const df = points.length - 2;
  const x = points.map(point => coordinate(point.time));
  const xMean = average(x);
  const spread = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const rSquared = total > 0 ? Math.max(0, 1 - residual / total) : null;
  // A constant response or an exact fit cannot estimate nonzero residual noise.
  const standardError = df > 0 && spread > 0 && residual > total * Number.EPSILON
    ? Math.sqrt(residual / df / spread) : null;
  const t = standardError === null ? null : fit.slope / standardError;
  return {
    slope: fit.slope,
    startValue: fit.predict(points[0].time),
    endValue: fit.predict(points.at(-1).time),
    change: fit.slope * (x.at(-1) - x[0]),
    rSquared, df, standardError, t,
    p: t === null ? null : twoSidedStudentT(t, df)
  };
}
