export function productionDynamoStore({ tableName, partition, getItem, putItem }) {
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
    async replace(requested, revision, value) {
      check(requested);
      if (!Number.isSafeInteger(revision) || revision < 1) throw Error("Invalid production ledger revision.");
      try {
        await putItem({
          TableName: tableName,
          Item: { ...key, revision: { N: String(revision + 1) }, state: { S: JSON.stringify(value) } },
          ConditionExpression: "revision = :expected",
          ExpressionAttributeValues: { ":expected": { N: String(revision) } }
        });
        return true;
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") return false;
        throw error;
      }
    }
  };
}
