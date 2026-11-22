import additionalPodcasts from './coachPodcasts.json';

const simulationCases = [
  { seconds: 213, asset: 'simulation/Session_6_Simulation_01_LANL_Uncertainty_and_Monitoring', id: 'groundwater', title: 'Groundwater monitoring', context: 'Los Alamos National Laboratory', question: 'Where should a limited number of monitoring wells go when groundwater flow is uncertain?', art: 'M25 75Q85 51 145 76T275 79M25 91Q94 68 156 95T275 99M25 109Q92 87 148 115T275 114', decision: 'M76 30V106m69-76v85m61-85v77M67 32h18m51 0h18m43 0h18' },
  { seconds: 196, asset: 'simulation/Session_6_Simulation_02_Lockheed_Schedule_Risk', id: 'schedule', title: 'Aerospace schedule risk', context: 'Lockheed Martin', question: 'Which tasks deserve contingency time when several delays could push a delivery date?', art: 'M38 36h113M69 57h122M108 78h87M127 99h119', decision: 'M208 26v93m-11-11 11 11 11-11M151 36l40 21m0 0 4 21' },
  { seconds: 204, asset: 'simulation/Session_6_Simulation_03_Energy_Investment_Real_Options', id: 'drilling', title: 'Drill now or wait?', context: 'Oil and gas investment', question: 'Does delaying a drilling investment preserve enough flexibility to justify waiting?', art: 'M40 99l42-69 42 69M61 64h42M53 80h58M82 30v91M123 73h30l50-33m-50 33 50 30', decision: 'M203 40h45m-45 63h45m-12-8 12 8-12 8' },
  { seconds: 203, asset: 'simulation/Session_6_Simulation_04_NREL_Grid_Reliability', id: 'grid', title: 'Electric-grid reliability', context: 'National Renewable Energy Laboratory', question: 'How much backup capacity would keep the grid reliable across plausible demand and supply conditions?', art: 'M30 104h246M41 88l40-15 44 5 51-39 48 31 43-16M42 100l40-5 43 2 51-19 48 10 43-7', decision: 'M177 43v34m-8-26 8-8 8 8m-8 18-8-8m8 8 8-8' },
  { seconds: 198, asset: 'simulation/Session_6_Simulation_05_FannieMae_AWS_MonteCarlo', id: 'mortgage', title: 'Mortgage portfolio risk', context: 'Fannie Mae and AWS', question: 'What reserve would cover plausible portfolio losses when defaults and recoveries vary together?', art: 'M31 105h244M53 105V92h19v13m7 0V75h19v30m7 0V53h19v52m7 0V44h19v61m7 0V65h19v40m7 0V80h19v25m7 0V92h19v13', decision: 'M207 35v72m4-72h39m-13 53h27m-8-7 8 7-8 7' },
  { seconds: 208, asset: 'simulation/Session_6_Simulation_06_Pfizer_Drug_Development', id: 'drug', title: 'Drug development investment', context: 'Pfizer', question: 'When should a team fund the next trial if clinical results, costs, and timelines are uncertain?', art: 'M32 76h53l48-35m-48 35 48 32m0-67h62l51-19m-51 19 51 23m-113 44h47', decision: 'M118 63h14v14h-14zM177 87h14v14h-14zM200 105h50' },
];

export const podcastCollections = {
  ...additionalPodcasts,
  simulation: { title: 'Simulation', cases: simulationCases },
  optimization: { title: 'Optimization', cases: [
  {
    "id": "episode-1",
    "asset": "optimization/01_American_Airlines",
    "title": "The Seat Worth Saving",
    "context": "American Airlines",
    "seconds": 126,
    "question": "Which seats should an airline reserve for later demand?",
    "art": "M36 90l130-60 24 8-38 38 72 18-12 12-91-12-44 22-18-10 28-23",
    "decision": "M153 75l44-12 25 10"
  },
  {
    "id": "episode-2",
    "asset": "optimization/02_Zara",
    "title": "The Inventory Allocation Puzzle",
    "context": "Zara",
    "seconds": 127,
    "question": "How should limited inventory be allocated across stores?",
    "art": "M40 61h52v42H40zM126 27h45v31h-45zM220 62h44v38h-44zM92 75l35-32m45 0 48 33",
    "decision": "M107 61l19-18m67 12 27 22"
  },
  {
    "id": "episode-3",
    "asset": "optimization/03_UPS",
    "title": "The Million-Mile Decision",
    "context": "UPS",
    "seconds": 123,
    "question": "How can delivery routes meet service constraints while reducing miles?",
    "art": "M35 100h225M58 35v82M120 29v88M190 38v79M246 40v77M37 62h220",
    "decision": "M58 100V62h62v38h70V62h56"
  },
  {
    "id": "episode-4",
    "asset": "optimization/04_Lockheed_Martin_F35_Supply_Chain",
    "title": "The F-35 Supply Chain Puzzle",
    "context": "Lockheed Martin",
    "seconds": 347,
    "question": "Which supply and scheduling bottlenecks should teams address first?",
    "art": "M43 38h96m-96 25h156m-132 25h171m-129 25h137",
    "decision": "M139 38l60 25 39 25m0 0v25"
  },
  {
    "id": "episode-5",
    "asset": "optimization/05_Chevron",
    "title": "The Billion-Dollar Refinery Decision",
    "context": "Chevron",
    "seconds": 121,
    "question": "Which refinery operating plan balances input costs and production constraints?",
    "art": "M40 51h39v55H40zM126 34h40v72h-40zM217 54h39v52h-39zM78 65h48m40 15h51",
    "decision": "M79 89h47m40-33h51"
  },
  {
    "id": "episode-6",
    "asset": "optimization/06_Los_Alamos",
    "title": "Keeping the Grid Running",
    "context": "Los Alamos",
    "seconds": 132,
    "question": "How should generation be scheduled to meet demand within operating limits?",
    "art": "M40 107h223M44 91l49-22 48 11 55-43 58 21M44 103l49-22 48-4 55-15 58 8",
    "decision": "M195 37v25m-8-17 8-8 8 8"
  }
] },

};

const audio = import.meta.glob('../assets/podcasts/**/*.mp3', { eager:true, query:'?url', import:'default' });
const transcripts = import.meta.glob('../assets/podcasts/**/*.txt', { eager:true, query:'?url', import:'default' });

export function podcastAsset(asset, extension) {
  if (!asset) return undefined;
  const files = extension === 'mp3' ? audio : transcripts;
  return files[`../assets/podcasts/${asset}.${extension}`];
}
