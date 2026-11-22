import React, {useEffect, useRef, useState} from 'react';
import {ArrowPathIcon, ArrowUpIcon, FlagIcon, MagnifyingGlassIcon, ScaleIcon, XMarkIcon} from '@heroicons/react/24/outline';
import NavigatorArtwork from './NavigatorArtwork';
import './Navigator.css';

const paths={
 objectives:{label:'Objectives',Icon:FlagIcon},
 analysis:{label:'Analysis',Icon:MagnifyingGlassIcon},
 judgment:{label:'Human Judgment',Icon:ScaleIcon}
};

export default function DecisionNavigator() {
 const [busy,setBusy]=useState(false);
 const bootstrapped=useRef(false);
 const [navigatorError,setNavigatorError]=useState('');
 const dialog=useRef(null),openButton=useRef(null),log=useRef(null);
 const pending=useRef(false);
 const [followUps,setFollowUps]=useState([]);
 const [pendingDimension,setPendingDimension]=useState(null);
 const [message,setMessage]=useState(''),[history,setHistory]=useState([]);
 const [continuation,setContinuation]=useState(null),[done,setDone]=useState(false);
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
 },[]);
 function scrollToLatest() {
  if(log.current)log.current.scrollTop=log.current.scrollHeight;
 }
 useEffect(scrollToLatest,[history]);
 async function submitMessage(text,dimension) {
  if(pending.current||busy||done||!text.trim())return;
  pending.current=true;
  setPendingDimension(dimension??null);
  setBusy(true);setNavigatorError('');
  try {
   if(!bootstrapped.current){
    const start=await fetch('/api/platform/navigator/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!start.ok)throw Error('Navigator is temporarily unavailable. Please try later.');
    bootstrapped.current=true;
   }
   const response=await fetch('/api/platform/navigator',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:text,history,...(continuation?{continuation}:{}),...(dimension?{dimension}:{})})});
   const result=await response.json();
   if(!response.ok) throw Error(result.error);
   setHistory(rows=>[...rows,{role:'user',text},{role:'assistant',text:result.reply}]);
   if(!dimension||result.done)setMessage('');
   setFollowUps(result.followUps??[]);
   setContinuation(result.continuation ?? null);setDone(result.done);
  } catch(error) {setNavigatorError(error.message||'Navigator is temporarily unavailable.');}
  finally {pending.current=false;setPendingDimension(null);setBusy(false);}
 }
 function ask(event) {
  event.preventDefault();
  void submitMessage(message);
 }
 function resetDecision() {
  setFollowUps([]);
  setHistory([]);setMessage('');setContinuation(null);setDone(false);setNavigatorError('');
 }
 const sendLabel=history.length?'Send follow-up':'Send decision';
 return (
   <section className="engent-wrap navigator-intro" aria-labelledby="navigator-intro-title">
    <NavigatorArtwork />
    <div className="navigator-intro-copy">
     <h2 id="navigator-intro-title">AI Decision Navigator</h2>
     <p className="navigator-tagline">See the bigger picture before making your decision.</p>
     <p>Describe a decision you're facing. Navigator helps you clarify what matters, recognize what needs analysis, and understand where human judgment comes in—so you can develop a clearer mental map before deciding how to proceed.</p>
     <button type="button" className="engent-button navigator-open" ref={openButton} aria-haspopup="dialog"
      onClick={()=>{dialog.current.showModal();scrollToLatest();}}>Open Decision Navigator</button>
    </div>
   <dialog ref={dialog} className="navigator-dialog" aria-labelledby="navigator-title" aria-describedby="navigator-subtitle"
    onClose={()=>openButton.current?.focus()}>
    <header className="navigator-dialog-header">
     <div>
      <h2 id="navigator-title">AI Decision Navigator</h2>
      <p id="navigator-subtitle">See the bigger picture. Build a clearer mental map of your decision.</p>
     </div>
     <button type="button" className="navigator-icon-action" aria-label="Close Navigator" title="Close Navigator" onClick={()=>dialog.current.close()}><XMarkIcon aria-hidden="true" /></button>
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
       {followUps.map(({dimension,question})=>{
        const {label,Icon}=paths[dimension];
        return <button type="button" key={dimension} disabled={busy} data-pending={pendingDimension===dimension?'true':undefined}
         onClick={()=>{log.current?.focus();void submitMessage(question,dimension);}}>
         <Icon aria-hidden="true" className="navigator-path-icon"/>
         <span><strong className={dimension}>{label}</strong><span>{question}</span></span>
        </button>;
       })}
      </div>}
     </div>
     {navigatorError && <p role="alert">{navigatorError}</p>}
     {!done && <>
      <div className="navigator-composer-heading">
       <label htmlFor="navigator-message">{history.length?'Your follow-up (optional)':'Your decision'}</label>
       <span role="status">{busy?'Thinking…':''}</span>
      </div>
      <div className="navigator-composer">
       <textarea disabled={busy} id="navigator-message" maxLength={2000} value={message} onChange={event=>setMessage(event.target.value)} required />
       <button type="submit" className="navigator-icon-action" aria-label={sendLabel} title={sendLabel} disabled={busy||!message.trim()}>
        <ArrowUpIcon aria-hidden="true" />
       </button>
      </div>
     </>}
     {(history.length>0||navigatorError) && <div className="navigator-actions">
      <button type="button" className="navigator-icon-action" disabled={busy}
       aria-label="Start New Decision" title="Start New Decision" onClick={resetDecision}><ArrowPathIcon aria-hidden="true" /></button>
     </div>}
    </form>
   </dialog>
   </section>
 );
}
