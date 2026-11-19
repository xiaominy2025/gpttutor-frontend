import {GetCommand, PutCommand, DeleteCommand, TransactWriteCommand} from '@aws-sdk/lib-dynamodb';
import {PlatformError} from './oauth.mjs';
export function dynamoStore(db, table) {
 const key = id => ({pk:id});
 const conditional = error => ['ConditionalCheckFailedException','TransactionCanceledException'].includes(error?.name);
 const put = (id, version, data) => ({
  TableName:table,Item:{...data,...key(id),version:version+1},
  ConditionExpression:version?'#v = :v':'attribute_not_exists(pk)',
  ...(version?{ExpressionAttributeNames:{'#v':'version'},ExpressionAttributeValues:{':v':version}}:{})
 });
 return {
  async get(id) { return (await db.send(new GetCommand({TableName:table,Key:key(id),ConsistentRead:true}))).Item; },
  async create(id,data) { await db.send(new PutCommand(put(id,0,data))); },
  async replace(id,version,data) {
   try { await db.send(new PutCommand(put(id,version,data))); return true; }
   catch(error) { if(conditional(error)) return false; throw error; }
  },
  async remove(id,version) {
   try {
    await db.send(new DeleteCommand({TableName:table,Key:key(id),...(version?{ConditionExpression:'#v = :v',ExpressionAttributeNames:{'#v':'version'},ExpressionAttributeValues:{':v':version}}:{})}));
    return true;
   } catch(error) { if(conditional(error)) return false; throw error; }
  },
  async transaction(updates) {
   try { await db.send(new TransactWriteCommand({TransactItems:updates.map(row=>({Put:put(row.id,row.previous?.version??0,row.value)}))})); return true; }
   catch(error) { if(conditional(error)) return false; throw new PlatformError(503,'Service temporarily unavailable.'); }
  }
 };
}
