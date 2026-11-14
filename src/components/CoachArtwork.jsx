const illustrations = {
  process: <><path d="M60 63H200" stroke="#879793"/>{[[60,'#D9A441'],[130,'#467FA8'],[200,'#267456']].map(([x,color]) => <g key={x}><ellipse cx={x} cy="63" rx="26" ry="19" fill={color} opacity=".17" /><circle cx={x} cy="63" r="11" stroke={color} fill="#FAFAF7" /><circle cx={x} cy="63" r="3" fill={color} /></g>)}</>,
  forecast: <><path d="M40 96V26M40 96H222" stroke="#879793" /><path d="M126 63Q167 42 213 28V78Q172 68 126 63Z" fill="#467FA8" opacity=".20" /><path d="M45 82l24-12 17 4 20-18 20 7" stroke="#467FA8" /><path d="M126 63Q166 57 213 50" stroke="#467FA8" strokeDasharray="4 3" /></>,
  scenario: <><path d="M46 45H215M46 75H215M46 103H215" stroke="#879793" opacity=".45" />{[8,16,22,-12,20,37].map((value,i) => <path key={value} d={`M${60 + i%3*55} ${58 + Math.floor(i/3)*31}h${value}`} stroke={value < 0 ? '#AA3939' : '#267456'} strokeWidth="5" />)}</>,
  tree: <><path d="M60 62L124 38M60 62L124 86M136 38L205 21M136 38L205 53" stroke="#267456" /><path d="M60 62L124 86M136 86L205 75M136 86L205 107" stroke="#467FA8" /><rect x="46" y="55" width="14" height="14" fill="#D9A441" fillOpacity=".26" stroke="#D9A441" /><circle cx="130" cy="38" r="6" stroke="#267456" /><circle cx="130" cy="86" r="6" stroke="#467FA8" /></>,
  simulation: <><path d="M42 101H220" stroke="#879793" />{[13,24,40,61,69,56,35,21,9].map((h,i) => <rect key={i} x={49+i*18} y={99-h} width="13" height={h} rx="2" fill="#467FA8" fillOpacity={i<3 ? '.28' : '.56'} stroke="#467FA8" strokeWidth="1" />)}<path d="M99 25V101" stroke="#D9A441" strokeDasharray="4 4" /></>,
  optimization: <><path d="M44 57H216" stroke="#777D7B" strokeWidth="1.2" /><path d="M44 27C75 27 73 22 99 22S131 28 154 28S192 23 216 23" stroke="#D9A441" /><path d="M44 91C75 91 73 45 99 45S131 91 154 91S192 46 216 46" stroke="#467FA8" /><path d="M44 68C75 68 73 77 99 77S131 66 154 66S192 74 216 74" stroke="#65A17C" /></>,
};

export default function CoachArtwork({ kind }) {
  return <svg viewBox="0 0 260 124" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {illustrations[kind]}
  </svg>;
}
