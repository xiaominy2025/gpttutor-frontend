import assert from "node:assert/strict";
import test from "node:test";
import { advisorDynamoStore } from "./alpha-advisor-store.mjs";
import { forecastingLedger } from "./alpha-advisor.mjs";

test("Forecasting Dynamo adapter uses a strong read, exact key and versioned condition", async () => {
  let item;
  const pk = "FORECASTING#PILOT#fixture";
  const store = advisorDynamoStore({
    tableName: "fixture-table", pilotId: "fixture",
    async getItem(input) {
      assert.deepEqual(input.Key, { pk: { S: pk }, sk: { S: "STATE" } });
      assert.equal(input.ConsistentRead, true);
      return { Item: item };
    },
    async putItem(input) {
      assert.equal(input.Item.pk.S, pk);
      if (item) {
        assert.equal(input.ConditionExpression, "revision = :expected");
        if (input.ExpressionAttributeValues[":expected"].N !== item.revision.N) {
          throw Object.assign(new Error(), { name: "ConditionalCheckFailedException" });
        }
      } else assert.equal(input.ConditionExpression, "attribute_not_exists(pk)");
      item = input.Item;
    }
  });
  await assert.rejects(() => store.read("AI#CONFIG"));
  await assert.rejects(() => store.read(pk), /not initialized/);
  item = { revision: { N: "1" }, state: { S: JSON.stringify({ spent: 0, reserved: 0, requests: {}, leases: {} }) } };
  const ledger = forecastingLedger(store, "fixture");
  assert.equal(await ledger.admit({ actor: "actor", ip: "fixture-ip", minute: 1,
    day: "2026-11-22", reservation: 500, id: "fixture-request" }), true);
  assert.equal((await store.read(pk)).value.reserved, 500);
  assert.equal(await ledger.settle("fixture-request", 400), true);
  const read = await store.read(pk);
  assert.equal(read.revision, 3);
  assert.equal(read.value.spent, 400);
  assert.equal(await store.replace(pk, 1, read.value), false);
});
