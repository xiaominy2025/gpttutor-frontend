import React,{useEffect,useState} from 'react';
const tree='https://decisiontree.engentlabs.com/';
export default function ReleaseAAccess(){
 const [account,setAccount]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const c=new AbortController();fetch('/api/platform/session',{signal:c.signal}).then(async r=>{if(!r.ok)throw Error();setAccount(await r.json());}).catch(e=>{if(e.name!=='AbortError')setError('Sign-in is temporarily unavailable. You can still register or sign in directly with Decision Tree Coach.');});return()=>c.abort();},[]);
 async function logout(){setBusy(true);try{const r=await fetch('/api/platform/logout',{method:'POST'});if(!r.ok)throw Error();const result=await r.json();const url=new URL(result.logoutUrl);if(url.protocol!=='https:'||url.hostname!=='engent-platform-prod-771049112957.auth.us-east-1.amazoncognito.com'||url.pathname!=='/logout')throw Error();window.location.assign(url.href);}catch{setError('Sign-out could not be completed. Please try again.');setBusy(false);}}
 const launch=account?.treeLoginUrl===tree+'api/shared/login'?account.treeLoginUrl:null;
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
