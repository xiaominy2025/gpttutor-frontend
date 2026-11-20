import {createHash,randomUUID} from 'node:crypto';
export const approvedManifest='61c0f66ab9e641d0165bf79e0d5f0de95ed4d0cc8a523521419e29afdeb3c5f9';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function canonical(x){return JSON.stringify(sort(x));}function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
export function normalizeProtected(id,value){
 const x=structuredClone(value),stamp=(o,key)=>{if(o&&typeof o[key]==='string'&&Number.isFinite(Date.parse(o[key])))o[key]=new Date(o[key]).toISOString();};
 if(['platform-live','platform-latest','tree-live','tree-latest'].includes(id))stamp(x,'LastModified');
 if(id.endsWith('-role')){stamp(x.Role,'CreateDate');delete x.Role?.RoleLastUsed;}
 if(id==='tree-boundary-policy'){stamp(x.Policy,'CreateDate');stamp(x.Policy,'UpdateDate');}
 if(id==='tree-boundary-version')stamp(x.PolicyVersion,'CreateDate');
 if(id==='tree-boundary-versions')for(const v of x.Versions??[])stamp(v,'CreateDate');
 if(['student-pool','admin-pool'].includes(id)){stamp(x.UserPool,'CreationDate');stamp(x.UserPool,'LastModifiedDate');}
 if(id==='headers')stamp(x.ResponseHeadersPolicy,'LastModifiedTime');
 if(id==='routes')x.Items?.sort((a,b)=>a.RouteKey.localeCompare(b.RouteKey));if(id.endsWith('-policies-list'))x.PolicyNames?.sort();if(id.endsWith('-attached'))x.AttachedPolicies?.sort((a,b)=>a.PolicyArn.localeCompare(b.PolicyArn));return x;
}
export async function lockedJournal({acquire,load,release},work){await acquire();try{return await work(await load());}finally{await release();}}
export function validatePlan(p,m,raw,expectedHash=approvedManifest){
 if(sha(raw)!==expectedHash||p.manifest!==expectedHash||m.account!=='771049112957'||m.region!=='us-east-1'||m.platformLive!=='4'||m.treeLive!=='17'||m.headerBlob!=='5600dfdb00b30364fb1c2699a8f58af68f72c3f7')throw Error('Unapproved manifest');
 const expected=Object.entries(m).filter(([k])=>['platform','tree'].includes(k)).flatMap(([owner,a])=>a.files.filter(f=>f.action!=='reuse-verified').map(f=>({owner,...f,bucket:a.bucket})));
 if(expected.length!==7||p.rows.length!==7||new Set(p.rows.map(r=>r.key)).size!==7||p.rows.filter(r=>r.action==='stage-if-absent').length!==3||p.rows.filter(r=>r.action==='conditional-promote').length!==4)throw Error('Write count');
 for(const row of p.rows){const x=expected.find(f=>f.key===row.key);if(!x||row.owner!==x.owner||row.sha256!==x.sha256||row.bucket!==x.bucket||row.baselineVersion!==x.baselineVersion||row.baselineEtag!==x.baselineEtag||row.action!==x.action||row.contentType!==x.contentType||row.cacheControl!==x.cacheControl)throw Error('Unapproved write row');if(row.action==='conditional-promote'&&(!row.baselineSha256||!row.baselineBody))throw Error('Missing rollback bytes');}
}
export function createPublisher({plan,manifest,rawManifest,store,journal,save,read,expectedManifestHash=approvedManifest}){
 validatePlan(plan,manifest,rawManifest,expectedManifestHash);
 if(!journal.releaseId)throw Error('Missing paired journal');
 journal.rows??={};
 const entries=owner=>{if(!['platform','tree'].includes(owner))throw Error('Wrong owner');return plan.rows.filter(r=>r.owner===owner);};
 const verifyBody=(r,baseline=false)=>{const data=read(baseline?r.baselineBody:r.body);if(sha(data)!==(baseline?r.baselineSha256:r.sha256))throw Error('Local artifact changed');return data;};
 const record=(r)=>journal.rows[r.key]??={};
 async function baseline(r){const h=await store.head(r);if(r.action==='stage-if-absent'){if(h)throw Error('Asset appeared since preflight');}else if(!h||h.etag!==r.baselineEtag||h.version!==r.baselineVersion)throw Error('HTML baseline drift');return h;}
 async function owned(r,e){const h=await store.head(r);if(!h||h.version!==e.version||h.etag!==e.etag||h.metadata?.['engent-release-id']!==journal.releaseId||h.metadata?.['engent-write-id']!==e.writeId||sha(await store.get(r,h.version))!==e.sha256)throw Error('Current object not receipt-owned');return h;}
 async function reconcile(r,e,definiteNoWrite=false){
  const h=await store.head(r);if(h?.metadata?.['engent-release-id']===journal.releaseId&&h.metadata?.['engent-write-id']===e.writeId&&sha(await store.get(r,h.version))===e.sha256){Object.assign(e,{status:e.rollback?'rolled-back':'applied',version:h.version,etag:h.etag});save(journal);return true;}
  const prior=e.rollback?e.prior:{status:'not-applied'};const untouched=e.rollback?h?.version===prior?.version&&h?.etag===prior?.etag:r.action==='stage-if-absent'?!h:h?.version===r.baselineVersion&&h?.etag===r.baselineEtag;
  if(definiteNoWrite&&untouched){for(const k of Object.keys(e))delete e[k];Object.assign(e,prior);save(journal);return false;}
  throw Error('Unknown write outcome; preserve pending and stop for read-only reconciliation');
 }
 async function put(r,rollback=false){
  const e=record(r);if(e.status==='pending'){if(await reconcile(r,e))return;}
  if(e.status===(rollback?'rolled-back':'applied')){if(!rollback)await owned(r,e);return;}
  let data;if(rollback){try{data=verifyBody(r,true);}catch{data=await store.get(r,r.baselineVersion);if(sha(data)!==r.baselineSha256)throw Error('Versioned rollback bytes mismatch');}}else{data=verifyBody(r);if(r.action==='conditional-promote')verifyBody(r,true);}let before;if(rollback){if(e.status!=='applied')return;before=await owned(r,e);}else before=await baseline(r);
  const old={...e};const writeId=randomUUID();Object.assign(e,{status:'pending',writeId,sha256:sha(data),rollback,prior:rollback?old:null});save(journal);
  const input={ifMatch:before?.etag,ifNoneMatch:r.action==='stage-if-absent'?'*':undefined,contentType:rollback?r.baselineContentType:r.contentType,cacheControl:rollback?r.baselineCacheControl:r.cacheControl,metadata:rollback?{...r.baselineMetadata,'engent-release-id':journal.releaseId,'engent-write-id':writeId}:{'engent-release-id':journal.releaseId,'engent-write-id':writeId,'sha256':r.sha256}};
  try{const result=await store.put(r,data,input);const h=await store.head(r);if(!h||result.version!==h.version||result.etag!==h.etag||h.metadata?.['engent-write-id']!==writeId||sha(await store.get(r,h.version))!==e.sha256)throw Error('Post-write receipt mismatch');Object.assign(e,{status:rollback?'rolled-back':'applied',version:h.version,etag:h.etag});save(journal);}catch(error){
   if(await reconcile(r,e,error.definiteRejected===true))return;
   throw error;
  }
 }
 async function settlePending(){for(const r of plan.rows){const e=record(r);if(e.status==='pending')await reconcile(r,e);}}
 async function assertStages(){for(const r of plan.rows.filter(r=>r.action==='stage-if-absent')){const e=record(r);if(e.status!=='applied')throw Error('All assets must be staged first');await owned(r,e);}}
 return {
  async check(){await store.protected();for(const r of plan.rows){verifyBody(r);if(r.action==='conditional-promote'){verifyBody(r,true);if(sha(await store.get(r,r.baselineVersion))!==r.baselineSha256)throw Error('Versioned rollback bytes mismatch');}const e=record(r);if(e.status==='pending')await reconcile(r,e);if(['applied','rolled-back'].includes(e.status))await owned(r,e);else if(e.status!=='rolled-back')await baseline(r);}return {passed:true};},
  async stage(owner){await store.protected();await settlePending();for(const r of entries(owner).filter(r=>r.action==='stage-if-absent'))await put(r);},
  async promote(owner){await store.protected();await settlePending();await assertStages();if(owner==='platform'&&plan.rows.some(r=>r.owner==='tree'&&r.action==='conditional-promote'&&record(r).status!=='applied'))throw Error('Tree HTML must be promoted before platform');for(const r of entries(owner).filter(r=>r.action==='conditional-promote'))await put(r);},
  async rollback(owner){await store.protected();await settlePending();for(const r of entries(owner).filter(r=>r.action==='conditional-promote').reverse()){const e=record(r);if(e.status==='pending')await reconcile(r,e);if(e.status==='applied')await put(r,true);}},
  async invalidate(rollback=false){await store.protected();await settlePending();if(!rollback&&plan.rows.filter(r=>r.action==='conditional-promote').some(r=>record(r).status!=='applied'))throw Error('HTML pair incomplete');if(!rollback){await assertStages();for(const r of plan.rows.filter(r=>r.action==='conditional-promote'))await owned(r,record(r));}else{if(!plan.rows.some(r=>r.action==='conditional-promote'&&record(r).status==='rolled-back'))throw Error('No HTML recovery to invalidate');for(const r of plan.rows.filter(r=>r.action==='conditional-promote')){const e=record(r);if(e.status==='rolled-back')await owned(r,e);else{if(e.status==='applied'||e.status==='pending')throw Error('Recovery incomplete');await baseline(r);}}}if(journal.invalidation&&!rollback)return journal.invalidation;const ref=journal.releaseId+(rollback?'-rollback':'-publish');journal.invalidationAttempt={ref,paths:manifest.invalidationPaths};save(journal);const result=await store.invalidate(manifest.invalidationPaths,ref);journal[rollback?'rollbackInvalidation':'invalidation']=result;save(journal);return result;}
 };
}
