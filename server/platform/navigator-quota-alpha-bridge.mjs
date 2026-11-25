import {handlerEntry as quota} from './navigator-quota-alpha-entry.mjs';
import {handlerEntry as legacy} from './navigator-scenario-alpha-entry.mjs';
// Temporary rolling-upgrade adapter only. Production diagnostics stay untouched.
// Remove this compatibility entry from the final Alpha runtime after Scenario v2.
export async function handlerEntry(event){
 if(event.rawPath==='/internal/coaches/scenario/ai'){
  let x;try{const s=event.isBase64Encoded?Buffer.from(event.body??'','base64').toString('utf8'):event.body??'';if(Buffer.byteLength(s)<=16384)x=JSON.parse(s);}catch{}
  if(x?.contractVersion!==2)return legacy(event);
 }
 return quota(event);
}
