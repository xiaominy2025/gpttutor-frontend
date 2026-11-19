import React,{useRef} from 'react';
import './EngentHeader.css';
export const ENGENT_HEADER_CONTRACT='1.0.0';
export default function EngentHeader({logoUrl,homeUrl='https://www.engentlabs.com/',pageName,status='Guest',navigation,children}){
 const menu=useRef(null);
 return <header className="engent-universal" data-engent-header={ENGENT_HEADER_CONTRACT}>
  <a className="euh-home" href={homeUrl} aria-label="Engent Labs home"><img src={logoUrl} width="40" height="30" alt=""/><span>Engent Labs</span></a>
  <span className="euh-page">{pageName}</span>
  {navigation&&<nav aria-label="Page navigation" className="euh-nav">{navigation}</nav>}
  <details className="euh-menu" ref={menu} onKeyDown={e=>{if(e.key==='Escape'){menu.current.open=false;menu.current.querySelector('summary')?.focus();}}}>
   <summary aria-label={'Account: '+status}><span role="status" aria-live="polite">{status}</span></summary>
   <div className="euh-account" aria-label="Engent Labs account">{children}</div>
  </details>
 </header>;
}
