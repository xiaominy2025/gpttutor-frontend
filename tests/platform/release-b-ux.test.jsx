import React from 'react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,fireEvent,waitFor} from '@testing-library/react';
import Header from '../../src/shared/EngentHeader';
import Access,{signInReturnIntent} from '../../src/components/ReleaseBAccess';
beforeEach(()=>{vi.stubGlobal('location',new URL('http://localhost:3000/'));});
function go(path){const u=new URL(path,'http://localhost:3000');location.href=u.href;}
const response=x=>({ok:true,json:async()=>x});
function fixture(account={signedIn:false}){
 const fetch=vi.fn(async(u,o)=>o?.method?response({ok:true,scope:u.endsWith('/cancel')?'pending-signin-cancelled':'participating-browser'}):response(account));
 vi.stubGlobal('fetch',fetch);
 const view=render(<><Header logoUrl="/fixture.png" status={account.signedIn?'Student':'Guest'}><Access/></Header><button>Outside</button></>);
 return {...view,fetch,menu:()=>view.container.querySelector('.euh-menu'),summary:()=>view.container.querySelector('.euh-menu > summary')};
}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('Guest closes immediately, restores focus, and sends no mutation',async()=>{
 const x=fixture();await waitFor(()=>expect(x.fetch).toHaveBeenCalled());fireEvent.click(x.summary());fireEvent.click(screen.getByRole('button',{name:'Continue as Guest'}));expect(x.menu().open).toBe(false);expect(document.activeElement).toBe(x.summary());expect(screen.queryByText('Account options')).toBeNull();expect(x.fetch.mock.calls.every(([,o])=>!o?.method)).toBe(true);
 fireEvent.click(x.summary());expect(screen.getByRole('button',{name:'Continue as Guest'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Continue as Guest'}));expect(x.menu().open).toBe(false);
});
it('native toggle, outside pointer and Escape dismiss with correct focus behavior',()=>{
 const x=fixture();fireEvent.click(x.summary());expect(x.menu().open).toBe(true);const outside=screen.getByRole('button',{name:'Outside'});outside.focus();fireEvent.pointerDown(outside);expect(x.menu().open).toBe(false);expect(document.activeElement).toBe(outside);
 fireEvent.click(x.summary());fireEvent.click(x.summary());expect(x.menu().open).toBe(false);fireEvent.click(x.summary());fireEvent.keyDown(screen.getByRole('button',{name:'Continue as Guest'}),{key:'Escape'});expect(x.menu().open).toBe(false);expect(document.activeElement).toBe(x.summary());
});
it('Tree email entry immediately opens and focuses form without sending mail',async()=>{
 go('/explore?entry=email&return=tree');const x=fixture();expect(x.menu().open).toBe(true);expect(document.activeElement).toBe(screen.getByRole('textbox',{name:'Email'}));await waitFor(()=>expect(x.fetch).toHaveBeenCalled());expect(x.fetch.mock.calls.every(([u,o])=>u==='/api/platform/session'&&!o?.method)).toBe(true);
 fireEvent.keyDown(document.activeElement,{key:'Escape'});expect(x.menu().open).toBe(false);
});
it('successful sign-out closes in place, broadcasts revocation and updates Guest',async()=>{
 go('/explore/tree/cases');const messages=[];vi.stubGlobal('BroadcastChannel',class{postMessage(x){messages.push(x);}close(){}});
 const x=fixture({signedIn:true,emailBridge:true,entitlements:{tree:{advanced:false}}});await waitFor(()=>expect(x.container.textContent).toContain('Decision Tree access: Student'));fireEvent.click(x.summary());x.fetch.mockImplementation(async(u,o)=>o?.method?response({ok:true,scope:'participating-browser'}):response({signedIn:false}));fireEvent.click(screen.getByRole('button',{name:'Sign out of Engent Labs'}));await waitFor(()=>expect(x.menu().open).toBe(false));expect(location.pathname).toBe('/explore/tree/cases');expect(messages).toEqual(['revoked']);fireEvent.click(x.summary());expect(screen.getByRole('button',{name:'Continue as Guest'})).toBeTruthy();expect(x.fetch.mock.calls.some(([u,o])=>u==='/api/platform/logout'&&o.method==='POST')).toBe(true);
});
it('failed/incomplete logout retains authenticated view and visible error',async()=>{
 const x=fixture({signedIn:true,emailBridge:true,entitlements:{tree:{advanced:true}}});await screen.findByRole('button',{name:'Sign out of Engent Labs'});fireEvent.click(x.summary());x.fetch.mockImplementation(async()=>response({ok:true,scope:'wrong'}));fireEvent.click(screen.getByRole('button',{name:'Sign out of Engent Labs'}));await screen.findByRole('alert');expect(x.menu().open).toBe(true);expect(screen.queryByRole('button',{name:'Continue as Guest'})).toBeNull();expect(location.pathname).toBe('/');
});
it('dismissing pending sign-in does not cancel it; explicit Guest cancellation closes it',async()=>{
 const x=fixture({signedIn:false,pendingSignIn:true});fireEvent.click(x.summary());await screen.findByRole('button',{name:'Finish sign-in'});fireEvent.pointerDown(screen.getByRole('button',{name:'Outside'}));expect(x.fetch.mock.calls.every(([,o])=>!o?.method)).toBe(true);fireEvent.click(x.summary());fireEvent.click(screen.getByRole('button',{name:'Continue as Guest'}));await waitFor(()=>expect(x.menu().open).toBe(false));expect(x.fetch.mock.calls.filter(([u])=>u.endsWith('/cancel'))).toHaveLength(1);
});
const origins=[['/','', 'home'],['/engent-alpha/','', 'home'],['/explore','', 'explore'],['/explore/','', 'explore'],['/explore','?entry=email&return=tree','tree'],...['process','forecast','scenario','tree','simulation','optimization'].map(x=>['/explore/'+x+'/cases','', 'cases:'+x])];
it.each(origins)('pending completion preserves allowlisted origin %s %s',async(path,search,intent)=>{
 go(path+search);const submit=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{});const x=fixture({signedIn:false,pendingSignIn:true});if(!x.menu().open)fireEvent.click(x.summary());fireEvent.click(await screen.findByRole('button',{name:'Finish sign-in'}));expect(submit).toHaveBeenCalledOnce();const form=document.body.querySelector('form[action$="/api/shared/email/login"]');expect(form.method).toBe('post');expect(form.querySelector('[name=returnTo]').value).toBe(intent);form.remove();
});
it('does not accept an arbitrary redirect URL',()=>{expect(signInReturnIntent('/explore','?return=https://evil.test/')).toBe('explore');expect(signInReturnIntent('/explore/tree/cases/')).toBe('cases:tree');});
it('failed code requires an explicit new request and retains Tree return intent',async()=>{
 go('/explore?entry=email&return=tree');let finishes=0,starts=0;const x=fixture();x.fetch.mockImplementation(async(u,o)=>{if(u.endsWith('/session'))return response({signedIn:false});if(u.endsWith('/bootstrap'))return response({csrf:'x'.repeat(43)});if(u.endsWith('/start')){starts++;return response({codeSent:true});}if(u.endsWith('/finish')){finishes++;return finishes===1?{ok:false,status:401}:response({needsHandoff:true});}throw Error('Unexpected request');});
 const submit=vi.spyOn(HTMLFormElement.prototype,'submit').mockImplementation(()=>{});fireEvent.change(screen.getByRole('textbox',{name:'Email'}),{target:{value:'synthetic@example.test'}});
 for(let n=0;n<2;n++){fireEvent.click(screen.getByRole('button',{name:'Send sign-in code'}));fireEvent.change(await screen.findByRole('textbox',{name:'Email code'}),{target:{value:'000000'}});fireEvent.click(screen.getByRole('button',{name:'Verify and sign in'}));if(n===0){await screen.findByRole('alert');expect(starts).toBe(1);}else await waitFor(()=>expect(submit).toHaveBeenCalledOnce());}
 const form=document.body.querySelector('form[action$="/api/shared/email/login"]');expect(form.querySelector('[name=returnTo]').value).toBe('tree');form.remove();expect(starts).toBe(2);
});

it('opens email entry when navigation updates query on an already mounted header',async()=>{
 const x=fixture();await waitFor(()=>expect(x.fetch).toHaveBeenCalled());go('/explore?entry=email&return=tree');x.rerender(<><Header logoUrl="/fixture.png" status="Guest"><Access entryRequest="/explore?entry=email&return=tree"/></Header><button>Outside</button></>);expect(x.container.querySelector('.euh-menu').open).toBe(true);expect(document.activeElement).toBe(screen.getByRole('textbox',{name:'Email'}));
});
it('incomplete pending cancellation keeps confirmation visible and does not claim Guest completion',async()=>{
 const x=fixture({signedIn:false,pendingSignIn:true});fireEvent.click(x.summary());await screen.findByRole('button',{name:'Finish sign-in'});x.fetch.mockImplementation(async()=>response({ok:true,scope:'wrong'}));fireEvent.click(screen.getByRole('button',{name:'Continue as Guest'}));await screen.findByRole('alert');expect(x.menu().open).toBe(true);expect(screen.getByRole('button',{name:'Finish sign-in'})).toBeTruthy();
});
