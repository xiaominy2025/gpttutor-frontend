import { sharedBudgetWrite } from "./shared-budget.mjs";

export function productionDynamoStore({ tableName, partition, getItem, putItem, transactWrite, sharedBudget = false }) {
  const key = { pk: { S: partition }, sk: { S: "STATE" } };
  const check = requested => {
    if (requested !== partition) throw Error("Unexpected production ledger partition.");
  };
  return {
    async read(requested) {
      check(requested);
      const { Item } = await getItem({ TableName: tableName, Key: key, ConsistentRead: true });
      if (!Item) return null;
      return { revision: Number(Item.revision?.N), value: JSON.parse(Item.state.S) };
    },
    async replace(requested, revision, value, money) {
      check(requested);
      if (!Number.isSafeInteger(revision) || revision < 1) throw Error("Invalid production ledger revision.");
      const put = {
          TableName: tableName,
          Item: { ...key, revision: { N: String(revision + 1) }, state: { S: JSON.stringify(value) } },
          ConditionExpression: "revision = :expected",
          ExpressionAttributeValues: { ":expected": { N: String(revision) } }
      };
      try {
        if (sharedBudget) {
          const budget = await sharedBudgetWrite({ tableName, getItem, ...money });
          if (!budget) return "denied";
          await transactWrite({ TransactItems: [{ Put: budget }, { Put: put }] });
        } else {
          await putItem(put);
        }
        return true;
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") return false;
        if (error.name === "TransactionCanceledException" &&
            error.CancellationReasons?.some(reason => ["ConditionalCheckFailed", "TransactionConflict"].includes(reason.Code)) &&
            error.CancellationReasons.every(reason => ["None", "ConditionalCheckFailed", "TransactionConflict"].includes(reason.Code))) return false;
        throw error;
      }
    }
  };
}
