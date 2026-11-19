import React,{useEffect,useState} from 'react';
const tree=import.meta.env.VITE_VERIFIED_DECISION_TREE_URL==='https://d6owpirihdsus.cloudfront.net/'?'https://d6owpirihdsus.cloudfront.net/':'https://decisiontree.engentlabs.com/';
const b1=import.meta.env.VITE_RELEASE_B1_ENABLED==='true';
export default function ReleaseAAccess({onSharedLaunch,b1Enabled=b1}={}){
 const [account,setAccount]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const c=new AbortController();fetch('/api/platform/session',{signal:c.signal}).then(async r=>{if(!r.ok)throw Error();const a=await r.json();setAccount(a);onSharedLaunch?.(a.signedIn&&a.treeLoginUrl===tree+'api/shared/login'?a.treeLoginUrl:null);}).catch(e=>{if(e.name!=='AbortError'){onSharedLaunch?.(null);setError('Sign-in is temporarily unavailable. You can still register or sign in directly with Decision Tree Coach.');}});return()=>c.abort();},[onSharedLaunch]);
 async function logout(){setBusy(true);try{const r=await fetch('/api/platform/logout',{method:'POST'});if(!r.ok)throw Error();const result=await r.json();const url=new URL(result.logoutUrl);if(url.protocol!=='https:'||url.hostname!==(tree.includes('d6owpirihdsus')?'engent-platform-alpha-771049112957.auth.us-east-1.amazoncognito.com':'engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com')||url.pathname!=='/logout')throw Error();window.location.assign(url.href);}catch{setError('Sign-out could not be completed. Please try again.');setBusy(false);}}
 const [reason,setReason]=useState(''),[requestBusy,setRequestBusy]=useState(false),[requestError,setRequestError]=useState(''),[guest,setGuest]=useState(false);
 async function requestAccess(e){e.preventDefault();setRequestBusy(true);setRequestError('');try{const r=await fetch('/api/platform/access/tree/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});if(!r.ok){setRequestError(r.status===429?'Too many requests. Try again later.':r.status===409?'Access changed. Refresh this page before trying again.':'Your request could not be submitted. Please try again.');return;}const v=await r.json();if(v.requestStatus!=='pending')throw Error();setAccount(a=>({...a,entitlements:{...a.entitlements,tree:{...a.entitlements?.tree,requestStatus:'pending'}}}));setReason('');}catch{setRequestError('Your request could not be submitted. Please try again.');}finally{setRequestBusy(false);}}
 const launch=account?.treeLoginUrl===tree+'api/shared/login'?account.treeLoginUrl:null;
 if(b1Enabled)return <section aria-label="Engent Labs account" className="platform-access">
  <h2>Your Engent Labs account</h2>
  {account?.signedIn?<>
   <p>Signed in to Explore. Decision Tree access: <strong>{account.entitlements?.tree?.advanced?'Advanced':'Student'}</strong>.</p>
   {account.entitlements?.tree?.requestStatus&&<p role="status">Decision Tree Advanced request: {account.entitlements.tree.requestStatus}.</p>}
   {account.accessRequestsEnabled&&!account.entitlements?.tree?.advanced&&account.entitlements?.tree?.requestStatus!=='pending'&&<form onSubmit={requestAccess}><label>Reason for Decision Tree Advanced access (optional)<input maxLength={500} value={reason} disabled={requestBusy} onChange={e=>setReason(e.target.value)}/></label><button disabled={requestBusy}>{requestBusy?'Submitting request...':'Request Decision Tree Advanced access'}</button></form>}
   {!account.accessRequestsEnabled&&<p>Access requests remain available in <a href={tree}>Decision Tree Coach</a>.</p>}{requestError&&<p role="alert">{requestError}</p>}
   {launch?<p><a className="engent-text-link" href={launch}>Open Decision Tree Coach with shared sign-in</a></p>:<p><a href={tree}>Open Decision Tree Coach directly</a></p>}
   <button type="button" disabled={busy} onClick={logout}>Sign out of Explore</button><p>This signs out of Explore. Decision Tree and other independent coach sessions may remain signed in.</p>
  </>:guest?<><p>Browse the coaches without starting sign-in.</p><button onClick={()=>setGuest(false)}>Account options</button></>:<>
   <p>One Engent Labs account. Sign in, create an account, or explore as a Guest.</p>
   {account&&!error&&<a className="engent-text-link" href="/api/platform/login">Sign in</a>}{' '}
   <a className="engent-text-link" href={tree+'?entry=engent-registration&return=explore'}>Create account</a>{' '}
   <button type="button" onClick={()=>setGuest(true)}>Continue as Guest</button>
   <p>Temporary account creation uses the existing Decision Tree email-verification service. After verification, return to Explore; one additional sign-in may be needed.</p>
   <p>The hosted sign-in screen is for existing accounts. Its separate Create an account option is not supported here; use Create account above instead.</p>
  </>}
  {error&&<p role="alert">{error}</p>}
 </section>;
 return <section aria-label="Engent Labs account" className="platform-access">
  <p>{account?.signedIn?'Signed in to Engent Labs.':'Browse as a Guest, or sign in with your existing Engent Labs account.'}</p>
  <p>New student? <a className="engent-text-link" href={tree}>Register with Decision Tree Coach</a>, then return to Explore to use shared sign-in. Registration availability is controlled there.</p>
  <p>Use this page to sign in to an existing account. If Cognito offers Sign up, use the Decision Tree registration link above instead.</p>
  {account?.signedIn?<button type="button" disabled={busy} onClick={logout}>Sign out of Engent Labs</button>:account&&!error?<a className="engent-text-link" href="/api/platform/login">Sign in</a>:null}
  {account?.signedIn&&launch&&<p><a className="engent-text-link" href={launch}>Open Decision Tree Coach with shared sign-in</a></p>}
  {account?.signedIn&&!launch&&<p role="alert">Shared launch is unavailable. <a href={tree}>Open Decision Tree Coach directly</a>.</p>}
  {account?.signedIn&&<p>Signing out here ends this platform session. Other open coach sessions can remain active.</p>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
