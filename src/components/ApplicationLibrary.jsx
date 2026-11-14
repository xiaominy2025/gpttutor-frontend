import { useId } from 'react';

const cases = [
  { id: 'groundwater', title: 'Groundwater monitoring', context: 'Los Alamos National Laboratory', question: 'Where should a limited number of monitoring wells go when groundwater flow is uncertain?', art: 'M25 75Q85 51 145 76T275 79M25 91Q94 68 156 95T275 99M25 109Q92 87 148 115T275 114', decision: 'M76 30V106m69-76v85m61-85v77M67 32h18m51 0h18m43 0h18' },
  { id: 'schedule', title: 'Aerospace schedule risk', context: 'Lockheed Martin', question: 'Which tasks deserve contingency time when several delays could push a delivery date?', art: 'M38 36h113M69 57h122M108 78h87M127 99h119', decision: 'M208 26v93m-11-11 11 11 11-11M151 36l40 21m0 0 4 21' },
  { id: 'drilling', title: 'Drill now or wait?', context: 'Oil and gas investment', question: 'Does delaying a drilling investment preserve enough flexibility to justify waiting?', art: 'M40 99l42-69 42 69M61 64h42M53 80h58M82 30v91M123 73h30l50-33m-50 33 50 30', decision: 'M203 40h45m-45 63h45m-12-8 12 8-12 8' },
  { id: 'grid', title: 'Electric-grid reliability', context: 'National Renewable Energy Laboratory', question: 'How much backup capacity would keep the grid reliable across plausible demand and supply conditions?', art: 'M30 104h246M41 88l40-15 44 5 51-39 48 31 43-16M42 100l40-5 43 2 51-19 48 10 43-7', decision: 'M177 43v34m-8-26 8-8 8 8m-8 18-8-8m8 8 8-8' },
  { id: 'mortgage', title: 'Mortgage portfolio risk', context: 'Fannie Mae and AWS', question: 'What reserve would cover plausible portfolio losses when defaults and recoveries vary together?', art: 'M31 105h244M53 105V92h19v13m7 0V75h19v30m7 0V53h19v52m7 0V44h19v61m7 0V65h19v40m7 0V80h19v25m7 0V92h19v13', decision: 'M207 35v72m4-72h39m-13 53h27m-8-7 8 7-8 7' },
  { id: 'drug', title: 'Drug development investment', context: 'Pfizer', question: 'When should a team fund the next trial if clinical results, costs, and timelines are uncertain?', art: 'M32 76h53l48-35m-48 35 48 32m0-67h62l51-19m-51 19 51 23m-113 44h47', decision: 'M118 63h14v14h-14zM177 87h14v14h-14zM200 105h50' },
];

function CaseCover({ item }) {
  const wash = useId();
  return <svg className="engent-case-cover" viewBox="0 0 300 144" fill="none" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <defs><filter id={wash}><feTurbulence baseFrequency=".038" numOctaves="3" seed="5" result="grain" /><feDisplacementMap in="SourceGraphic" in2="grain" scale="9" /></filter></defs>
    <path d="M17 79Q35 27 142 26T278 65Q294 104 223 125T75 126Q23 121 17 79Z" fill="#467FA8" opacity=".12" filter={`url(#${wash})`} />
    <path d="M111 53Q158 24 213 42T259 88Q245 116 174 109T111 53Z" fill="#D9A441" opacity=".18" filter={`url(#${wash})`} />
    <path d={item.art} stroke="#467FA8" strokeWidth="6" opacity=".15" filter={`url(#${wash})`} />
    <path d={item.art} stroke="#467FA8" strokeWidth="2" />
    <path d={item.decision} stroke="#267456" strokeWidth="2.4" />
  </svg>;
}

export default function ApplicationLibrary() {
  return <section id="simulation-applications" className="engent-case-library" aria-labelledby="simulation-applications-title">
    <div className="engent-wrap engent-section">
      <h2 id="simulation-applications-title">Simulation case previews</h2>
      <p>Explore six decision questions from business and engineering. Each preview pairs an industry context with an illustrative scenario.</p>
      <div className="engent-case-grid">
        {cases.map(item => <details key={item.id} id={`case-${item.id}`} className="engent-case">
          <summary>
            <CaseCover item={item} />
            <span className="engent-case-title">{item.title}</span>
            <span className="engent-case-context">{item.context}</span>
            <span className="engent-text-link">Case details</span>
          </summary>
          <div className="engent-case-detail">
            <h3>Illustrative decision</h3><p>{item.question}</p>
            <p>The question is a teaching example. The named organization provides industry context.</p>
            <span className="engent-status">Audio coming soon</span>
          </div>
        </details>)}
      </div>
    </div>
  </section>;
}
