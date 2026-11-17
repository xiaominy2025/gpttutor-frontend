import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import PlatformAccess from '../../src/components/PlatformAccess';
it('keeps Explore public and handles the optional Guest Navigator without browser tokens',async()=>{
 const original=global.fetch;
 global.fetch=vi.fn(async(path,options)=>{
  if(path==='/api/platform/session')return {ok:true,json:async()=>({signedIn:false,navigator:true})};
  expect(path).toBe('/api/platform/navigator');
  expect(JSON.parse(options.body)).toEqual({message:'Which coach helps with uncertainty?',history:[]});
  return {ok:true,json:async()=>({reply:'Decision Tree Coach helps map uncertain paths.'})};
 });
 try {
  render(<PlatformAccess/>);
  await screen.findByRole('heading',{name:'AI Navigator'});
  expect(screen.getByRole('link',{name:'Sign in'}).getAttribute('href')).toBe('/api/platform/login');
  fireEvent.change(screen.getByLabelText('Your decision'),{target:{value:'Which coach helps with uncertainty?'}});
  fireEvent.click(screen.getByRole('button',{name:'Ask Navigator'}));
  await screen.findByText('Decision Tree Coach helps map uncertain paths.');
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
