import { readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { round2Cases } from "./round2-cases.mjs";
import { forecastingCases, dimensions } from "./forecasting-cases.mjs";
import { evaluateCases, compareResults } from "./harness.mjs";
import { openEvaluationBudget } from "./local-provider.mjs";

const directory = fileURLToPath(new URL("../dist/coach-ai-round2/", import.meta.url));
const old = fileURLToPath(new URL("../dist/coach-ai-eval/", import.meta.url));
const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
const rubric = "Strategy: scale and persistence against stated goals. Operations: feasible responses to current constraints. " +
  "Tradeoffs: explain costs and risks of acting and waiting, and when each choice wins. Judgment: neither reflexive caution nor unsupported aggression. " +
  "Monitoring: business indicators paired with decision triggers. Grounding: no invented facts or numbers. " +
  "Usefulness: a distinct recommendation when material operating conditions differ. Never require numerical thresholds lacking evidence.";
const [phase = "plan", candidatePath, option] = process.argv.slice(2);
const read = async path => JSON.parse(await readFile(path, "utf8"));
const pin = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const dev = round2Cases("dev");
const fingerprint = pin({ dev, rubric, dimensions });
const mean = rows => rows.flatMap(row => Object.values(row.reviews[0].scores))
  .reduce((a,b) => a+b, 0) / (rows.length * dimensions.length);

async function run() {
  if (phase === "plan") {
    console.log(JSON.stringify({ development: dev.length, sealedHoldout: 4, archivedRegression: 12,
      maxCalls: 80, capMicros: 50000, noNetwork: true }));
    return;
  }
  if (!["baseline", "candidate", "regression", "holdout"].includes(phase)) throw Error("Unknown phase.");
  const output = directory + phase + ".json";
  const partial = directory + phase + ".jsonl";
  const recovery = option === "--carry-and-resume" && phase === "candidate";
  const recoveryPath = directory + phase + "-recovery.json";
  if (existsSync(output) || (existsSync(partial) && !recovery) ||
      (recovery && (!existsSync(partial) || existsSync(recoveryPath)))) throw Error("Phase already started. Do not replay paid work.");
  const devBaseline = phase === "candidate" ? await read(directory + "baseline.json") : null;
  if (devBaseline && devBaseline.fingerprint !== fingerprint) throw Error("Development fingerprint changed.");
  const frozen = ["regression", "holdout"].includes(phase) ? await read(directory + "candidate.json") : null;
  if (frozen && frozen.fingerprint !== fingerprint) throw Error("Candidate fingerprint changed.");
  if (phase === "holdout" && !existsSync(directory + "regression.json")) throw Error("Complete the original regression suite first.");
  const candidate = phase === "candidate" ? (await readFile(candidatePath, "utf8")).trim() : frozen?.candidate;
  if (phase !== "baseline" && (!candidate || candidate === dev[0].messages[0].content)) throw Error("Distinct candidate required.");
  const cases = phase === "regression" ? [...forecastingCases("dev"), ...forecastingCases("holdout")]
    : phase === "holdout" ? round2Cases("holdout") : dev;
  const completed = recovery ? (await readFile(partial, "utf8")).trim().split("\n").map(line => JSON.parse(line)) : [];
  if (completed.some((row, i) => row.id !== cases[i]?.id || row.drafts.length !== 2)) throw Error("Partial transcript does not match.");
  const baseline = phase === "regression" ? [...(await read(old + "baseline.json")).rows, ...(await read(old + "holdout.json")).rows]
    : devBaseline?.rows;
  if (phase === "regression" && cases.some(item => !baseline.some(row => row.id === item.id))) {
    throw Error("Archived version 9 regression data incomplete.");
  }
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const budget = await openEvaluationBudget(directory, { key: process.env.OPENAI_API_KEY, maxCalls: 80, maxMicros: 50_000 });
  try {
    const before = budget.snapshot();
    if (recovery) {
      if (!before.reservedMicros) throw Error("No unresolved call to reconcile.");
      await budget.carryReservation();
      await writeFile(recoveryPath, JSON.stringify({ fingerprint, candidate: pin(candidate), completed: completed.map(row => row.id),
        reason: "Reviewed provider rejection with unknown billing. Keep full reservation against the cap.", before, after: budget.snapshot() }),
      { flag: "wx" });
    }
    const rows = [...completed, ...await evaluateCases({ cases: cases.slice(completed.length), dimensions, rubric,
      complete: budget.complete, candidate, baseline,
      onDrafts: row => appendFile(directory + phase + "-drafts.jsonl", JSON.stringify(row) + "\n"),
      onResult: row => appendFile(partial, JSON.stringify(row) + "\n") })];
    const comparison = candidate ? compareResults(rows, dimensions) : null;
    const after = budget.snapshot();
    await writeFile(output, JSON.stringify({ phase, fingerprint, candidate, rows, comparison, before, after }, null, 2), { flag: "wx" });
    console.log(JSON.stringify({ phase, cases: rows.length, comparison, baselineMean: mean(rows), ledger: after }, null, 2));
  } finally {
    await budget.close();
  }
}

run().catch(error => { console.error("Round 2 stopped:", error.name === "Error" ? error.message : error.name); process.exitCode = 1; });
