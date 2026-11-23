import { forecast } from "../engine.js";
import { advisorModelInput, buildAdvisorRequest } from "../management-advisor.js";

const cycle = [0, 2, 5, 5, 4, 1, -17, -3, 22, 12, 3, -4];
const definitions = [
  ["capacity", "dev", "trend", 3, "Should we expand permanent production capacity?",
    ["Available capacity meets the order book and delivery is on target.", "Use spare capacity and tie expansion to real pressure.", "Treating demand growth alone as shortage."],
    ["Capacity has been exhausted for months and delivery continues worsening despite extra shifts.", "Prepare permanent expansion while managing delivery during the transition.", "Delaying action without addressing lost sales and service."]],
  ["inventory", "dev", "seasonal", .2, "How should we time inventory purchases ahead of the stronger September season?",
    ["Suppliers deliver quickly and excess stock is expensive to hold.", "Favor staged replenishment and watch availability.", "Committing early just because the peak is predictable."],
    ["Suppliers have long lead times and missing peak sales is costly.", "Secure enough supply early while controlling excess exposure.", "Deferring until demand is confirmed and replenishment is too late."]],
  ["staffing", "dev", "moving", .7, "Should we adjust core staffing or keep using flexible coverage?",
    ["Flexible shifts are affordable and service levels are stable.", "Use affordable flex coverage with a service trigger for reconsideration.", "Assuming rising demand requires permanent hiring."],
    ["Overtime is costly and recurring, and service is deteriorating despite flexible shifts.", "Compare stable staffing with continuing premiums and service damage.", "Continuing ineffective overtime without evaluating a core staffing change."]],
  ["investment", "dev", "trend", 1.2, "Should we commit to a new production line to support reliable delivery?",
    ["Utilization is uncertain and only modest growth is expected.", "Protect the option to invest while testing utilization and load.", "Treating projected growth by itself as proof of a capacity gap."],
    ["Growth has persisted for several quarters, line utilization is consistently high, and bottlenecks remain after process improvements.", "Prepare or make a defensible phased commitment, with a delivery bridge.", "Indefinite delay despite demonstrated limits."]],
  ["decline", "holdout", "trend", -1.2, "Should we change operating scale or revisit our strategy?",
    ["The slowdown followed a temporary disruption, and account margins remain healthy.", "Adapt operations and protect profitable business while tracking recovery.", "A permanent strategic retreat based on a temporary event."],
    ["Demand has weakened for several quarters and margins are deteriorating despite cost adjustments.", "Assess operating scale and strategic repositioning while protecting viable accounts.", "Repeated temporary cuts without strategic reassessment."]],
  ["budget", "holdout", "trend", 1.8, "Should we maintain or reduce recurring operating expense?",
    ["Recent increases have not improved service or supported our product priorities.", "Challenge unproductive spending and redirect it toward priorities.", "Assuming rising spend is productive."],
    ["The increases support essential product investment that is meeting its milestones.", "Protect productive investment while checking whether benefits continue.", "Across-the-board cuts that undermine future capability."]]
];

export function round2Cases(split) {
  return definitions.filter(([, group]) => group === split)
    .flatMap(([pair, group, method, slope, question, ...variants]) => variants.map(([facts, expected, avoid], index) => {
      const points = Array.from({ length: 36 }, (_, i) => ({
        time: new Date(Date.UTC(2023, i, 1)), value: 125 + i * slope + (method === "seasonal" ? cycle[i % 12] : i % 3)
      }));
      const horizon = method === "moving" ? 1 : method === "seasonal" ? 12 : 6;
      const analysis = forecast(points, "monthly", horizon, 3, method === "seasonal",
        { student: true, method, windowEvaluationSize: 33 });
      const objective = question + " " + facts;
      if (objective.length > 250) throw Error("Contrast objective exceeds the application limit.");
      const request = buildAdvisorRequest({ points, analysis, method, cadence: "monthly",
        headings: { target: pair === "budget" ? "Monthly operating expense" : "Monthly orders" }, unit: "" }, objective, 8);
      return { id: pair + "-" + (index ? "b" : "a"), pair, split: group, expected, avoid,
        messages: advisorModelInput(request) };
    }));
}
