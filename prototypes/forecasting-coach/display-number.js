const numberFormats = [0, 1, 2, 3].map(maximumFractionDigits => new Intl.NumberFormat("en-US", { maximumFractionDigits }));
const scientific = new Intl.NumberFormat("en-US", { notation: "scientific", maximumSignificantDigits: 3 });

export function formatDisplayedValue(value) {
  const magnitude = Math.abs(value);
  if (magnitude === 0) return "0";
  if (magnitude < 0.001) return scientific.format(value);
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : magnitude >= 1 ? 2 : 3;
  return numberFormats[digits].format(value);
}

export function formatBusinessPercent(value) {
  return (Math.abs(value) >= 1 ? numberFormats[0].format(value) : formatDisplayedValue(value)) + "%";
}
