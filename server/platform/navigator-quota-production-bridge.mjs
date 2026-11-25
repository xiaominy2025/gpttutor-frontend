import {handlerEntry as quota} from './navigator-quota-production-entry.mjs';
import {handlerEntry as legacy} from './navigator-scenario-production-entry.mjs';
// Prepared only. Preserve the separate existing v1 Production diagnostic until
// its acceptance/migration boundary is explicitly complete.
export async function handlerEntry(event){
 if(event.rawPath==='/internal/coaches/scenario/ai'){
  let x;try{const s=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';if(Buffer.byteLength(s)<=16384)x=JSON.parse(s);}catch{}
  if(x?.contractVersion!==2)return legacy(event);
 }
 return quota(event);
}
