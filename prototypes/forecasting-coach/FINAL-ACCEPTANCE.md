# Forecasting Coach V1 Final Acceptance and Lessons Learned

The owner accepted Forecasting Coach V1 for Alpha and retained Advisor version 9. This closes optimization. Reopen it only if actual use reveals a material, recurring reasoning weakness. Alpha acceptance does not authorize unrestricted production publication.

## Decision and evidence

- Round 1: In blind development comparisons, candidate 1 scored 4.05/5 versus 4.16 for version 9. Candidate 2 tied at 4.43. Neither cleared the improvement gate. Version 9 scored 4.21 on four untouched holdouts.
- Round 2: The more decisive candidate scored below version 9 across development contrasts (3.96 vs. 4.20), original regression cases (3.81 vs. 4.31) and sealed holdouts (3.86 vs. 4.21). It sometimes improved commitment decisions but weakened execution, monitoring and interpretation of business conditions.
- Matched cases held forecast evidence fixed and changed operating facts. Version 9 held capacity steady where delivery was on target, adjusted operations when they could absorb the change, and supported permanent expansion where capacity was exhausted and service deteriorated despite extra shifts.
- Minor limitations: wording can be long or repeat figures, monitoring triggers can be too general, and the model can delay a firmer staffing decision despite sustained overtime and service pressure.

## Verification, spend and operating status

66 tests passed in the closure run, including all three original teaching workbooks. Round 1 settled $0.007438 in local spend with $0.000490 carried against its cap. Round 2 settled $0.008613 with $0.000797 carried. No pending reservations remained in either local ledger. Alpha's read-only ledger check showed $0.002471 spent of $1.00, 21 admissions and zero active reservations or leases. Closure made no provider requests.

The public workspace returned HTTP 200. The live alias reported version 9 in live mode. The configured paid pilot expires November 23, 2026 at 6:00 p.m. Central (November 24 at 00:00 UTC). The workspace and deterministic forecasting are independent of the pilot. See the [existing release and rollback record](ALPHA-ADVISOR-RELEASE-REVIEW.md). No expiry extension, prompt change, AWS write, DNS change or deployment was performed.

## Preserve and transfer the process

Retain the [runner, cases, rubrics and commands](eval/README.md), the Round 1 and Round 2 reports and raw JSON/JSONL receipts. Keep credentials in a secure local environment or ignored configuration file. A closure evidence archive preserves the results outside the ignored build directory.

For the next Coach, define the AI's specialized role, develop the analytical engine, integrate real AI locally, evaluate representative decisions, optimize locally, validate the complete experience, then deploy to Alpha. Scenario Analysis Coach is next. Simulation and Optimization can reuse the technical evaluation runner, blind scoring and budget controls. Each Coach needs its own reasoning objective, evidence contract, cases and rubric.

For future evaluations:

1. Score the recommended decision separately from the quality of the implementation guidance.
2. Assess meaningful trade-offs, including the costs of acting and waiting.
3. Verify the meaning of each business measure before judging the advice.
4. Pair monitoring indicators with a specific condition for reconsidering a decision.
5. Test recommendation changes using matched forecasts and contrasting business conditions.
6. Use model scores as supporting evidence alongside actual responses and analyst judgment. Give word count low weight.

No Round 3 was initiated.
