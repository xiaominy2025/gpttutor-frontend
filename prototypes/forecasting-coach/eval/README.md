# Local Coach AI quality gate

Forecasting optimization is closed. See the [V1 acceptance and lessons learned record](../FINAL-ACCEPTANCE.md). Keep version 9 and retain these assets as the starting point for Scenario Analysis Coach's own local evaluation.

This runner is a server-side Node process. It loads the same Forecasting context and v9 prompt from the application, calls the Responses API directly, and has no browser, AWS or Alpha dependency. It never deploys a candidate. All suite inputs are synthetic so model inputs and quality reports can be reviewed without workbook disclosures. The separate forecasting regression suite validates the three original teaching workbooks.

## Forecasting quality

The engine calculates trends, seasonal patterns and forecast evidence. The Advisor helps a manager decide what to keep, change or prepare for and what should trigger review. The production context builder supplies structured forecasts and business evidence, with technical diagnostics excluded. Cases reward proportionate strategic decisions, practical operations, real trade-offs, human judgment, actionable monitoring, sound grounding, and decision usefulness. Judge scores are qualitative. Numeric flags can include valid rounding or date formatting and require inspection.

`forecasting-cases.mjs` holds eight development and four holdout cases. Each case supplies a validated production message envelope, a separate evaluation expectation, and failure modes. The generation call receives only the production envelope. The separate evaluator sees the rubric and the anonymous responses in randomized order for pairwise comparisons. Keep holdout expectations and results out of candidate drafting. Candidate drafting is a development step for Codex, guided by development reports only.

## Run from the prototype directory

```powershell
node eval/run.mjs plan
node eval/run.mjs smoke
node eval/run.mjs baseline
node eval/run.mjs compare 1 path-to-candidate.txt
node eval/run.mjs freeze 1
node eval/run.mjs holdout
```

Use a valid OpenAI key with access to GPT-6 Luna in the process environment or the ignored prototype `.env.local`. If the inherited variable holds a stale key, replace it in the parent process or unset it before relying on the file. Keep the key out of source, reports, browser configuration and chat. The runner stops on errors without echoing upstream response details.

The baseline command evaluates development cases first. Inspect those results and use only the demonstrated weaknesses to draft a candidate instruction file. Compare candidates numbered 1–3. Freeze a qualifying candidate or run `freeze baseline` before starting any holdout evaluations. The report recommends a candidate only when both groups clear the mean improvement, trade-off, decision-usefulness and grounding gates. Inspect both better and worse examples, and review flagged numeric claims manually before recommending any release. A candidate is never deployed from this runner.

Default cumulative limits are 64 calls and 50,000 micro-USD ($0.05) in the local evaluation ledger. Configure `COACH_EVAL_MAX_CALLS` and `COACH_EVAL_MAX_MICROS` only within the authorized development budget. Generation has a 2,048 input and 512 output token envelope. The judge has a 4,096 input and 640 output token envelope. At the configured rates, conservatively budget $0.000512 per generation and $0.000832 per judge call. One candidate through development and holdout consumes up to 44 calls. Two candidates take up to 60 and three up to 76, subject to the cost guard. Local calls are accounted separately from the Forecasting Alpha ledger.

Reports and the durable local budget are in ignored `dist/coach-ai-eval/`. A lock prevents concurrent dispatch. Every call is reserved before dispatch and settled against reported usage. A failed or ambiguous request keeps its reservation and blocks further model calls until the operator reconciles it. Do not erase the ledger to retry. Verify the upstream rejection or provider usage, record the reconciliation in the report, and clear only the reconciled hold. Preserve the call count and actual spending. Partial case results remain in JSONL. There are no automatic provider retries or credential reads from AWS.

For a reviewed prior rejection with incomplete billing evidence, `carry-reservation` can move its full amount to a permanent budget charge separate from confirmed spend. This retains the call count, preserves the entire amount against the cap, records a local receipt, and permits subsequent calls. It is an explicit operator action.

## Scenario Analysis Coach

Keep its analytical engine and its business rubric separate from Forecasting. Define how the engine compares assumptions and outcomes, how the real Advisor prepares decision evidence, and what AI should add, such as identifying which scenario differences matter and which contingencies management can act on. Adapt representative cases with a development/holdout split and call the actual Scenario Analysis context builder. Provide scenario-specific `expected` and `avoid` fields for the independent judge only. Reuse `evaluateCases`, the durable budget and the blind ordering. Customize the dimensions, rubric and quality gates for Scenario Analysis. Before Alpha, require analytical regression tests, no unresolved critical grounding failures, passing holdouts, local application verification and a written report. For Simulation and Optimization, repeat the same gate with their own prompts and decision rubric.

## Round 2 decision contrasts

`round2-cases.mjs` defines six pairs with identical forecast evidence within each pair and different business conditions. Four pairs are development cases. Two pairs stay sealed until the candidate is fixed and the original 12-case regression pass completes. The judge receives case-specific expectations, but the generator receives only the production messages. Review each contrast for a material change in recommended action as well as scores.

```powershell
node eval/round2.mjs plan
node eval/round2.mjs baseline
node eval/round2.mjs candidate eval/round2-candidate.txt
node eval/round2.mjs regression
node eval/round2.mjs holdout
```

The candidate command freezes one prompt for this run. The regression phase reuses the 12 preserved version 9 drafts and regenerates only the candidate. The holdout phase generates both prompts on the four untouched cases. A single round schedules 36 generation calls and 32 judge calls, with a conservative $0.045056 planned ceiling and a separate durable $0.05 spending cap. Reports, partial transcripts and receipts are in ignored `dist/coach-ai-round2/`. The Alpha ledger and deployment are outside this runner.

Round 2 retained version 9. Paired means for baseline versus candidate were 4.20 versus 3.96 on development contrasts, 4.31 versus 3.81 on the original regression cases, and 4.21 versus 3.86 on the holdouts. The candidate was more decisive in some strong-evidence cases, with weaker execution and monitoring elsewhere. 69 settled requests cost $0.008613. One HTTP 400 rejection left $0.000797 conservatively carried against the cap. The reviewed restart skipped the two completed cases and checkpointed subsequent drafts before judging. AWS and Alpha were unchanged.

## Execution checkpoint

After the Windows user-level credential was corrected, the model metadata check returned HTTP 200 and one metered staffing connectivity request settled at $0.000093. The prior rejected attempt's full $0.000490 was carried against the local cap without treating it as confirmed spend.

The full local run retained version 9. Its eight development cases averaged 4.39/5 in the standalone review. In two separate blind paired reviews, candidate 1 scored 4.05 against 4.16 and candidate 2 tied at 4.43. Neither cleared the improvement gate. Version 9 was frozen before opening four holdouts and scored 4.21/5 on them. The final receipt recorded 57 successful requests, 28,668 input tokens, 7,661 output tokens, $0.007438 settled, and no pending reservations. One earlier failed attempt remains in the cumulative call count. Alpha and production were untouched.
