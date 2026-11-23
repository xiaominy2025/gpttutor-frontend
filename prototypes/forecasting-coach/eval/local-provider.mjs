import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { boundAdvisorInputTokens, openAIAdvisorProvider } from "../alpha-advisor-provider.mjs";

export async function openEvaluationBudget(directory, { maxCalls, maxMicros, key, transport }) {
  if (!Number.isSafeInteger(maxCalls) || maxCalls < 1 || maxCalls > 100 ||
      !Number.isSafeInteger(maxMicros) || maxMicros < 1 || maxMicros > 1_000_000 || !key) throw Error("Invalid local evaluation limits or missing OPENAI_API_KEY.");
  await mkdir(directory, { recursive: true });
  const path = join(directory, "budget.json");
  const lockPath = join(directory, "budget.lock");
  const lock = await open(lockPath, "wx");
  const close = async () => { await lock.close(); await unlink(lockPath); };
  let state;
  try {
    state = JSON.parse(await readFile(path, "utf8").catch(error => {
      if (error.code !== "ENOENT") throw error;
      return '{"calls":0,"spentMicros":0,"reservedMicros":0,"inputTokens":0,"outputTokens":0}';
    }));
    state.carriedMicros ??= 0;
    if (["calls", "spentMicros", "reservedMicros", "inputTokens", "outputTokens"].some(name =>
      !Number.isSafeInteger(state[name]) || state[name] < 0) ||
      !Number.isSafeInteger(state.carriedMicros) || state.carriedMicros < 0) throw Error("Invalid local evaluation ledger.");
  } catch (error) {
    await close();
    throw error;
  }
  const save = async () => {
    const temp = path + ".next";
    await writeFile(temp, JSON.stringify(state, null, 2));
    await rename(temp, path);
  };
  const provider = openAIAdvisorProvider({
    model: "gpt-6-luna", inputRate: 125_000, outputRate: 500_000, readCredential: async () => key,
    boundInputTokens: boundAdvisorInputTokens,
    async fetcher(url, options) {
      const response = await (transport ?? fetch)(url, options);
      if (!response.ok) {
        const packet = await response.json().catch(() => null);
        const code = packet?.error?.code;
        const safeCode = ["invalid_api_key", "model_not_found", "context_length_exceeded", "invalid_value",
          "unsupported_value", "content_policy_violation", "insufficient_quota", "rate_limit_exceeded"].includes(code) ? " " + code : "";
        throw Error("Provider rejected the request (HTTP " + response.status + safeCode + "). Reservation retained.");
      }
      return response;
    }
  });
  return {
    close,
    snapshot: () => ({ ...state }),
    async carryReservation() {
      if (!state.reservedMicros) throw Error("No outstanding reservation to carry.");
      state.carriedMicros += state.reservedMicros;
      state.reservedMicros = 0;
      await save();
    },
    async complete(messages, maxOutput) {
      const plan = await provider.plan(messages, maxOutput);
      const inputCap = maxOutput === 512 ? 2048 : 4096;
      if (![512, 640].includes(maxOutput) || plan.inputBound > inputCap) throw Error("Evaluation input crosses the token guard.");
      if (state.reservedMicros !== 0) throw Error("Reconcile the outstanding local provider reservation before continuing.");
      if (state.calls >= maxCalls || state.spentMicros + state.carriedMicros + plan.reservation > maxMicros) {
        throw Error("Local evaluation budget reached.");
      }
      state.calls++;
      state.reservedMicros += plan.reservation;
      await save();
      const send = await provider.prepare(plan);
      const result = await send();
      state.inputTokens += result.inputTokens;
      state.outputTokens += result.outputTokens;
      state.spentMicros += result.cost;
      state.reservedMicros -= plan.reservation;
      await save();
      if (result.cost > plan.reservation || result.inputTokens > inputCap || result.outputTokens > maxOutput || !result.draft) {
        throw Error("Provider response violated the local evaluation guard.");
      }
      return result.draft;
    }
  };
}
