import { useEffect, useId, useRef, useState } from 'react';
import { podcastAsset } from './podcastCollections';
import MediaProgress from './MediaProgress';

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
  const speedPicker = useRef(null);
  const speedLabel = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playbackError, setPlaybackError] = useState('');
  const [transcript, setTranscript] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showText, setShowText] = useState(false);
  const [timing, setTiming] = useState({ elapsed: 0, total: episode.seconds || 0, buffered: 0 });
  const recording = podcastAsset(episode.asset, 'mp3');
  const script = podcastAsset(episode.asset, 'txt');
  function updateTiming({ currentTarget: audio }) {
    const buffered = audio.buffered;
    setTiming({
      elapsed: audio.currentTime,
      total: Number.isFinite(audio.duration) ? audio.duration : episode.seconds,
      buffered: buffered.length ? buffered.end(buffered.length - 1) : 0,
    });
  }
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
    <audio ref={player} preload="none" src={recording} muted={muted}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => setPlaybackError('This recording could not be loaded.')}
      onTimeUpdate={updateTiming} onDurationChange={updateTiming} onProgress={updateTiming} />
    <div className="engent-audio-toolbar" role="group" aria-label={`Playback for ${episode.title}`}>
      <button type="button" className="engent-audio-play" aria-label={playing ? 'Pause episode' : 'Play episode'}
        onClick={() => {
          const audio = player.current;
          if (!audio.paused) audio.pause();
          else {
            setPlaybackError('');
            audio.play().catch(() => setPlaybackError('This recording could not be played.'));
          }
        }}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span></button>
      <MediaProgress {...timing} label="Episode position" disabled={!timing.total}
        aria-valuetext={`${episodeDuration(Math.floor(timing.elapsed))} of ${episodeDuration(Math.floor(timing.total))}`}
        onChange={event => {
          const elapsed = Number(event.target.value);
          player.current.currentTime = elapsed;
          setTiming(current => ({ ...current, elapsed }));
        }} />
      <span className="engent-audio-time" aria-hidden="true">{episodeDuration(Math.floor(timing.elapsed))} / {episodeDuration(Math.floor(timing.total))}</span>
      <button type="button" className="engent-audio-volume" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(value => !value)}>
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 9h4l5-4v14l-5-4H3z" />
          {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 8q4 4 0 8m3-11q6 7 0 14" />}
        </svg>
      </button>
      <details className="engent-speed-picker" ref={speedPicker} onKeyDown={event => {
        if (event.key === 'Escape' && speedPicker.current.open) {
          speedPicker.current.open = false;
          speedLabel.current.focus();
        }
      }}>
        <summary ref={speedLabel} aria-label={`Playback speed, ${speed}×`}>{speed}×</summary>
        <div className="engent-speed-options" role="group" aria-label="Playback speeds">
          {[.75,1,1.25,1.5,2].map(rate => <button key={rate} type="button" aria-pressed={rate === speed} onClick={() => {
            player.current.playbackRate = rate;
            setSpeed(rate);
            speedPicker.current.open = false;
            speedLabel.current.focus();
          }}>{rate}×</button>)}
        </div>
      </details>
    </div>
    {playbackError && <p role="status">{playbackError}</p>}
    {script && <details onToggle={event => setShowText(event.currentTarget.open)}>
      <summary>Transcript</summary>
      <div className="engent-transcript">{transcript ?? (failed ? 'Transcript unavailable.' : 'Loading transcript…')}</div>
    </details>}
  </div>;
}

function episodeDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const optimizationSources = {
  'episode-1': 'https://pubsonline.informs.org/doi/10.1287/inte.22.1.8',
  'episode-2': 'https://pubsonline.informs.org/doi/10.1287/inte.1090.0472',
  'episode-3': 'https://ops-dr.fhwa.dot.gov/publications/fhwahop19015/2018summary24.htm',
  'episode-5': 'https://pubsonline.informs.org/doi/10.1287/inte.2013.0727',
};

export default function ApplicationLibrary({ title, cases, coachId }) {
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const selected = cases.find(item => item.id === selectedId);
  const illustrative = coachId === 'simulation' || !selected.asset;
  const source = coachId === 'optimization' ? optimizationSources[selected.id] : undefined;
  const classification = illustrative ? 'Illustrative scenario'
    : source ? 'Documented Business Case'
      : coachId === 'process' ? 'Business Strategy Analysis' : 'Research case';
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
              <p><span className="engent-status">{classification}</span> {selected.question}</p>
            </div>
          </div>
          <EpisodeMedia key={selected.id} episode={selected} />
          {illustrative && selected.context && <details className="engent-episode-notes">
            <summary>Episode notes</summary>
            <p>This scenario illustrates a decision-making challenge in the industry. It does not represent a documented decision by the named organization.</p>
          </details>}
          {source && <details className="engent-episode-notes">
            <summary>Episode notes</summary>
            <a className="engent-text-link" href={source}>Read the published case</a>
          </details>}
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
        <p className="engent-collection-note">Based on public sources. Not reviewed or endorsed by the organizations mentioned.</p>
      </div>
    </div>
  </section>;
}
