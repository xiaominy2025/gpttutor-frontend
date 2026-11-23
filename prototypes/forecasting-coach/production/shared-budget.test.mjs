import assert from "node:assert/strict";
import test from "node:test";
import { productionDynamoStore } from "./dynamo-store.mjs";
import { monthlyBudgetMicros, monthlyLedger, productionLedgerKey } from "./monthly-ledger.mjs";

const tableName = "fixture";
const old = "2026-11-30T23:59:00Z", next = "2026-12-01T00:00:00Z";
const number = n => ({ N: String(n) });
const moneyKey = time => "NAVIGATOR#BUDGET#" + time.slice(0, 7);
const key = pk => ({ pk: { S: pk }, sk: { S: "STATE" } });

function fixture(spent = 0) {
  const local = { day: old.slice(0, 10), months: { "2026-11": { spent: 0, reserved: 0 } },
    requests: {}, leases: {}, paused: false, canaryUsed: false };
  const rows = new Map([
    [productionLedgerKey, { ...key(productionLedgerKey), revision: number(1), state: { S: JSON.stringify(local) } }],
    [moneyKey(old), { ...key(moneyKey(old)), version: number(7), spent: number(spent), reserved: number(0),
      alerted: number(80), expiresAt: number(2_000_000_000), leases: { M: {} }, extra: { S: "preserve" } }]
  ]);
  let fault, beforeForecastWrite;
  async function transactWrite({ TransactItems }) {
    if (TransactItems.length === 2 && beforeForecastWrite) {
      const run = beforeForecastWrite;
      beforeForecastWrite = undefined;
      await run();
    }
    if (fault === "before") throw Error("ambiguous transport");
    const reasons = TransactItems.map(({ Put }) => {
      const current = rows.get(Put.Item.pk.S);
      const attribute = Put.ExpressionAttributeNames?.["#v"] ?? "revision";
      const expected = Put.ExpressionAttributeValues?.[":expected"]?.N;
      return { Code: (expected === undefined ? !current : current?.[attribute]?.N === expected)
        ? "None" : "ConditionalCheckFailed" };
    });
    if (reasons.some(reason => reason.Code !== "None")) throw Object.assign(Error("CAS"), {
      name: "TransactionCanceledException", CancellationReasons: reasons
    });
    for (const { Put } of TransactItems) rows.set(Put.Item.pk.S, structuredClone(Put.Item));
    if (fault === "after") throw Error("ambiguous transport");
  }
  const store = productionDynamoStore({ tableName, partition: productionLedgerKey, sharedBudget: true,
    async getItem({ Key, ConsistentRead }) {
      assert.equal(ConsistentRead, true);
      return { Item: structuredClone(rows.get(Key.pk.S)) };
    },
    transactWrite, putItem: () => assert.fail("Live transaction cannot fall back to a single put.")
  });
  const ledger = monthlyLedger(store, { sharedBudget: true });
  const take = (time, actor, id, reservation = 512) => ledger.admit({
    actor, ip: "network", day: time.slice(0, 10), minute: Date.parse(time) / 60_000, id, reservation
  });
  return { rows, take, ledger, fault: value => { fault = value; },
    interleave: run => { beforeForecastWrite = run; },
    local: () => JSON.parse(rows.get(productionLedgerKey).state.S),
    async navigatorTake(time, reservation) {
      const current = rows.get(moneyKey(time));
      if (+current.spent.N + +current.reserved.N + reservation > monthlyBudgetMicros) return false;
      await transactWrite({ TransactItems: [{ Put: { TableName: tableName, Item: {
        ...current, reserved: number(+current.reserved.N + reservation), version: number(+current.version.N + 1),
        leases: { M: { ...current.leases.M, "navigator-uuid": number(reservation) } }
      }, ExpressionAttributeNames: { "#v": "version" }, ExpressionAttributeValues: { ":expected": current.version } } }] });
      return true;
    }
  };
}

test("Navigator wins an interleaved CAS and Forecasting cannot consume the remaining cap twice", async () => {
  const f = fixture(monthlyBudgetMicros - 512);
  f.interleave(async () => assert.equal(await f.navigatorTake(old, 512), true));
  assert.equal(await f.take(old, "visitor", "request"), false);
  assert.deepEqual(f.rows.get(moneyKey(old)).leases.M, { "navigator-uuid": number(512) });
  assert.deepEqual(f.local().requests, {});
});

test("concurrent admissions share the cap and preserve Navigator metadata and holds", async () => {
  const f = fixture(monthlyBudgetMicros - 1024);
  assert.equal(await f.navigatorTake(old, 512), true);
  const results = await Promise.all([f.take(old, "one", "a"), f.take(old, "two", "b")]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await f.navigatorTake(old, 1), false);
  const shared = f.rows.get(moneyKey(old));
  assert.equal(+shared.reserved.N, 1024);
  assert.deepEqual(shared.alerted, number(80));
  assert.deepEqual(shared.extra, { S: "preserve" });
  await f.ledger.settle(results[0] ? "a" : "b", 300);
  assert.deepEqual(f.rows.get(moneyKey(old)).leases.M, { "navigator-uuid": number(512) });
});

test("rollover creates one new monthly row and settles the original exactly once", async () => {
  const f = fixture();
  assert.equal(await f.take(old, "one", "old"), true);
  assert.equal(await f.take(next, "two", "new"), true);
  assert.equal(await f.take(next, "three", "blocked"), false);
  assert.equal(await f.ledger.settle("old", 513), true);
  assert.equal(await f.ledger.settle("old", 513), false);
  assert.equal(f.rows.get(moneyKey(old)).spent.N, "513");
  assert.equal(f.rows.get(moneyKey(old)).paused.BOOL, true);
  assert.equal(f.rows.get(moneyKey(next)).reserved.N, "512");
});

test("an unknown transaction outcome cannot release or duplicate a hold", async () => {
  const f = fixture();
  f.fault("before");
  await assert.rejects(f.take(old, "one", "before"), /ambiguous/);
  assert.deepEqual(f.local().leases, {});
  assert.equal(f.rows.get(moneyKey(old)).reserved.N, "0");
  f.fault("after");
  await assert.rejects(f.take(old, "one", "after"), /ambiguous/);
  f.fault(undefined);
  assert.equal(f.local().leases.after.reservation, 512);
  assert.equal(f.rows.get(moneyKey(old)).reserved.N, "512");
  assert.equal(await f.take(old, "one", "after"), false);
  f.rows.delete(moneyKey(old));
  await assert.rejects(f.ledger.settle("after", 0), /Missing previously used/);
  await assert.rejects(f.take(old, "two", "second"), /Missing previously used/);
});
