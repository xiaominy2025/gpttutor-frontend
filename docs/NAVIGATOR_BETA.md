# Navigator Beta review and evaluation

## Local review

PR #7 already provides optional Explore entry, the six-Coach catalog, dedicated stage-specific server credentials, Guest and account policies, quotas, concurrency controls, and atomic reservation against a $10 UTC-month model budget. The previous prompt was a Coach router. The API let the browser truncate and replace its own history, so there was no authoritative end to a decision.

From the Navigator branch, use Node 22.17 or newer:

```powershell
npm ci
npm run test:platform
node node_modules/vite/bin/vite.js --config scripts/navigator-preview.config.mjs
```

Open [local Explore](http://127.0.0.1:5173/explore). The preview forces the existing UI flag and uses a Guest fixture, deterministic mock AI and in-memory replay state. It makes no AWS, shared-auth, or OpenAI requests. Enter a decision, answer once, then use **Start New Decision**. Refreshing clears the conversation.

For a separate, non-generation credential check, place the dedicated key in the ignored `.env.navigator.local` as `NAVIGATOR_OPENAI_API_KEY`, or supply it to the Node process through that same environment variable. Keep it out of Vite-prefixed variables. Verify the file is ignored and run the metadata check:

```powershell
git check-ignore .env.navigator.local
node --env-file-if-exists=.env.navigator.local scripts/check-navigator-key.mjs
```

The check reports model access or an HTTP status, without printing the key or API response. It uses GET model metadata only. Live access remains unverified until the dedicated key is locally available and this check succeeds. The hosted credential loader still uses the existing stage-specific SSM path.

## Behavior and review boundaries

- The application keeps transcript text in browser memory and sends it with short-lived, caller-bound signed continuations. The platform store receives a consumed-continuation hash and TTL only. There is no saved project or transcript. Each continuation is single-use on success. Failed requests release the claim when they can and the spending controls still account for uncertain provider calls.
- Students can stop at any point, select an optional Objectives, Analysis, or Human Judgment question, or write their own follow-up. The fourth accepted user message ends the decision with a synthesis. Navigator explains one decision insight and helps the student see how objectives, alternatives, and judgment shape the choice. It may briefly name a useful analytical method. Students can browse the six Coaches directly on Explore.
- Before rollout, verify the configured model and prices against the dedicated project, the active stage's Tree destination and authentication, and representative response quality. A browser disconnect after successful processing can require starting a new decision. Guest request quotas can delay retries or later turns when earlier turns fall in the same minute.

## Representative decision cases

Use the text before the arrow as the opening turn. The hint after the arrow is a reviewer cue, not part of the prompt. Answer clarification questions consistently with a realistic persona, without steering toward the cue.

1. **Academic choice.** “I'm halfway through an economics major and considering switching to computer science. I want a data job and can afford one extra semester.” → Compare a minor or electives against switching.
2. **Career choice.** “I have a higher-paying offer with a long commute, and my current job lets me pick up my child every day.” → Translate commute and coverage into a threshold.
3. **Graduate school.** “Should I do a master's?” → Ask what career outcome the degree would unlock.
4. **Technology investment.** “Should our 30-person support team spend $80,000 annually on AI triage? We have no baseline for misrouted tickets.” → Measure baseline and pilot on a subset.
5. **Manufacturing capacity.** “Should we buy a second line or outsource peak volume? Demand peaks for six weeks and tooling lead time is nine months.” → Compare seasonal exposure and capacity triggers.
6. **Business strategy.** “We can enter Canada or improve retention in our current market. Our product team has capacity for only one initiative this year.” → Compare hypotheses and decision criteria.
7. **Sequential uncertainty.** “A lease option expires before regulatory approval. I can pay a fee to hold it for six months or sign now.” → Map choices, approval outcomes, and option value.
8. **Sequential uncertainty.** “Should we fund a prototype before submitting a bid? We will learn its yield after two months but the bid is due in three.” → Link yield to a later bid threshold.
9. **Forecasting.** “We order packaging monthly. We have two years of orders with promotions and holiday peaks. How much should we commit next quarter?” → Start with a seasonal baseline and forecast error.
10. **Forecasting with sparse data.** “Our new clinic has six weeks of appointment data. We need to decide whether to hire another receptionist.” → Clarify service thresholds and avoid precision from sparse data.
11. **Scenario analysis.** “We're considering a warehouse relocation and fuel prices, rent and delivery demand could all shift over the next two years.” → Use coherent futures and compare alternatives.
12. **Scenario analysis.** “Should we switch suppliers before a possible tariff? One offers a short contract and one requires a two-year commitment.” → Test the decision under several tariff regimes.
13. **Simulation.** “We promised a launch in 12 weeks. Several component lead times and validation durations are variable and some move together.” → Identify dependencies and model deadline risk.
14. **Simulation versus a simple method.** “I want to simulate whether I should pack an umbrella for one afternoon.” → Use a weather check and low-cost decision rule.
15. **Optimization.** “I schedule 25 operators on three lines. There are skill requirements, max hours, overtime and minimum daily output.” → Separate hard constraints from objective and gather inputs.
16. **Optimization versus feasibility.** “How do I optimize my family meal plan when we have two allergies and 20 minutes to cook?” → Start with safe feasible meals and a short rotation.
17. **Everyday decision.** “My kettle takes a minute longer to boil now. Should I replace it? It still works and money is tight.” → Match effort and expense to the inconvenience.
18. **Overlooked alternative.** “Our nonprofit must buy or rent a van, but we only use one six Saturdays a year.” → Consider sharing or paying per trip.
19. **Clarification.** “Should we choose Vendor A or Vendor B? Everyone has a strong opinion.” → Ask about the outcome or constraint that would distinguish them.
20. **No specialized Coach.** “Two friends invited me on different weekend trips. I can afford either but need a restful weekend before a busy week.” → Use a straightforward rest and relationship trade-off.

21. **Transit pass.** “A $60 monthly transit pass covers eight round trips I expect to take. Tickets cost $6 per round trip. I am on a tight budget and might take one more trip.” → Compare paying per trip with committing upfront. If numbers are included, eight trips cost $48, nine cost $54, and ten break even.

## Conversation rubric

Score each complete transcript from 0 to 2 on each dimension. Use 0 for absent or misleading, 1 for partially useful, and 2 for consistently strong. Record exact excerpts and one improvement per score below 2.

1. **Objectives and priorities.** Helps the student see what they want to achieve and which priorities or constraints matter most.
2. **Alternatives.** Helps the student recognize relevant options and see how those options serve competing objectives.
3. **Uncertainty and consequences.** Shows what could change, how it affects the options, and why it matters.
4. **Human judgment.** Makes clear where the student’s values, experience, risk tolerance, and circumstances shape the choice.
5. **Mental map.** Leaves the student with a concise, connected way to think about the decision and ownership of the final choice.

Suggested review bar is 8/10 with no zero, with accurate factual and numerical claims. Check that optional reflection questions examine the student’s thinking, that a follow-up adds a new perspective when useful, the dialogue ended within four user turns, and final guidance closed without an invitation to continue. Mock tests verify application behavior. Rate response quality only after collecting real conversations.

## Proposed paid evaluation

Run cases 3, 4, 7, 9, 15 and 17 sequentially after project access and owner budget approval. Allow up to three requests per case, 18 total, with no automatic retries. Before each call, limit the serialized request to 12,000 bytes and apply the app's conservative byte ceiling plus 1,024 framing tokens and 400 output tokens (including reasoning). Record full synthetic transcripts, timing, token counts, actual cost and rubric evidence. Stop at the first contract or usage anomaly.

OpenAI lists GPT-6 Luna Standard at $0.10 per million input tokens and $0.50 per million output tokens. At those rates the ceiling is 18 × (13,024 × $0.10 + 400 × $0.50) / 1,000,000 = $0.0270432. Request approval for **$0.03 total**, with Standard pricing and room under the existing $10 application cap as prerequisites. Confirm the model and rates again before the batch. [GPT-6 Luna model and pricing](https://developers.openai.com/api/docs/models/gpt-6-luna)
