import React from 'react';
import { it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { podcastCollections, podcastAsset } from '../../src/components/podcastCollections';
import CoachLaunchControl from '../../src/components/CoachLaunchControl';
const inventory = JSON.parse(readFileSync('docs/six-coach-podcasts/inventory.json','utf8'));
const baseline = JSON.parse(readFileSync('docs/six-coach-podcasts/baseline-collections.json','utf8'));
it('preserves the complete Simulation/Optimization cases and existing Process media metadata',()=>{
 for(const id of ['simulation','optimization']) expect(podcastCollections[id]).toEqual(baseline[id]);
 for(const row of baseline.process.cases.filter(r=>r.asset)) expect(podcastCollections.process.cases.find(r=>r.asset===row.asset)).toEqual(row);
 expect(podcastCollections.process.cases).toHaveLength(7);
 expect(podcastCollections.process.cases.every(r=>r.asset)).toBe(true);
});
it('maps all six collections to unique existing MP3s and available media URLs',()=>{
 const hashes=[];expect(Object.keys(podcastCollections).sort()).toEqual(['forecast','optimization','process','scenario','simulation','tree']);
 for(const collection of Object.values(podcastCollections)){
  expect(new Set(collection.cases.map(r=>r.id)).size).toBe(collection.cases.length);
  for(const row of collection.cases){const path='src/assets/podcasts/'+row.asset+'.mp3';expect(existsSync(path)).toBe(true);expect(podcastAsset(row.asset,'mp3')).toBeTruthy();expect(row.seconds).toBeGreaterThan(0);hashes.push(createHash('sha256').update(readFileSync(path)).digest('hex'));}
 }
 expect(hashes).toHaveLength(35);expect(new Set(hashes).size).toBe(35);
});
it('uses the ordered playlist subtitles verbatim and invents no missing descriptions',()=>{
 for(const id of ['forecast','scenario','tree']){
  const source=inventory.coaches.find(c=>c.coach===id),rows=podcastCollections[id].cases;
  const file=source.playlistFiles[0].split(/[\\/]/).at(-1);
  const actual=readFileSync('docs/six-coach-podcasts/playlists/'+id+'/'+file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  expect(rows.map(r=>r.context+' — '+r.title)).toEqual(actual);
  expect(rows.every(r=>!r.question)).toBe(true);
  for(const [i,row] of rows.entries()){expect(row.asset.split('/').at(-1)+'.mp3').toBe(source.episodes[i].filename);expect(createHash('sha256').update(readFileSync('src/assets/podcasts/'+row.asset+'.mp3')).digest('hex')).toBe(source.episodes[i].sha256);}
 }
});
it('uses owner-supplied Process titles/descriptions in numbered recording order',()=>{
 const rows=podcastCollections.process.cases;
 expect(rows.map(r=>Number(r.asset.split('/').at(-1).slice(0,2)))).toEqual([1,2,3,4,5,6,7]);
 const supplied=JSON.parse(readFileSync('docs/six-coach-podcasts/process-owner-metadata.json','utf8')).episodes;
 for(const row of supplied) expect(rows.find(r=>r.title===row.title)?.question).toBe(row.description);
});
it('keeps a named icon-only native link and a dismissible tooltip',()=>{
 render(<CoachLaunchControl href="/process/" label="Launch Decision Process Coach"/>);
 const link=screen.getByRole('link',{name:'Launch Decision Process Coach'});expect(link.getAttribute('href')).toBe('/process/');expect(link.textContent).toBe('');
 fireEvent.keyDown(link,{key:'Escape'});expect(link.parentElement.dataset.tooltipDismissed).toBe('true');fireEvent.focus(link);expect(link.parentElement.dataset.tooltipDismissed).toBeUndefined();cleanup();
});

it('preserves native submit behavior for the existing signed-in Tree handoff',()=>{
 let submitted=0;render(<form method="post" action="/api/shared/email/login" onSubmit={e=>{e.preventDefault();submitted++;}}><CoachLaunchControl type="submit" label="Launch Decision Tree Coach"/></form>);
 const control=screen.getByRole('button',{name:'Launch Decision Tree Coach'});expect(control.type).toBe('submit');fireEvent.click(control);expect(submitted).toBe(1);cleanup();
 expect(readFileSync('scripts/build-navigator-alpha.mjs','utf8')).toContain('<form method="post" action={sharedLaunch}><CoachLaunchControl type="submit" label="Launch Decision Tree Coach" /></form>');
});
