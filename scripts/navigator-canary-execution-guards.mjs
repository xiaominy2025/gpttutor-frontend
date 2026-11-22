// Pure, offline-testable ownership and terminal-response checks. Never return secret data.
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
export function acknowledgedInstallRevision(acknowledgement,expectedHash,priorRevision){
 if(acknowledgement?.CodeSha256!==expectedHash||!uuid.test(acknowledgement.RevisionId??'')||acknowledgement.RevisionId===priorRevision)
  throw Error('Install ownership was not acknowledged; stop and reconcile');
 return acknowledgement.RevisionId;
}
export function assertOwnedPrivateRevision(configuration,expectedHash,ownedRevision){
 if(!uuid.test(ownedRevision??'')||configuration?.CodeSha256!==expectedHash||configuration.RevisionId!==ownedRevision)
  throw Error('Private code revision ownership lost; stop without overwriting');
}
export function observeTerminalLambdaResponse(response,onTerminal){
 return {status:response.status,headers:response.headers,async json(){
  if(response.status!==200||response.headers.has('x-amz-function-error')||response.headers.get('x-amz-executed-version')!=='$LATEST')
   throw Error('Terminal Lambda result not established');
  const payload=await response.json(); // A truncated/unreadable payload must not clear uncertainty.
  await onTerminal();
  return payload;
 }};
}
