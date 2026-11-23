export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function compareValues(from, to) {
  const difference = to - from;
  const floor = 1e-9 * Math.max(1, Math.abs(to));
  const percentage = from > floor && to >= 0 ? difference / from * 100 : null;
  return { from, to, difference, percentage };
}

export function regressionChange(points, future, predictions, fittedEnd) {
  const crossesBoundary = predictions.length === 1;
  const from = crossesBoundary ? fittedEnd : predictions[0];
  return {
    ...compareValues(from, predictions.at(-1)),
    start: crossesBoundary ? points.at(-1).time : future[0],
    end: future.at(-1),
    crossesBoundary
  };
}

export function describeSeason(factors) {
  const entries = factors.map(({ factor, count }, i) => ({ period: months[i], factor, count }));
  const ranked = [...entries].sort((a, b) => b.factor - a.factor);
  const highest = ranked[0].factor;
  const lowest = ranked.at(-1).factor;
  const tolerance = 1e-9;
  const peaks = entries.filter(item => Math.abs(item.factor - highest) < tolerance);
  const lows = entries.filter(item => Math.abs(item.factor - lowest) < tolerance);
  const notable = entries.filter(item => !peaks.includes(item) && !lows.includes(item) && Math.abs(item.factor - 1) >= 0.05);
  return { entries, peaks, lows, notable, uniform: highest - lowest < tolerance, limited: entries.some(item => item.count < 2) };
}
