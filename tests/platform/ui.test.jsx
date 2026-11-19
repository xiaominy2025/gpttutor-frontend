import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import PlatformAccess from '../../src/components/PlatformAccess';
it('keeps Explore public and handles the optional Guest Navigator without browser tokens',async()=>{
 const original=global.fetch;
 const messages=['How do I think about uncertainty?','How can I clarify what I want to achieve?','What if conditions change?'];
 const paths=[{dimension:'objectives',question:messages[1]},{dimension:'analysis',question:'How can I check my assumptions?'},{dimension:'judgment',question:'How can I revisit my decision?'}];
 const replies=['The options expose you to different risks.\n\nConsider what matters to you.','Your priority is clearer. A reversible option could make the risk easier to manage.','The trade-off is flexibility versus commitment. The final choice depends on your tolerance for risk.'];
 let round=0;
 global.fetch=vi.fn(async(path,options)=>{
  if(path==='/api/platform/session')return {ok:true,json:async()=>({signedIn:false,navigator:true})};
  expect(path).toBe('/api/platform/navigator');
  const request=JSON.parse(options.body);
  expect(request.message).toBe(messages[round]);
  expect(request.history).toHaveLength(round*2);
  expect(request.dimension).toBe(round===1?'objectives':undefined);
  expect(request.continuation).toBe(round?'signed-'+round:undefined);
  const reply=replies[round++];
  return {ok:true,json:async()=>({reply,done:round===3,continuation:round===3?null:'signed-'+round,followUps:round===1?paths:round===2?paths.slice(1):[]})};
 });
 try {
  render(<PlatformAccess/>);
  const open=await screen.findByRole('button',{name:'Open Navigator'});
  const dialog=document.querySelector('dialog');
  dialog.showModal=()=>dialog.setAttribute('open','');
  dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new Event('close'));};
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(open);
  expect(screen.getByRole('dialog',{name:'AI Navigator'})).toBe(dialog);
  expect(screen.getByRole('link',{name:'Sign in'}).getAttribute('href')).toBe('/api/platform/login');
  fireEvent.change(screen.getByLabelText('Your decision'),{target:{value:messages[0]}});
  fireEvent.click(screen.getByRole('button',{name:'Ask Navigator'}));
  await screen.findByRole('textbox',{name:'Your follow-up (optional)'});
  expect(within(dialog).getByRole('log')).toHaveTextContent('The options expose you to different risks.');
  fireEvent.click(within(dialog).getByRole('button',{name:'Close'}));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(open).toHaveFocus();
  fireEvent.click(open);
  expect(within(dialog).getByRole('log')).toHaveTextContent('The options expose you to different risks.');
  const followUps=within(dialog).getByRole('group',{name:'Explore a follow-up path'});
  expect(within(followUps).getAllByRole('button')).toHaveLength(3);
  fireEvent.click(within(followUps).getByRole('button',{name:/^Objectives/}));
  await screen.findByText(replies[1]);
  expect(within(followUps).queryByRole('button',{name:/^Objectives/})).toBeNull();
  expect(within(followUps).getAllByRole('button')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Your follow-up (optional)'),{target:{value:messages[2]}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  await screen.findByText(replies[2]);
  expect(within(dialog).queryByRole('group',{name:'Explore a follow-up path'})).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Start New Decision'}));
  expect(screen.getByLabelText('Your decision').value).toBe('');
 }finally{cleanup();global.fetch=original;}
});
it('shows only the coach-specific shared launch after account verification',async()=>{
 const original=global.fetch;
 global.fetch=vi.fn(async()=>({ok:true,json:async()=>({signedIn:true,navigator:false,treeLoginUrl:'https://alpha.example.test/api/shared/login',entitlements:{tree:{advanced:true}}})}));
 try {
  render(<PlatformAccess/>);
  await screen.findByRole('button',{name:'Sign out of this tool'});
  expect(screen.getByRole('link',{name:'Open Decision Tree Coach with shared sign-in'}).getAttribute('href')).toBe('https://alpha.example.test/api/shared/login');
  expect(screen.queryByRole('heading',{name:'AI Navigator'})).toBeNull();
 }finally{cleanup();global.fetch=original;}
});
