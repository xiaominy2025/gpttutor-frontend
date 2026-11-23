import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { forecastingCases, dimensions } from "./forecasting-cases.mjs";
import { compareResults, evaluateCases } from "./harness.mjs";
import { openEvaluationBudget } from "./local-provider.mjs";

const dir = fileURLToPath(new URL("../dist/coach-ai-eval/", import.meta.url));
const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
const rubric = "Strategy: scale and persistence against stated goals. Operations: practical actions grounded in patterns. " +
  "Tradeoffs: explain costs, constraints and conditions favoring alternatives. Judgment: proportional response to fluctuations. " +
  "Monitoring: business indicators paired with actionable triggers. Grounding: no unsupported facts or numbers. " +
  "Usefulness: concrete decisions a manager can act on.";
const [mode = "plan", label, candidateFile] = process.argv.slice(2);
const hash = value => createHash("sha256").update(value).digest("hex");
const path = name => dir + name + ".json";
const read = async name => JSON.parse(await readFile(path(name), "utf8"));
const write = (name, data) => writeFile(path(name), JSON.stringify(data, null, 2), { flag: "wx" });
const score = rows => rows.reduce((sum, row) => sum + Object.values(row.reviews[0].scores).reduce((a,b) => a+b,0), 0) / (rows.length * dimensions.length);
const baselineCases = forecastingCases("dev");
const pin = hash(JSON.stringify({ baselineCases, dimensions, rubric }));
const candidateInput = file => readFileSync(file, "utf8").trim();
const openBudget = () => {
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  return openEvaluationBudget(dir, {
    key: process.env.OPENAI_API_KEY,
    maxCalls: Number(process.env.COACH_EVAL_MAX_CALLS ?? 64),
    maxMicros: Number(process.env.COACH_EVAL_MAX_MICROS ?? 50_000)
  });
};

async function run() {
  if (mode === "plan") {
    console.log(JSON.stringify({ development: baselineCases.length, holdout: forecastingCases("holdout").length, maxCandidates: 3,
      defaultCalls: 64, defaultMaxMicros: 50_000, noNetwork: true }, null, 2));
    return;
  }
  if (mode === "smoke" || mode === "carry-reservation") {
    const filename = mode === "smoke" ? "smoke" : "carried-previous-rejection";
    if (existsSync(path(filename))) throw Error("Evaluation output already exists.");
    const budget = await openBudget();
    try {
      const before = budget.snapshot();
      if (mode === "smoke") {
        const item = baselineCases.find(entry => entry.id === "staffing");
        const draft = await budget.complete(item.messages, 512);
        await write(filename, { id: item.id, draft, before, after: budget.snapshot() });
      } else {
        await budget.carryReservation();
        await write(filename, { reason: "Prior HTTP rejection with incomplete billing evidence; its full reservation stays against the budget.",
          before, after: budget.snapshot() });
      }
      console.log(JSON.stringify({ mode, ledger: budget.snapshot() }));
    } finally {
      await budget.close();
    }
    return;
  }
  if (mode === "freeze") {
    if (label !== "baseline" && !/^[1-3]$/.test(label ?? "")) throw Error("Use freeze baseline or freeze 1–3.");
    const winner = label === "baseline" ? null : await read("candidate-" + Number(label));
    if (winner && (winner.pin !== pin || !winner.comparison.qualifies)) throw Error("Candidate did not clear development gates.");
    const currentBaseline = await read("baseline");
    if (currentBaseline.pin !== pin) throw Error("Baseline fingerprint changed.");
    await write("frozen", { pin, label, prompt: winner?.prompt ?? null });
    return;
  }
  if (!["baseline", "compare", "holdout"].includes(mode)) throw Error("Use plan, baseline, compare, freeze or holdout.");
  if (mode === "compare" && (!/^[1-3]$/.test(label ?? "") || !candidateFile || existsSync(path("frozen")))) {
    throw Error("Use compare 1–3 <candidate-file> before freezing.");
  }
  const output = mode === "compare" ? "candidate-" + label : mode;
  const partial = dir + output + ".jsonl";
  if (existsSync(path(output)) || existsSync(partial)) throw Error("Evaluation already started; reconcile the output before a fresh run.");
  const baseline = mode === "compare" ? await read("baseline") : null;
  const frozen = mode === "holdout" ? await read("frozen") : null;
  if ((baseline && baseline.pin !== pin) || (frozen && frozen.pin !== pin)) throw Error("Baseline fingerprint changed.");
  const candidate = mode === "compare" ? candidateInput(candidateFile) : frozen?.prompt;
  if (mode === "compare" && (!candidate || candidate === baselineCases[0].messages[0].content)) throw Error("Candidate prompt must be distinct.");
  const cases = mode === "holdout" ? forecastingCases("holdout") : baselineCases;
  const budget = await openBudget();
  try {
    const before = budget.snapshot();
    const rows = await evaluateCases({ cases, dimensions, rubric, complete: budget.complete, candidate, baseline: baseline?.rows,
      onResult: row => appendFile(partial, JSON.stringify(row) + "\n") });
    const report = { pin, mode, ...(mode === "compare" && { prompt: candidate }), rows,
      ...(candidate ? { comparison: compareResults(rows, dimensions) } : {
        mean: score(rows), critical: rows.some(row => row.reviews[0].critical || row.checks[0].technical)
      }), before, after: budget.snapshot() };
    if (mode === "holdout") {
      report.recommendation = candidate
        ? report.comparison.qualifies ? "Candidate " + frozen.label + " for human grounding review and owner approval" : "Retain baseline"
        : report.mean >= 4 && !report.critical ? "Retain baseline, subject to human grounding review" : "Baseline needs further evaluation";
    }
    await write(output, report);
    console.log(JSON.stringify({ mode, cases: rows.length, mean: report.mean, comparison: report.comparison,
      recommendation: report.recommendation, ledger: report.after }, null, 2));
  } finally {
    await budget.close();
  }
}

run().catch(error => {
  // Network and provider error details may include environment-dependent data.
  console.error("Evaluation stopped:", error.name === "Error" ? error.message : error.name);
  process.exitCode = 1;
});
