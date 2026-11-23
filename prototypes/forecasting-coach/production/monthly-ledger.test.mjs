import assert from "node:assert/strict";
import test from "node:test";
import { monthlyBudgetMicros, monthlyLedger, productionLedgerKey } from "./monthly-ledger.mjs";

function fixture({ spent = 0, state } = {}) {
  let current = { revision: 1, value: state ?? {
    day: "2026-11-30", months: { "2026-11": { spent, reserved: 0 } },
    requests: {}, leases: {}, paused: false, canaryUsed: false
  } };
  const store = {
    async read(key) {
      assert.equal(key, productionLedgerKey);
      return structuredClone(current);
    },
    async replace(key, revision, value) {
      assert.equal(key, productionLedgerKey);
      if (revision !== current?.revision) return false;
      current = { revision: revision + 1, value: structuredClone(value) };
      return true;
    }
  };
  return { store, ledger: monthlyLedger(store), state: () => current?.value, remove: () => { current = null; } };
}
const old = "2026-11-30T23:59:00Z", next = "2026-12-01T00:00:00Z";
const take = (ledger, time, actor, id, reservation = 512, ip = "network") =>
  ledger.admit({ actor, day: time.slice(0, 10), minute: Date.parse(time) / 60_000, reservation, id, ip });

test("calendar rollover preserves prior holds and cross-month concurrency", async () => {
  const { ledger, state } = fixture({ spent: monthlyBudgetMicros - 512 });
  assert.equal(await take(ledger, old, "alice", "old"), true);
  assert.equal(await take(ledger, old, "bob", "extra"), false);
  assert.equal(await take(ledger, next, "alice", "same-actor"), false);
  assert.equal(await take(ledger, next, "bob", "new"), true);
  assert.equal(await take(ledger, next, "carol", "third"), false);
  assert.equal(state().months["2026-11"].reserved, 512);
  assert.equal(state().months["2026-12"].reserved, 512);
  assert.equal(await ledger.settle("old", 400), true);
  assert.equal(await ledger.settle("old", 400), false);
  assert.equal(await take(ledger, next, "alice", "after-settlement"), true);
  assert.deepEqual(state().months["2026-11"], { spent: monthlyBudgetMicros - 112, reserved: 0 });
  assert.equal(await take(ledger, old, "new-visitor", "stale"), false);
});

test("admission and settlement fail closed on absent or unreconciled durable state", async () => {
  const { ledger, remove } = fixture();
  remove();
  await assert.rejects(() => take(ledger, next, "alice", "missing"), /Missing initialized/);
  const broken = fixture({ state: {
    day: "2026-11-30", months: { "2026-11": { spent: 0, reserved: 1 } },
    requests: {}, leases: {}, paused: false, canaryUsed: false
  } });
  await assert.rejects(() => broken.ledger.settle("lost", 0), /do not reconcile/);
});

test("concurrent CAS attempts cannot reserve beyond the monthly cap", async () => {
  const { ledger, state } = fixture({ spent: monthlyBudgetMicros - 512 });
  const results = await Promise.all([take(ledger, old, "alice", "one"), take(ledger, old, "bob", "two")]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(state().months["2026-11"].reserved, 512);
});

test("UTC daily, IP and guest-minute guards stay independent of month accounting", async () => {
  const { ledger } = fixture();
  for (let i = 0; i < 20; i++) {
    assert.equal(await take(ledger, next, "visitor" + i, "request" + i), true);
    await ledger.settle("request" + i, 0);
  }
  assert.equal(await take(ledger, next, "fresh", "rejected"), false);
  for (let i = 0; i < 5; i++) {
    const time = "2026-12-01T00:0" + i + ":00Z";
    assert.equal(await take(ledger, time, "guest", "guest" + i, 512, "another"), true);
    await ledger.settle("guest" + i, 0);
  }
  assert.equal(await take(ledger, "2026-12-01T00:05:00Z", "guest", "sixth", 512, "another"), false);
  const fresh = fixture();
  for (let i = 0; i < 2; i++) {
    assert.equal(await take(fresh.ledger, next, "visitor", "same-minute" + i), true);
    await fresh.ledger.settle("same-minute" + i, 0);
  }
  assert.equal(await take(fresh.ledger, next, "visitor", "third-in-minute"), false);
});

test("a restricted canary gets one admission over its lifetime", async () => {
  const { store, ledger } = fixture();
  const canary = monthlyLedger(store, { canary: true });
  assert.equal(await take(canary, old, "alice", "canary"), true);
  assert.equal(await canary.settle("canary", 400), true);
  assert.equal(await take(canary, next, "bob", "second"), false);
  assert.equal(await take(ledger, next, "bob", "released"), true);
});
