import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import DecisionNavigator from '../../src/components/DecisionNavigator';

beforeEach(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function replies(){let turn=0;return vi.fn(async(path,options)=>{
 expect(options.method).toBe('POST');
 if(path==='/api/platform/navigator/session')return{ok:true,json:async()=>({ready:true})};
 expect(path).toBe('/api/platform/navigator');const body=JSON.parse(options.body);turn++;
 expect(body.history).toHaveLength((turn-1)*2);
 if(turn>1)expect(body.continuation).toBe('fixture-'+(turn-1));
 return{ok:true,json:async()=>({reply:'Fixture reasoning '+turn,done:turn===4,continuation:turn===4?null:'fixture-'+turn,followUps:turn===4?[]:[{dimension:'analysis',question:'How can I test an assumption?'}]})};
});}
function open(){render(<MemoryRouter><DecisionNavigator/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Open Decision Navigator'}));}
it('opens anonymously without account lookups, registration, or a paid welcome request',()=>{
 const fetch=replies();vi.stubGlobal('fetch',fetch);open();
 expect(screen.getByRole('heading',{name:'Welcome to AI Navigator'})).toBeTruthy();
 expect(screen.queryByText('Sign in')).toBeNull();expect(fetch).not.toHaveBeenCalled();
 expect(document.querySelectorAll('.navigator-art-mark')).toHaveLength(33);
});
it('uses anonymous bootstrap and preserves the four-interaction continuation contract',async()=>{
 const fetch=replies();vi.stubGlobal('fetch',fetch);open();
 for(let turn=1;turn<=4;turn++){
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Synthetic decision '+turn}});
  fireEvent.click(screen.getByRole('button',{name:turn===1?'Send decision':'Send follow-up'}));
  await screen.findByText('Fixture reasoning '+turn);
 }
 expect(fetch).toHaveBeenCalledTimes(5);expect(screen.queryByRole('textbox')).toBeNull();
 expect(screen.queryByRole('group',{name:'Explore a follow-up path'})).toBeNull();
});
it('preserves draft and transcript when closed, and resets only on explicit restart',async()=>{
 vi.stubGlobal('fetch',replies());open();fireEvent.change(screen.getByRole('textbox'),{target:{value:'Synthetic decision'}});
 fireEvent.click(screen.getByRole('button',{name:'Send decision'}));await screen.findByText('Fixture reasoning 1');
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Unsent follow-up'}});
 fireEvent.click(screen.getByRole('button',{name:'Close Navigator'}));fireEvent.click(screen.getByRole('button',{name:'Open Decision Navigator'}));
 expect(screen.getByRole('textbox').value).toBe('Unsent follow-up');expect(screen.getByText('Fixture reasoning 1')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Start New Decision'}));expect(screen.getByRole('textbox').value).toBe('');expect(screen.queryByText('Fixture reasoning 1')).toBeNull();
});
it('retains a rejected message without automatic retries or another credential flow',async()=>{
 let calls=0;const fetch=vi.fn(async path=>{calls++;return path.endsWith('/session')?{ok:true}:{ok:false,json:async()=>({error:'Navigator limit reached. Please try again later.'})};});vi.stubGlobal('fetch',fetch);open();
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Keep this question'}});fireEvent.click(screen.getByRole('button',{name:'Send decision'}));
 await screen.findByRole('alert');await waitFor(()=>expect(calls).toBe(2));expect(screen.getByRole('textbox').value).toBe('Keep this question');
 expect(screen.getByRole('button',{name:'Send decision'}).disabled).toBe(false);
});
it('guards duplicate submits while anonymous setup is pending',async()=>{
 let finish;const fetch=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));vi.stubGlobal('fetch',fetch);open();
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Synthetic'}});const form=document.querySelector('.navigator-dialog-form');fireEvent.submit(form);fireEvent.submit(form);
 expect(fetch).toHaveBeenCalledTimes(1);finish({ok:false});await screen.findByRole('alert');expect(fetch).toHaveBeenCalledTimes(1);
});
