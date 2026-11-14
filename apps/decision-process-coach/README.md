# Decision Process Coach 2026

This independent Engent Labs application contains its own browser entrypoint, coaching service, and versioned prompt. It runs alongside Practice Lab.

## Local prototype

From this directory with Node.js 22 or later:

```sh
npm ci
npm run dev
```

Open [Decision Process Coach](http://127.0.0.1:5184/decision-process). The default mode uses deterministic mock responses. Runs are local, and the conversation is kept in browser memory until reset or refresh. The service receives the opening exchange and the most recent complete exchanges, with up to 19 total messages including the current question. The mock demonstrates conversation flow and is not a measure of coaching quality.

```sh
npm test
npm run build
npm run test:browser
```

Run the browser checks with the local mock server running and Microsoft Edge installed. The build produces the standalone static frontend in `dist/`. The dev server is for loopback use.

## OpenAI configuration

For separately approved live testing, inject `PROCESS_COACH_MODE=openai`, `PROCESS_COACH_OPENAI_MODEL`, and `PROCESS_COACH_OPENAI_API_KEY` into the local server process. Verify the model is available to the dedicated development project and confirm pricing, rate limits, and spend controls before sending paid requests. Keep credentials out of tracked files, browser variables, and logs.

The API at `POST /api/decision-process/chat` validates and bounds the transcript, applies the server-owned prompt in `server/prompts/v1.md`, and requests structured text output with `store: false`. The client displays the five approved analytical tools by identifier. The prompt applies the project's educational brief. Source material for the book and Strategy Module can be reviewed directly when available.

## Hosted deployment proposal

Follow the Decision Tree Coach release conventions, with environment-specific AWS resources and a dedicated API Lambda. Serve immutable versioned static assets behind CloudFront with private S3 origin access. Route the same-origin API path to the Process Coach backend with caching disabled. Use a separate OpenAI project credential and grant the runtime read access only to its environment-specific SSM parameter or Secrets Manager secret. Gate hosted pilot access and throttle requests before enabling model calls.

For an approved release, verify the dedicated frontend artifact and Lambda version, record the prior frontend release and live alias target, and exercise rollback in staging. Routine code releases should use a direct release workflow. Infrastructure changes belong in CloudFormation and require separate owner approval. Practice Lab retirement is an independent activity.
