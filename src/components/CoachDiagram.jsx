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
    <svg className={className} viewBox={['forecast', 'simulation', 'optimization'].includes(kind) ? '0 0 530 326' : '0 0 530 285'} aria-hidden="true" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <filter id={grain} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".037" numOctaves="3" seed="7" result="paperGrain" />
          <feDisplacementMap in="SourceGraphic" in2="paperGrain" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g className="coach-pencil" fill="none" stroke="none" fontSize="15" fontFamily="inherit" color={slate}>
        {kind === 'process' && <>
          <path d="M104 137Q262 133 426 137" stroke={slate} strokeOpacity=".4" {...draw(.22,.5)} />
          {[['Objectives',gold,105],['Analysis',blue,265],['Human Judgment',green,425]].map(([label,color,x],i) =>
            <g key={label} opacity={step(.08+i*.22)} transform={`translate(${x} ${137 + (1-step(.08+i*.22))*22})`}>
              <path d="M-62 1Q-53-33-9-35Q32-43 58-15Q69 9 42 27Q7 44-30 30Q-66 23-62 1Z" fill={color} opacity=".24" filter={`url(#${grain})`} />
              <path d="M-37-19Q4-40 35-17M-32 26Q3 41 38 18" stroke={color} strokeOpacity=".43" strokeWidth="1" />
              <circle r="25" stroke={color} strokeWidth="2" fill={paper} />
              <text y="6" textAnchor="middle" fontWeight="700">{i+1}</text>
              <text y="61" textAnchor="middle">{label}</text>
            </g>
          )}
        </>}
        {kind === 'forecast' && <>
          {axes}
          {labels([[78,269,'Historical observations'],[342,269,'Projected forecast']])}
          <path d="M76 205Q114 173 145 182T213 144T290 131" fill="none" stroke={blue} strokeWidth="3.5" {...draw(.03,.30)} />
          <path d="M290 131Q365 87 475 45L475 188Q365 145 290 131Z" fill={blue} opacity={step(.42,.32)*.24} filter={`url(#${grain})`} />
          <path d="M290 131Q381 102 475 98" stroke={blue} strokeWidth="5" strokeOpacity=".16" {...draw(.32,.37)} />
          <path d="M290 131Q381 102 475 98" stroke={blue} strokeWidth="2" strokeOpacity=".88" {...draw(.32,.37)} />
          <g fill={blue} {...reveal(.33)}>
            <circle cx="76" cy="205" r="4"/><circle cx="145" cy="182" r="4"/><circle cx="213" cy="144" r="4"/><circle cx="290" cy="131" r="4"/>
          </g>
          <path d="M290 44V241" stroke={slate} strokeOpacity=".36" strokeDasharray="5 7" />
          <g {...reveal(.72)}><text x="363" y="30">Uncertainty range</text><text x="327" y="123">Central forecast</text></g>
        </>}
        {kind === 'scenario' && <>
          <text x="35" y="26" fontWeight="700">Illustrative profit units</text>
          {labels([[154,60,'Worst-case'],[267,60,'Most likely'],[387,60,'Best-case'],[35,125,'Pilot'],[35,203,'Full launch']])}
          <path d="M145 76H491M145 153H491M145 230H491" stroke={slate} strokeOpacity=".2" />
          {[8,16,22,-12,20,37].map((value,i) => {
            const x = 195 + (i%3)*112;
            const y = i<3 ? 119 : 197;
            const width = Math.abs(value) * 1.55;
            const zero = x - 15;
            const start = value < 0 ? zero - width : zero;
            return <g key={value} {...reveal(.12+i*.11)}>
              <text x={x} y={y-6} textAnchor="middle" fontWeight="700">{value < 0 ? '−' : '+'}{Math.abs(value)}</text>
              <rect x={start} y={y+3} width={width} height="9" rx="2" fill={value < 0 ? slate : blue} fillOpacity=".24" filter={`url(#${grain})`} />
              <path d={`M${start} ${y+8}h${width}`} stroke={value < 0 ? slate : blue} />
              <path d={`M${zero} ${y+1}v14`} stroke={slate} strokeWidth="1" />
            </g>;
          })}
        </>}
        {kind === 'tree' && <>
          <rect x="62" y="122" width="37" height="37" rx="3" fill={gold} fillOpacity=".34" stroke={gold} {...reveal(.03)} />
          <text x="38" y="187">Decision</text>
          <path d="M99 141L233 78M99 141L233 202" stroke={blue} fill="none" {...draw(.16,.26)} />
          <path d="M103 144Q161 115 228 83M103 138Q164 167 229 197" stroke={blue} strokeWidth="1" strokeOpacity=".23" {...draw(.16,.26)} />
          <g {...reveal(.32)}>{[78,202].map(y=><g key={y}>
            <ellipse cx="249" cy={y} rx="22" ry="19" fill={blue} opacity=".19" filter={`url(#${grain})`} />
            <circle cx="249" cy={y} r="15" fill={paper} stroke={blue} />
          </g>)}<text x="145" y="92">Expand</text><text x="148" y="206">Wait</text></g>
          <path d="M264 78L420 43M264 78L420 112M264 202L420 172M264 202L420 237" stroke={blue} fill="none" {...draw(.42,.30)} />
          <path d="M270 81Q341 63 415 47M270 76Q340 95 415 108M270 205Q344 189 415 176M270 200Q343 217 415 233" stroke={blue} strokeWidth="1" strokeOpacity=".23" {...draw(.42,.30)} />
          <g {...reveal(.63)}>
            {labels([[324,51,'70%'],[324,116,'30%'],[324,173,'60%'],[324,237,'40%']])}
            {[[43,'+36'],[112,'−14'],[172,'+12'],[237,'+4']].map(([y,label])=><g key={label}><circle cx="427" cy={y} r="5" fill={blue}/><text x="444" y={y+5}>{label}</text></g>)}
          </g>
          <path d="M100 141L232 79M266 75L419 44" stroke={green} strokeWidth="4" fill="none" {...draw(.79,.17)} />
          <text x="320" y="24" style={{color:green}} {...reveal(.79)}>Sample path</text>
        </>}
        {kind === 'simulation' && <>
          {axes}
          <text x="58" y="174" transform="rotate(-90 58 174)">Frequency</text>
          {[17,28,50,95,129,160,124,80,46,25,12].map((height,i)=>{
            const h = height*step(.10+Math.abs(i-5)*.065,.42);
            return <rect key={i} x={87+i*34} y={239-h} width="28" height={h} rx="3" fill={blue} fillOpacity={i<3 ? '.32' : '.65'} stroke={blue} />;
          })}
          <path d="M184 59V241" stroke={gold} strokeDasharray="5 7" {...reveal(.59)} />
          <g {...reveal(.72)}><text x="82" y="272">Below target</text><text x="338" y="272">Simulated profit</text><text x="195" y="71">Profit target</text><path d="M87 247v5h93v-5" stroke={blue} {...draw(.78,.17)} /></g>
        </>}
        {kind === 'optimization' && <>
          <text x="42" y="20" fontSize="13">Illustrative planning example</text>
          <text x="42" y="46" fontWeight="700">Volume (units)</text>
          <path d="M80 56V130H490M80 182V222H490" stroke={slate} strokeOpacity=".35" />
          {[120,230,340,450].map((x,i) => <g key={x}>
            <path d={`M${x} 56V130m0 52v40`} stroke={slate} strokeOpacity=".13" strokeWidth="1" />
            <text x={x} y="241" textAnchor="middle">Q{i+1}</text>
          </g>)}
          <g {...reveal(.11)}><path d="M178 41h16" stroke={blue} /><text x="201" y="46">Demand</text></g>
          <g {...reveal(.30)}><text x="80" y="153" fontSize="13">Capacity, labor, costs, and inventory balance</text></g>
          <g {...reveal(.11)}><path d="M289 41h16" stroke={green} /><text x="312" y="46">Optimized production plan</text></g>
          <g {...reveal(.11)}>
            <text x="42" y="177" fontWeight="700">Quarterly operating profit ($)</text>
          </g>
          <g clipPath={`url(#${grain}-production-sweep)`}>
            <clipPath id={`${grain}-production-sweep`}>
              <rect x="116" y="51" width={338 * step(.14, .64)} height="172" />
            </clipPath>
            <path d="M120 94C157 94 193 58 230 58S303 98.5 340 98.5S413 71.5 450 71.5" stroke={blue} strokeWidth="6" strokeOpacity=".15" />
            <path d="M120 94C157 94 193 58 230 58S303 98.5 340 98.5S413 71.5 450 71.5" stroke={blue} />
            <path d="M120 80.5C157 80.5 193 71.5 230 71.5S303 85 340 85S413 85 450 85" stroke={green} strokeWidth="6" strokeOpacity=".15" />
            <path d="M120 80.5C157 80.5 193 71.5 230 71.5S303 85 340 85S413 85 450 85" stroke={green} />
            <path d="M120 209C157 209 193 189 230 189S303 213 340 213S413 198 450 198" stroke={gold} strokeWidth="6" strokeOpacity=".19" />
            <path d="M120 209C157 209 193 189 230 189S303 213 340 213S413 198 450 198" stroke={gold} />
          </g>
          <text x="265" y="265" textAnchor="middle" fontWeight="700" {...reveal(.85)}>Maximize Annual Operating Profit</text>
        </>}
      </g>
    </svg>
  );
}
