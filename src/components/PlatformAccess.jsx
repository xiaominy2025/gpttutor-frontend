import React, {useEffect, useState} from 'react';

export default function PlatformAccess() {
 const [account,setAccount]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState(''),[history,setHistory]=useState([]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/platform/session',{signal:controller.signal}).then(async response=>{
   if(!response.ok) throw Error('Sign-in is temporarily unavailable.');
   setAccount(await response.json());
  }).catch(error=>{if(error.name!=='AbortError')setError(error.message);});
  return ()=>controller.abort();
 },[]);
 async function ask(event) {
  event.preventDefault();setBusy(true);setError('');
  try {
   const response=await fetch('/api/platform/navigator',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message,history:history.slice(-6).map(row=>({...row,text:row.text.slice(0,1000)}))})});
   const result=await response.json();
   if(!response.ok) throw Error(result.error);
   setHistory(rows=>[...rows,{role:'user',text:message},{role:'assistant',text:result.reply}]);setMessage('');
  } catch(error) {setError(error.message||'Navigator is temporarily unavailable.');}
  finally {setBusy(false);}
 }
 async function logout() {
  setBusy(true);
  try {
   const response=await fetch('/api/platform/logout',{method:'POST'});
   if(!response.ok) throw Error('Sign-out could not be completed.');
   const result=await response.json();window.location.assign(result.logoutUrl);
  } catch(error) {setError(error.message);setBusy(false);}
 }
 return <section aria-label="Engent Labs account and Navigator" className="platform-access">
  <p>{account?.signedIn?'Signed in to Engent Labs.':'Browse as a Guest, or sign in with your existing Engent Labs account.'}</p>
  {account?.signedIn?<button type="button" disabled={busy} onClick={logout}>Sign out of this tool</button>
   :<a className="engent-text-link" href="/api/platform/login">Sign in</a>}
  {account?.signedIn && <p><a className="engent-text-link" href={account.treeLoginUrl}>Open Decision Tree Coach with shared sign-in</a></p>}
  {account?.signedIn && <p>Signing out here also ends the shared login session. Other open coach sessions can remain active.</p>}
  {account?.navigator && <form onSubmit={ask}>
   <h2>AI Navigator</h2>
   <p>Find a coach for your decision.</p>
   <div role="log" aria-label="Navigator conversation">{history.map((row,index)=><p key={index}><strong>{row.role==='user'?'You':'Navigator'}</strong> {row.text}</p>)}</div>
   <label htmlFor="navigator-message">Your decision</label>
   <textarea id="navigator-message" maxLength={2000} value={message} onChange={event=>setMessage(event.target.value)} required />
   <button disabled={busy||!message.trim()}>{busy?'Thinking…':'Ask Navigator'}</button>
  </form>}
  {error && <p role="alert">{error}</p>}
 </section>;
}
