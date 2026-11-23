import { monthlyBudgetMicros } from "./monthly-ledger.mjs";

const number = value => ({ N: String(value) });
const amount = field => /^\d+$/.test(field?.N ?? "") && Number.isSafeInteger(Number(field.N));

export async function sharedBudgetWrite({ tableName, getItem, month, id, reservation, minute, cost, pause, previouslyUsed }) {
  const key = { pk: { S: "NAVIGATOR#BUDGET#" + month }, sk: { S: "STATE" } };
  const { Item } = await getItem({ TableName: tableName, Key: key, ConsistentRead: true });
  const admission = cost === undefined;
  if (!Item && (!admission || previouslyUsed)) throw Error("Missing previously used production budget.");
  const current = Item ?? { ...key, spent: number(0), reserved: number(0), alerted: number(0), leases: { M: {} } };
  const leases = { ...current.leases?.M };
  if (!amount(current.spent) || !amount(current.reserved) ||
      (Item && (!amount(Item.version) || Number(Item.version.N) < 1 || !amount(Item.expiresAt))) ||
      !current.leases?.M || (current.paused && typeof current.paused.BOOL !== "boolean") ||
      Object.values(leases).some(lease => !amount(lease) || Number(lease.N) <= 0) ||
      Object.values(leases).reduce((sum, lease) => sum + Number(lease.N), 0) !== Number(current.reserved.N)) {
    throw Error("Invalid shared production budget.");
  }
  const version = Number(Item?.version.N ?? 0);
  const spent = Number(current.spent.N);
  const reserved = Number(current.reserved.N);
  const leaseId = "forecasting-" + id;
  const next = { ...current, version: number(version + 1), leases: { M: leases } };
  if (admission) {
    if (current.paused?.BOOL || spent + reserved + reservation > monthlyBudgetMicros) return null;
    if (Object.hasOwn(leases, leaseId)) throw Error("Duplicate Forecasting shared reservation.");
    leases[leaseId] = number(reservation);
    next.reserved = number(reserved + reservation);
    next.expiresAt = number(Math.max(Number(current.expiresAt?.N ?? 0), minute * 60 + 40 * 86400));
  } else {
    if (Number(leases[leaseId]?.N) !== reservation || !Number.isSafeInteger(spent + cost)) {
      throw Error("Forecasting shared reservation does not reconcile.");
    }
    delete leases[leaseId];
    next.reserved = number(reserved - reservation);
    next.spent = number(spent + cost);
    next.paused = { BOOL: current.paused?.BOOL === true || pause === true || cost > reservation };
  }
  return {
    TableName: tableName, Item: next,
    ...(Item ? { ConditionExpression: "#v = :expected", ExpressionAttributeNames: { "#v": "version" },
      ExpressionAttributeValues: { ":expected": number(version) } } :
      { ConditionExpression: "attribute_not_exists(pk)" })
  };
}
