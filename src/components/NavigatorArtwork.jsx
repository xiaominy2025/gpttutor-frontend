import React, {useId, useState} from 'react';
import {PauseIcon, PlayIcon} from '@heroicons/react/24/outline';

const outlines = [
 'M-10 1C-11-4-7-10-1-10C4-11 9-7 10-2C12 4 7 10 2 10C-5 12-10 7-10 1Z',
 'M-9 5C-13 0-9-7-4-9C1-12 9-9 10-3C12 2 10 7 5 9C0 12-6 10-9 5Z',
 'M-10-2C-8-8-5-10 1-10C7-10 10-5 10 0C11 5 6 9 1 10C-6 10-12 5-10-2Z',
 'M-9-5C-6-10-2-11 4-9C11-7 12-1 8 5C6 10 0 12-5 9C-11 7-12 1-9-5Z',
 'M-11 0C-12-5-6-9-1-9C4-11 10-7 10-1C10 4 6 10 0 11C-6 11-11 6-11 0Z',
];

// Each mark specifies its scattered position, grouped position, scale, and tilt.
const clusters = [
 {label:'Objectives', ink:'#916922', paint:'#D9A441', labelX:90, labelY:145, marks:[
  [35,30,63,54,1.14,-17],[228,28,85,48,1.25,8],[343,51,101,57,1.04,25],
  [113,116,58,85,1.45,11],[388,126,82,79,1.65,-24],[172,103,109,81,1.36,31],
  [281,114,76,98,.94,-33],[71,78,96,104,1.08,6],[306,47,121,100,.81,16],
  [191,62,71,69,.68,-19],[212,123,53,105,.65,28],
 ]},
 {label:'Analysis', ink:'#385E79', paint:'#467FA8', labelX:211, labelY:135, marks:[
  [78,29,178,47,1.33,20],[314,100,196,37,.91,-13],[159,48,216,46,1.52,8],
  [62,104,234,52,1.04,-17],[327,74,186,67,1.21,13],[245,132,211,71,1.62,-18],
  [271,29,244,74,1.36,31],[35,126,193,93,1.01,24],[374,85,220,91,.9,-12],
  [139,78,231,103,.69,12],[101,56,170,81,.64,-26],
 ]},
 {label:'Human Judgment', ink:'#36634E', paint:'#568967', labelX:333, labelY:150, marks:[
  [46,54,311,55,1.06,-15],[247,53,331,54,1.32,17],[351,117,354,62,1.06,-23],
  [185,131,300,81,1.36,26],[385,34,327,79,1.61,-11],[131,30,351,87,1.47,9],
  [199,84,370,92,.83,31],[301,21,318,100,1.15,-26],[91,127,342,111,1.05,13],
  [267,78,302,113,.67,-24],[229,97,362,111,.68,22],
 ]},
];

export default function NavigatorArtwork() {
 const titleId=useId();
 const [paused,setPaused]=useState(false);
 const PlaybackIcon=paused?PlayIcon:PauseIcon;
 return <div className="navigator-art" data-paused={paused}>
  <svg viewBox="0 0 420 170" role="img" aria-labelledby={titleId}>
   <title id={titleId}>Scattered watercolor marks gather into Objectives, Analysis, and Human Judgment.</title>
   {clusters.map(({label,ink,paint,labelX,labelY,marks})=><g key={label}>
    {marks.map(([x,y,groupX,groupY,scale,tilt],index)=>{
     const shape=outlines[(index+Math.floor(groupX/10))%outlines.length];
     return <g key={index} transform={`translate(${groupX} ${groupY})`}>
      <g className="navigator-art-mark" style={{'--scatter-x':`${x-groupX}px`,'--scatter-y':`${y-groupY}px`,'--scatter-tilt':`${tilt*.8}deg`}}>
       <g transform={`rotate(${tilt}) scale(${scale})`}>
        <path d={shape} fill={paint} fillOpacity={index%3===0?.29:.23} stroke={ink} strokeOpacity=".72" strokeWidth=".74" />
        <path d={outlines[(index+2)%outlines.length]} transform="translate(-1 1) scale(.83 .79)" fill={paint} fillOpacity=".15" />
        <path d="M-8 3Q-10-3-4-7M2 9Q6 8 8 4" fill="none" stroke={ink} strokeOpacity=".42" strokeWidth=".49" strokeLinecap="round" />
       </g>
      </g>
     </g>;
    })}
    <text className="navigator-art-label" x={labelX} y={labelY} fill={ink} textAnchor="middle">{label}</text>
   </g>)}
  </svg>
  <button type="button" className="navigator-art-playback" onClick={()=>setPaused(value=>!value)}
   aria-label={paused?'Play illustration':'Pause illustration'}>
   <PlaybackIcon aria-hidden="true" />
  </button>
 </div>;
}
