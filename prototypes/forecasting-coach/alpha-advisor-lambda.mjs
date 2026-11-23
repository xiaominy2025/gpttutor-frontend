import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { forecastingRuntime } from "./alpha-advisor-runtime.mjs";
import { boundAdvisorInputTokens } from "./alpha-advisor-provider.mjs";

const dynamo = new DynamoDBClient({ maxAttempts: 1 });
const ssm = new SSMClient({ maxAttempts: 1 });
const env = process.env;
const mode = env.FORECASTING_MODE;

export const handler = forecastingRuntime({
  enabled: ["verify", "canary", "live"].includes(mode),
  verification: mode === "verify",
  canary: mode === "canary",
  expectedViewerIp: mode === "live" ? undefined : env.FORECASTING_EXPECTED_IP,
  apiId: "8qmgd1ghdi", stage: "$default", tableName: "decisiontree-alpha-staging-Data-JH4B4OFXWER5",
  pilotId: env.FORECASTING_PILOT_ID,
  startsAt: Date.parse(env.FORECASTING_STARTS_AT),
  endsAt: Date.parse(env.FORECASTING_ENDS_AT),
  model: "gpt-6-luna", inputRate: 125_000, outputRate: 500_000,
  boundInputTokens: boundAdvisorInputTokens,
  getItem: (input, options) => dynamo.send(new GetItemCommand(input), options),
  putItem: input => dynamo.send(new PutItemCommand(input)),
  getParameter: input => ssm.send(new GetParameterCommand(input))
});
