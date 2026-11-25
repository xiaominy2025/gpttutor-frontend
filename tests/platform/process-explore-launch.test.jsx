import React from 'react';
import{beforeAll,afterEach,it,expect,vi}from'vitest';
import{render,screen,within,cleanup}from'@testing-library/react';
import{MemoryRouter}from'react-router-dom';
vi.mock('../../src/components/CoachIntro',()=>({default:()=> <div data-testid="preserved-animation"/>}));
vi.mock('../../src/components/CoachArtwork',()=>({default:()=> <div data-testid="preserved-artwork"/>}));
let ExplorePage;
beforeAll(async()=>{vi.stubGlobal('React',React);vi.stubEnv('VITE_VERIFIED_DECISION_TREE_URL','https://d6owpirihdsus.cloudfront.net/');vi.stubEnv('VITE_RELEASE_B_EMAIL_ENABLED','true');({ExplorePage}=await import('../../src/components/Homepage'));});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function explore(enabled,account={signedIn:false}){vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.stubEnv('VITE_PROCESS_COACH_ENABLED',enabled);vi.stubEnv('VITE_FORECAST_COACH_ENABLED','false');vi.stubGlobal('location',new URL('https://d6owpirihdsus.cloudfront.net/explore'));vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>account})));return render(<MemoryRouter initialEntries={['/explore']}><ExplorePage/></MemoryRouter>);}
it('launches Process at its same-origin route without changing Tree or surrounding content',async()=>{const v=explore('true');const process=within(v.container.querySelector('#process')),tree=within(v.container.querySelector('#tree'));const launch=process.getByRole('link',{name:'Launch Decision Process Coach',exact:true});expect(launch.getAttribute('href')).toBe('/process/');expect(launch.className).toBe('engent-launch-control');expect(process.queryByText('Coming Soon')).toBeNull();expect(process.getByText('Make decisions systematically.')).toBeTruthy();expect(process.getByRole('link',{name:'Explore Cases: Decision Process Coach'}).getAttribute('href')).toBe('/explore/process/cases');expect(tree.getByRole('link',{name:'Launch Decision Tree Coach'}).getAttribute('href')).toBe('https://d6owpirihdsus.cloudfront.net/');for(const id of ['forecast','scenario','simulation','optimization'])expect(within(v.container.querySelector('#'+id)).getByText('Coming Soon')).toBeTruthy();expect(screen.getByRole('navigation',{name:'Coaches'}).querySelectorAll('a')).toHaveLength(6);});
it('ordinary and unapproved builds keep Process unavailable by default',()=>{const v=explore('false');expect(within(v.container.querySelector('#process')).getByText('Coming Soon')).toBeTruthy();expect(screen.queryByRole('link',{name:'Launch Decision Process Coach'})).toBeNull();expect(screen.getByRole('link',{name:'Launch Decision Tree Coach'})).toBeTruthy();});

it('enables only the fixed Forecasting workspace when explicitly included in Alpha',()=>{const v=explore('true');vi.stubEnv('VITE_FORECAST_COACH_ENABLED','true');v.rerender(<MemoryRouter initialEntries={['/explore']}><ExplorePage/></MemoryRouter>);const forecast=within(v.container.querySelector('#forecast'));expect(forecast.getByRole('link',{name:'Launch Forecasting Coach'}).getAttribute('href')).toBe('/engent-alpha/forecasting/');expect(forecast.queryByText('Coming Soon')).toBeNull();for(const id of ['scenario','simulation','optimization'])expect(within(v.container.querySelector('#'+id)).getByText('Coming Soon')).toBeTruthy();});

it('uses a cross-host POST for the signed-in Release B Tree handoff',async()=>{
 const url='https://d6owpirihdsus.cloudfront.net/api/shared/email/login';
 const v=explore('true',{signedIn:true,role:'student',emailBridge:true,entitlements:{tree:{advanced:true}},treeLaunchUrl:url});
 const launch=await within(v.container.querySelector('#tree')).findByRole('button',{name:'Launch Decision Tree Coach'});
 expect(launch.type).toBe('submit');expect(launch.closest('form').method).toBe('post');expect(launch.closest('form').getAttribute('action')).toBe(url);
});
it('launches Scenario only at its approved independent path and keeps unfinished coaches unavailable',()=>{
 vi.stubEnv('VITE_SCENARIO_COACH_ENABLED','true');
 const v=explore('true');
 const scenario=within(v.container.querySelector('#scenario'));
 expect(scenario.getByRole('link',{name:'Launch Scenario Analysis Coach'}).getAttribute('href')).toBe('/scenario-analysis/');
 expect(scenario.queryByText('Coming Soon')).toBeNull();
 for(const id of ['simulation','optimization'])expect(within(v.container.querySelector('#'+id)).getByText('Coming Soon')).toBeTruthy();
 vi.stubEnv('VITE_SCENARIO_COACH_ENABLED','false');
});
