const sortKey = "STATE";

export function advisorDynamoStore({ tableName, pilotId, getItem, putItem }) {
  if (!tableName || !/^[a-z0-9-]{1,48}$/.test(pilotId)) throw new Error("Invalid Forecasting table binding.");
  const partition = "FORECASTING#PILOT#" + pilotId;
  const key = { pk: { S: partition }, sk: { S: sortKey } };
  function verifyPartition(requested) {
    if (requested !== partition) throw new Error("Unexpected Forecasting ledger key.");
  }
  return {
    async read(requested) {
      verifyPartition(requested);
      const { Item } = await getItem({ TableName: tableName, Key: key, ConsistentRead: true });
      if (!Item) throw new Error("Forecasting ledger was not initialized.");
      const revision = Number(Item.revision?.N);
      if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("Invalid ledger revision.");
      const value = JSON.parse(Item.state.S);
      if (!value || !Number.isSafeInteger(value.spent) || value.spent < 0 ||
          !Number.isSafeInteger(value.reserved) || value.reserved < 0 ||
          !value.requests || !value.leases) throw new Error("Invalid ledger state.");
      return { revision, value };
    },
    async replace(requested, revision, value) {
      verifyPartition(requested);
      if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("Invalid ledger revision.");
      const input = {
        TableName: tableName,
        Item: { ...key, revision: { N: String(revision + 1) }, state: { S: JSON.stringify(value) } },
        ConditionExpression: "revision = :expected",
        ExpressionAttributeValues: { ":expected": { N: String(revision) } }
      };
      try {
        await putItem(input);
        return true;
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") return false;
        throw error;
      }
    }
  };
}
