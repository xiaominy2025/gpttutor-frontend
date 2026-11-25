import {runtimeConfigurationHash} from './navigator-canary-execution-guards.mjs';
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
// PublishVersion can change $LATEST's CAS token independently of the immutable
// version token. Accept only the unique owned publish plus unchanged stable code/config.
export function publishedPrivateRevision({priorRevision,expectedHash,configurationHash,published,first,second,events,functionArn,principal}){
 const fail=()=>{throw Error('Published revision ownership unverified; do not overwrite');};
 if(!uuid.test(priorRevision)||!/^\d+$/.test(published?.Version??'')||published.FunctionArn!==functionArn+':'+published.Version||published.CodeSha256!==expectedHash||runtimeConfigurationHash(published)!==configurationHash||!Array.isArray(events)||events.length!==1)fail();
 for(const c of[first,second])if(c?.Version!=='$LATEST'||![functionArn,functionArn+':$LATEST'].includes(c.FunctionArn)||c.CodeSha256!==expectedHash||runtimeConfigurationHash(c)!==configurationHash||c.State!=='Active'||c.LastUpdateStatus!=='Successful'||!uuid.test(c.RevisionId??'')||c.LastModified!==published.LastModified)fail();
 if(first.RevisionId!==second.RevisionId)fail();
 const e=events[0],p=e.requestParameters??{},r=e.responseElements??{};
 if(e.eventSource!=='lambda.amazonaws.com'||e.eventName!=='PublishVersion20150331'||e.errorCode||e.userIdentity?.arn!==principal||!uuid.test(e.eventID??'')||
    ![functionArn,functionArn.split(':').at(-1)].includes(p.functionName)||p.revisionId!==priorRevision||p.codeSha256!==expectedHash||r.version!==published.Version||r.revisionId!==published.RevisionId||r.codeSha256!==expectedHash||r.functionArn!==published.FunctionArn)fail();
 return{revision:first.RevisionId,cloudTrailEventId:e.eventID,immutableVersion:published.Version};
}
