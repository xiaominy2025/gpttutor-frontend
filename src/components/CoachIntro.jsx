import { useEffect, useRef, useState } from 'react';
import CoachDiagram from './CoachDiagram';
import { coaches } from './coaches';
import poster from '../assets/coach-intro-poster.svg';

const sceneSeconds = 9.6;
const duration = Number((coaches.length * sceneSeconds).toFixed(1));
const clamp = (value) => Math.max(0, Math.min(1, value));

function Workspace({ coach, progress, opacity = 1 }) {
  return (
    <div className="coach-workspace" style={{ opacity }}>
      <div className="coach-workspace-heading">
        <strong>{coach.name}</strong>
        <span>{coach.subtitle}</span>
      </div>
      <CoachDiagram kind={coach.id} progress={progress} className="coach-animated-diagram" />
      <div className="coach-guidance">
        <span className="coach-eyebrow">Your Coach</span>
        <p style={{ opacity: clamp(progress * 5 + .15) }}>{coach.question}</p>
        <p style={{ opacity: clamp((progress - .24) * 4) }}>{coach.method}</p>
        <p style={{ opacity: clamp((progress - .60) * 5) }}>{coach.judgment}</p>
      </div>
    </div>
  );
}

export default function CoachIntro({ coach, thumbnail, autoplay = false }) {
  const stage = useRef(null);
  const started = useRef(false);
  const scenes = coach ? [coach] : coaches;
  const total = coach ? sceneSeconds : duration;
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!autoplay || reduced || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        setPlaying(true);
      } else if (!entry.isIntersecting && started.current) setPlaying(false);
    }, { threshold: .45 });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [autoplay, reduced]);

  useEffect(() => {
    if (!playing || reduced) return;
    const start = performance.now() - elapsed * 1000;
    let frame;
    const tick = (now) => {
      const next = Math.max(0, Math.min(total, (now - start) / 1000));
      setElapsed(next);
      if (next < total) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Elapsed is the initial seek position for each playback run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reduced, total]);

  const index = Math.min(scenes.length - 1, Math.floor((elapsed + 1e-8) / sceneSeconds));
  const position = (elapsed - index * sceneSeconds) / sceneSeconds;
  const fadeIn = index > 0 ? clamp(position / .045) : 1;
  const fadeOut = index < scenes.length - 1 ? clamp((1 - position) / .045) : 1;
  const atStart = elapsed === 0 && !playing && (!reduced || !started.current);
  const action = playing ? 'Pause' : elapsed >= total ? 'Replay' : elapsed > 0 ? 'Resume' : coach ? 'Play demo' : 'Play introduction';
  const play = () => {
    started.current = true;
    if (reduced) {
      setElapsed(elapsed ? 0 : coach ? total : .1);
      return;
    }
    if (playing) setPlaying(false);
    else {
      if (elapsed >= total) setElapsed(0);
      setPlaying(true);
    }
  };

  return (
    <div className="coach-player">
      <div className="coach-stage" ref={stage}>
        <div className="coach-media-visual" aria-hidden="true">
          {atStart && (thumbnail ? <div className="coach-thumbnail">{thumbnail}</div> : <img className="coach-poster" src={poster} alt="" width="960" height="540" />)}
          {!atStart && <Workspace coach={scenes[index]} opacity={reduced ? 1 : Math.min(fadeIn, fadeOut)} progress={reduced ? 1 : clamp(position / .87)} />}
        </div>
        {coach && <button type="button" className="coach-overlay" aria-describedby={`${coach.id}-media-description`} aria-label={reduced ? (atStart ? 'Show illustration still' : 'Show poster') : action} onClick={play}>
          <span aria-hidden="true">{playing ? 'Ⅱ' : elapsed >= total ? '↻' : '▶'}</span>
        </button>}
      </div>
      {!coach && <div className="coach-controls">
        {reduced ? <button type="button" onClick={() => { started.current = true; setElapsed(atStart ? .1 : index + 1 < scenes.length ? (index + 1) * sceneSeconds : .1); }}>Next still</button> :
          <button type="button" aria-label={action} title={action} onClick={play}><span aria-hidden="true">{playing ? 'Ⅱ' : elapsed >= total ? '↻' : '▶'}</span></button>}
        <input type="range" aria-label={coach ? 'Demo position' : 'Introduction position'} aria-valuetext={`${Math.floor(elapsed)} seconds, ${scenes[index].name}`} min="0" max={total} step=".1" value={elapsed} onChange={(event) => {
          setPlaying(false);
          started.current = true;
          setElapsed(Number(event.target.value));
        }} />
        <span className="coach-time">{Math.floor(elapsed)}s / {Math.round(total)}s</span>
      </div>}
      {coach ? <p className="sr-only" id={`${coach.id}-media-description`}>{coach.demo} {coach.judgment}</p> : <details className="coach-transcript">
        <summary>Read the scene descriptions</summary>
        <ol>{scenes.map((scene) => <li key={scene.id}><strong>{scene.name}.</strong> {scene.demo} {scene.judgment}</li>)}</ol>
      </details>}
    </div>
  );
}
