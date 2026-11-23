import { forecast } from "../engine.js";
import { advisorModelInput, buildAdvisorRequest } from "../management-advisor.js";

const cycle = [-7, -4, 0, 3, 6, 2, -24, -5, 29, 10, 0, -10];
const seasonal = growth => i => 110 + i * growth + cycle[i % 12];
const trend = slope => i => 140 + i * slope + (i % 3);
const fixtures = [
  ["growth-seasonal", "dev", "seasonal", seasonal(0.6), "Sales", "Sales are gradually growing, with a weaker July and stronger September. Should we raise stock targets or time supplier orders differently?", "Distinguish gradual growth from seasonal peaks. Compare staged purchases with advance orders and monitor overstocks and stockouts.", "A peak does not justify higher stock all year."],
  ["small-trend", "dev", "trend", i => 100 + i * .015 + (i % 2 ? 25 : -25), "Orders", "Orders swing around 75–125 monthly. We value reliable service without excess permanent capacity. Should these swings change our capacity strategy?", "Treat small drift as a monitoring signal. Compare flexible coverage against its cost and use sustained service pressure to revisit capacity.", "Do not call the small fitted increase sustained growth."],
  ["growth", "dev", "trend", trend(3.8), "Orders", "We aim to expand while protecting delivery reliability. Should we invest in permanent capacity now or stage expansion?", "Link persistent growth to strategy and compare staged versus committed capacity; track demand and delivery constraints.", "Do not assume a backlog or known capacity deficit."],
  ["decline", "dev", "trend", trend(-2.8), "Orders", "Demand has declined for several quarters. We aim to keep profitable accounts. Which costs should we adjust, and when should we rethink strategy?", "Compare reversible operating changes and a strategic review tied to account economics or retention.", "Do not equate order volume with profitability."],
  ["seasonal-peak", "dev", "seasonal", seasonal(0.4), "Unit sales", "Prepare purchasing and staffing for the September upswing. Extra coverage has a cost. What should we commit before the peak?", "Coordinate stock and staffing against timing and service risk. Identify indicators that justify early versus staged commitments.", "No invented supplier deadlines, overtime prices or buy quantities."],
  ["supplier", "dev", "seasonal", seasonal(0.1), "Demand", "Supplier lead times vary from two to six weeks. Smaller orders carry more setup cost. How should we balance stockouts and excess inventory?", "Explain when early commitment beats frequent replenishment, using the stated lead-time and setup-cost trade-off.", "Do not assume flexibility is free or invent minimum quantities."],
  ["staffing", "dev", "moving", i => 100 + i * 0.3 + (i % 3), "Monthly orders", "How should we staff the next month without raising costs unnecessarily?", "Compare flexible shifts, overtime and baseline staffing. Use workload and service signals to revisit scheduling.", "Do not infer seasonality or permanent staffing need from one forecast period."],
  ["production", "dev", "trend", trend(2.9), "Orders", "Our strategy is reliable delivery. If demand rises, should we add shifts or expand the line? Equipment purchases are hard to reverse.", "Compare shifts, bottleneck removal and staged investment. Use backlog, utilization and lead-time triggers.", "Do not assume utilization or backlog is already high."],
  ["seasonal-slowdown", "holdout", "seasonal", seasonal(0), "Sales", "A weak summer has made the team reluctant to order for autumn. What should we prepare now?", "Separate the predictable slowdown from a lasting decline and compare the costs of buying now versus waiting.", "Do not treat weak summer sales as structural or invent a recovery threshold."],
  ["budget", "holdout", "trend", trend(1.8), "Operating expense", "Expenses are rising, but we prioritize long-term product investment. What commitments should be revisited?", "Protect strategic priorities while investigating recurring expense drivers and staged adjustments.", "Do not assume named costs, savings, or available discretionary budget."],
  ["volatile", "holdout", "trend", i => 118 + Math.sin(i * Math.PI / 2) * 25, "Demand", "Our goal is steady service, but orders swing sharply. Should we alter our operating plan or strategic direction?", "Use short-term coverage and business indicators without calling stable demand a sustained change.", "Do not infer seasonality or recommend permanent capacity on volatility alone."],
  ["ambiguous", "holdout", "moving", i => 126 + (i % 4), "Monthly Left", "What should we prepare for next month?", "Offer useful conditional actions that depend on what the measure represents.", "Do not equate leftover inventory with demand or fabricate a business objective."]
];

export const dimensions = ["strategy", "operations", "tradeoffs", "judgment", "monitoring", "grounding", "usefulness"];

export function forecastingCases(split) {
  return fixtures.filter(([, group]) => group === split).map(([id, group, method, value, name, objective, expected, avoid]) => {
    const points = Array.from({ length: 36 }, (_, i) => ({ time: new Date(Date.UTC(2023, i, 1)), value: value(i) }));
    const horizon = method === "moving" ? 1 : method === "seasonal" ? 12 : 6;
    const analysis = forecast(points, "monthly", horizon, 3, method === "seasonal", { student: true, method, windowEvaluationSize: 33 });
    const request = buildAdvisorRequest({ analysis, method, cadence: "monthly", points,
      headings: { target: name }, unit: name === "Monthly Left" ? "" : name.toLowerCase().includes("orders") ? "orders" : "units" }, objective, 8);
    return { id, split: group, method, expected, avoid, messages: advisorModelInput(request) };
  });
}
