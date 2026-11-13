import { useId } from 'react';

const gold = '#D9A441';
const blue = '#467FA8';
const green = '#267456';
const slate = '#263B43';
const paper = '#FAFAF7';

const clamp = (n) => Math.min(1, Math.max(0, n));

export default function CoachDiagram({ kind, progress = 1, className }) {
  const grain = useId();
  const step = (start, duration = .17) => clamp((progress - start) / duration);
  const reveal = (start) => ({ opacity: step(start) });
  const draw = (start, duration) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - step(start, duration) });
  const labels = (entries) => entries.map(([x, y, label]) => <text key={label} x={x} y={y}>{label}</text>);
  const axes = <path d="M70 37V241H486" stroke={slate} strokeOpacity=".42" />;

  return (
    <svg className={className} viewBox="0 0 530 285" aria-hidden="true" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <filter id={grain} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".037" numOctaves="3" seed="7" result="paperGrain" />
          <feDisplacementMap in="SourceGraphic" in2="paperGrain" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g fill={slate} stroke="none" fontSize="15" fontFamily="inherit">
        {kind === 'process' && <>
          <path d="M112 137H432" fill="none" stroke={slate} strokeOpacity=".4" {...draw(.26,.48)} />
          {[['Objectives',gold,110],['Alternatives',blue,215],['Analysis',blue,320],['Judgment',green,425]].map(([label,color,x],i) =>
            <g key={label} opacity={step(.08+i*.15)} transform={`translate(${x} ${137 + (1-step(.08+i*.15))*22})`}>
              <ellipse rx="44" ry="36" fill={color} opacity=".23" filter={`url(#${grain})`} />
              <circle r="25" stroke={color} strokeWidth="2" fill={paper} />
              <text y="6" textAnchor="middle" fontWeight="700">{i+1}</text>
              <text y="61" textAnchor="middle">{label}</text>
            </g>
          )}
          <path d="M107 221Q266 265 429 221" fill="none" stroke={green} {...draw(.76,.20)} />
        </>}
        {kind === 'forecast' && <>
          {axes}
          {labels([[78,269,'Past demand'],[370,269,'Future demand']])}
          <path d="M76 205Q114 173 145 182T213 144T290 131" fill="none" stroke={blue} strokeWidth="3.5" {...draw(.03,.30)} />
          <path d="M290 131Q365 87 475 45L475 188Q365 145 290 131Z" fill={blue} opacity={step(.42,.32)*.24} filter={`url(#${grain})`} />
          <path d="M290 131Q381 102 475 98" fill="none" stroke={blue} strokeWidth="3" {...draw(.32,.37)} />
          <path d="M290 44V241" stroke={slate} strokeOpacity=".36" strokeDasharray="5 7" />
          <g {...reveal(.72)}><circle cx="475" cy="98" r="7" fill={green} /><text x="369" y="30">Plausible range</text></g>
        </>}
        {kind === 'scenario' && <>
          {labels([[180,60,'Low'],[290,60,'Steady'],[403,60,'High'],[35,125,'Pilot'],[35,203,'Full launch']])}
          <path d="M145 76H491M145 153H491M145 230H491" stroke={slate} strokeOpacity=".2" />
          {[['+8',blue],['+16',blue],['+22',blue],['−12',gold],['+20',blue],['+37',blue]].map(([label,color],i) => {
            const x = 195 + (i%3)*112;
            const y = i<3 ? 119 : 197;
            return <g key={label} {...reveal(.12+i*.11)}>
              <rect x={x-36} y={y-23} width="74" height="44" rx="12" fill={color} opacity=".26" filter={`url(#${grain})`} />
              <text x={x} y={y+5} textAnchor="middle" fontWeight="700">{label}</text>
            </g>;
          })}
          <path d="M153 141H466" fill="none" stroke={green} {...draw(.80,.16)} />
        </>}
        {kind === 'tree' && <>
          <rect x="62" y="122" width="37" height="37" rx="3" fill={gold} fillOpacity=".34" stroke={gold} {...reveal(.03)} />
          <text x="38" y="187">Decision</text>
          <path d="M99 141L233 78M99 141L233 202" stroke={blue} fill="none" {...draw(.16,.26)} />
          <g {...reveal(.32)}>{[78,202].map(y=><circle key={y} cx="249" cy={y} r="15" fill={paper} stroke={blue} />)}<text x="145" y="92">Expand</text><text x="148" y="206">Wait</text></g>
          <path d="M264 78L420 43M264 78L420 112M264 202L420 172M264 202L420 237" stroke={blue} fill="none" {...draw(.42,.30)} />
          <g {...reveal(.63)}>{[[43,'+36'],[112,'−14'],[172,'+12'],[237,'+4']].map(([y,label])=><g key={label}><circle cx="427" cy={y} r="5" fill={blue}/><text x="444" y={y+5}>{label}</text></g>)}</g>
          <path d="M100 141L232 79M266 75L419 44" stroke={green} strokeWidth="4" fill="none" {...draw(.79,.17)} />
        </>}
        {kind === 'simulation' && <>
          {axes}
          {[17,28,50,95,129,160,124,80,46,25,12].map((height,i)=>{
            const h = height*step(.10+Math.abs(i-5)*.065,.42);
            return <rect key={i} x={87+i*34} y={239-h} width="28" height={h} rx="3" fill={i<3?gold:blue} fillOpacity=".65" stroke={i<3?gold:blue} />;
          })}
          <path d="M184 59V241" stroke={gold} strokeDasharray="5 7" {...reveal(.59)} />
          <g {...reveal(.72)}><text x="82" y="272">Downside</text><text x="338" y="272">Simulated profit</text><text x="195" y="71">Target</text><path d="M90 251H179" stroke={green} {...draw(.78,.17)} /></g>
        </>}
        {kind === 'optimization' && <>
          {axes}
          {labels([[75,28,'Staffing'],[377,268,'Capacity']])}
          <path d="M71 74L465 237" stroke={blue} {...draw(.09,.27)} />
          <path d="M135 48L343 240" stroke={blue} {...draw(.28,.27)} />
          <path d="M71 239V74L241 144L343 239Z" fill={blue} opacity={step(.48,.23)*.23} filter={`url(#${grain})`} />
          <path d="M174 195L301 104" stroke={gold} strokeDasharray="5 7" {...reveal(.62)} />
          <g {...reveal(.76)}><circle cx="241" cy="144" r="12" fill={green} fillOpacity=".2" /><circle cx="241" cy="144" r="5" fill={green} /><text x="252" y="175">Feasible option</text></g>
        </>}
      </g>
    </svg>
  );
}
