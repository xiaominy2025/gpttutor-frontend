import React, {useEffect, useRef, useState} from 'react';

const dimensionLabels={objectives:'Objectives',analysis:'Analysis',judgment:'Human Judgment'};

export default function PlatformAccess({renderHeader=account=>account}) {
 const [account,setAccount]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [navigatorError,setNavigatorError]=useState('');
 const dialog=useRef(null),openButton=useRef(null),log=useRef(null);
 const pending=useRef(false);
 const [followUps,setFollowUps]=useState([]);
 const [message,setMessage]=useState(''),[history,setHistory]=useState([]);
 const [continuation,setContinuation]=useState(null),[done,setDone]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/platform/session',{signal:controller.signal}).then(async response=>{
   if(!response.ok) throw Error('Sign-in is temporarily unavailable.');
   setAccount(await response.json());
  }).catch(error=>{if(error.name!=='AbortError')setError(error.message);});
  return ()=>controller.abort();
 },[]);
 useEffect(()=>{
  const viewport=window.visualViewport;
  if(!viewport)return;
  function fitMobileViewport() {
   const style=dialog.current?.style;
   style?.setProperty('--navigator-visible-height',viewport.height+'px');
   style?.setProperty('--navigator-visible-top',viewport.offsetTop+'px');
  }
  fitMobileViewport();
  viewport.addEventListener('resize',fitMobileViewport);
  viewport.addEventListener('scroll',fitMobileViewport);
  return ()=>{
   viewport.removeEventListener('resize',fitMobileViewport);
   viewport.removeEventListener('scroll',fitMobileViewport);
  };
 },[account?.navigator]);
 function scrollToLatest() {
  if(log.current)log.current.scrollTop=log.current.scrollHeight;
 }
 useEffect(scrollToLatest,[history]);
 async function submitMessage(text,dimension) {
  if(pending.current||busy||done||!text.trim())return;
  pending.current=true;
  setBusy(true);setNavigatorError('');
  try {
   const response=await fetch('/api/platform/navigator',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:text,history,...(continuation?{continuation}:{}),...(dimension?{dimension}:{})})});
   const result=await response.json();
   if(!response.ok) throw Error(result.error);
   setHistory(rows=>[...rows,{role:'user',text},{role:'assistant',text:result.reply}]);
   if(!dimension||result.done)setMessage('');
   setFollowUps(result.followUps??[]);
   setContinuation(result.continuation ?? null);setDone(result.done);
  } catch(error) {setNavigatorError(error.message||'Navigator is temporarily unavailable.');}
  finally {pending.current=false;setBusy(false);}
 }
 function ask(event) {
  event.preventDefault();
  void submitMessage(message);
 }
 function resetDecision() {
  setFollowUps([]);
  setHistory([]);setMessage('');setContinuation(null);setDone(false);setNavigatorError('');
 }
 async function logout() {
  setBusy(true);
  try {
   const response=await fetch('/api/platform/logout',{method:'POST'});
   if(!response.ok) throw Error('Sign-out could not be completed.');
   const result=await response.json();window.location.assign(result.logoutUrl);
  } catch(error) {setError(error.message);setBusy(false);}
 }
 const accountAccess=<section aria-label="Engent Labs account" className="platform-access">
  <p>{account?.signedIn?'Signed in to Engent Labs.':'Browse as a Guest, or sign in with your existing Engent Labs account.'}</p>
  {account?.signedIn?<button type="button" disabled={busy} onClick={logout}>Sign out of this tool</button>
   :<a className="engent-text-link" href="/api/platform/login">Sign in</a>}
  {account?.signedIn && <p><a className="engent-text-link" href={account.treeLoginUrl}>Open Decision Tree Coach with shared sign-in</a></p>}
  {account?.signedIn && <p>Signing out here also ends the shared login session. Other open coach sessions can remain active.</p>}
  {error && <p role="alert">{error}</p>}
 </section>;
 return <>
  {renderHeader(accountAccess)}
  {account?.navigator && <>
   <section className="engent-wrap navigator-intro" aria-labelledby="navigator-intro-title">
    <div>
     <h2 id="navigator-intro-title">AI Navigator</h2>
     <p>Explore what matters, weigh your options, and decide how to approach your decision.</p>
    </div>
    <button type="button" className="engent-button" ref={openButton} aria-haspopup="dialog"
     onClick={()=>{dialog.current.showModal();scrollToLatest();}}>Open Navigator</button>
   <dialog ref={dialog} className="navigator-dialog" aria-labelledby="navigator-title"
    onClose={()=>openButton.current?.focus()}>
    <header className="navigator-dialog-header">
     <h2 id="navigator-title">AI Navigator</h2>
     <button type="button" className="navigator-secondary" onClick={()=>dialog.current.close()}>Close</button>
    </header>
    <form className="navigator-dialog-form" onSubmit={ask}>
     <div role="log" aria-label="Navigator conversation" className="navigator-log" ref={log} tabIndex={history.length?0:-1}>
      {!history.length&&<div className="navigator-welcome">
       <h3>Welcome to AI Navigator</h3>
       <p>Describe a decision you're facing. I'll help you think through it using three perspectives: <strong>Objectives, Analysis, and Human Judgment</strong>.</p>
       <p>After my initial guidance, you can explore up to three follow-up questions or ask your own. The goal is to help you develop a clearer decision-making process—not make the decision for you.</p>
      </div>}
      {history.map((row,index)=><div className={'navigator-message '+row.role} key={index}>
       <strong>{row.role==='user'?'You':'Navigator'}</strong>
       <p>{row.text}</p>
      </div>)}
      {!done&&followUps.length>0&&<div className="navigator-follow-ups" role="group" aria-label="Explore a follow-up path">
       {followUps.map(({dimension,question})=><button type="button" key={dimension} disabled={busy}
        onClick={()=>{log.current?.focus();void submitMessage(question,dimension);}}>
        <strong className={dimension}>{dimensionLabels[dimension]}</strong><span>{question}</span>
       </button>)}
      </div>}
     </div>
     {navigatorError && <p role="alert">{navigatorError}</p>}
     {!done && <>
      <label htmlFor="navigator-message">{history.length?'Your follow-up (optional)':'Your decision'}</label>
      <textarea disabled={busy} id="navigator-message" maxLength={2000} value={message} onChange={event=>setMessage(event.target.value)} required />
     </>}
     <div className="navigator-actions">
      {!done && <button className="engent-button" disabled={busy||!message.trim()}>
       {busy?'Thinking…':history.length?'Continue':'Ask Navigator'}
      </button>}
      {(history.length>0||navigatorError) && <button type="button" className="navigator-secondary" disabled={busy}
       onClick={resetDecision}>Start New Decision</button>}
     </div>
    </form>
   </dialog>
   </section>
  </>}
 </>;
}
