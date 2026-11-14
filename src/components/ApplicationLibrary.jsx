import { useEffect, useId, useRef, useState } from 'react';
import { podcastAsset } from './podcastCollections';

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

function EpisodeMedia({ episode }) {
  const player = useRef(null);
  const [transcript, setTranscript] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showText, setShowText] = useState(false);
  const recording = podcastAsset(episode.asset, 'mp3');
  const script = podcastAsset(episode.asset, 'txt');
  useEffect(() => {
    const audio = player.current;
    return () => audio?.pause();
  }, []);
  useEffect(() => {
    if (!showText || !script) return;
    const abort = new AbortController();
    fetch(script, { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error('Transcript unavailable');
      return response.text();
    }).then(setTranscript).catch(error => {
      if (error.name !== 'AbortError') setFailed(true);
    });
    return () => abort.abort();
  }, [showText, script]);

  if (!recording) return <span className="engent-status">Audio coming soon</span>;
  return <div className="engent-episode-media">
    <audio ref={player} controls preload="none" src={recording} aria-label={`Listen to ${episode.title}`} />
    <label>Playback speed <select defaultValue="1" onChange={event => { player.current.playbackRate = Number(event.target.value); }}>
      {[.75,1,1.25,1.5,2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}
    </select></label>
    {script && <details onToggle={event => setShowText(event.currentTarget.open)}>
      <summary>Transcript</summary>
      <div className="engent-transcript">{transcript ?? (failed ? 'Transcript unavailable.' : 'Loading transcript…')}</div>
    </details>}
  </div>;
}

function episodeDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function ApplicationLibrary({ title, cases, isProcess }) {
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const selected = cases.find(item => item.id === selectedId);
  return <section id="simulation-applications" className="engent-case-library" aria-labelledby="simulation-applications-title">
    <div className="engent-wrap engent-section">
      <h1 id="simulation-applications-title">{title} Business Case Podcasts</h1>
      <p>Systematic decision-making in action.</p>
      <div className="engent-case-selection">
        <article className="engent-case-detail" id="case-preview" aria-live="polite">
          <div className="engent-selected-episode">
            {selected.art && <CaseCover item={selected} />}
            <div>
              <h2>{selected.title}</h2>
              {selected.context && <p>{selected.context}</p>}
              <p><strong>Illustrative decision:</strong> {selected.question}</p>
            </div>
          </div>
          <EpisodeMedia key={selected.id} episode={selected} />
          <p>{isProcess ? 'These strategy stories illustrate systematic decision-making. The questions are teaching examples, not reconstructions of company decisions.' : 'The question is a teaching example. The industry context is shown above.'}</p>
        </article>
        <section aria-labelledby="simulation-episodes-title">
          <h2 id="simulation-episodes-title">All Episodes</h2>
          <div className="engent-case-episodes" aria-labelledby="simulation-episodes-title" role="group">
            {cases.map((item, index) => <button type="button" key={item.id} aria-controls="case-preview" aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
              <span className="engent-episode-number" aria-hidden="true">{index + 1}</span>
              <span><span className="engent-case-title">{item.title}</span>{item.context && <span className="engent-case-context">{item.context}</span>}</span>
              <span className="engent-episode-affordance">{item.seconds ? episodeDuration(item.seconds) : 'Coming soon'}{item.id === selectedId && <small aria-hidden="true">Selected</small>}</span>
            </button>)}
          </div>
        </section>
      </div>
    </div>
  </section>;
}
