import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { productionRuntime } from "./runtime.mjs";

const dynamo = new DynamoDBClient({ maxAttempts: 1 });
const ssm = new SSMClient({ maxAttempts: 1 });
const env = process.env;
export const handler = productionRuntime({
  mode: env.FORECASTING_MODE,
  expectedViewerIp: env.FORECASTING_EXPECTED_IP,
  startsAt: Date.parse(env.FORECASTING_STARTS_AT),
  endsAt: Date.parse(env.FORECASTING_ENDS_AT),
  getItem: (input, options) => dynamo.send(new GetItemCommand(input), options),
  putItem: input => dynamo.send(new PutItemCommand(input)),
  getParameter: input => ssm.send(new GetParameterCommand(input))
});
