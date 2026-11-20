import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef} from 'react';
import './EngentHeader.css';
export const ENGENT_HEADER_CONTRACT='1.1.0';
const AccountMenu=createContext({openMenu:()=>{},closeMenu:()=>{}});
export const useEngentAccountMenu=()=>useContext(AccountMenu);
export default function EngentHeader({logoUrl,homeUrl='https://www.engentlabs.com/',pageName,status='Guest',navigation,children}){
 const menu=useRef(null);
 const closeMenu=useCallback(({restoreFocus=true}={})=>{if(!menu.current?.open)return;menu.current.open=false;if(restoreFocus)menu.current.querySelector('summary')?.focus();},[]);
 const openMenu=useCallback(({focusFirst=false}={})=>{if(!menu.current)return;menu.current.open=true;if(focusFirst)menu.current.querySelector('.euh-account input:not(:disabled),.euh-account button:not(:disabled),.euh-account a[href]')?.focus();},[]);
 const controls=useMemo(()=>({openMenu,closeMenu}),[openMenu,closeMenu]);
 useEffect(()=>{const outside=e=>{if(menu.current&&!menu.current.contains(e.target))closeMenu({restoreFocus:false});};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[closeMenu]);
 return <header className="engent-universal" data-engent-header={ENGENT_HEADER_CONTRACT}>
  <a className="euh-home" href={homeUrl} aria-label="Engent Labs home"><img src={logoUrl} width="40" height="30" alt=""/><span>Engent Labs</span></a>
  <span className="euh-page">{pageName}</span>
  {navigation&&<nav aria-label="Page navigation" className="euh-nav">{navigation}</nav>}
  <details className="euh-menu" ref={menu} onKeyDown={e=>{if(e.key==='Escape'&&menu.current?.open){e.preventDefault();closeMenu();}}}>
   <summary aria-label={'Account: '+status}><span role="status" aria-live="polite">{status}</span></summary>
   <div className="euh-account" aria-label="Engent Labs account"><AccountMenu.Provider value={controls}>{children}</AccountMenu.Provider></div>
  </details>
 </header>;
}
