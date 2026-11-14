import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CoachArtwork from './CoachArtwork';
import CoachIntro from './CoachIntro';
import ApplicationLibrary from './ApplicationLibrary';
import { coaches } from './coaches';
import heroArtwork from '../assets/decision-framework.webp';
import './marketing.css';

const logo = '/assets/Engent Labs Transparent.png';
const treeUrl = import.meta.env.VITE_VERIFIED_DECISION_TREE_URL;

function MarketingLayout({ explore, children }) {
  const { hash } = useLocation();
  useEffect(() => {
    document.title = explore ? 'Explore Engent Labs | Interactive Decision Coaches' : 'Engent Labs | Interactive Decision Coaches';
    return () => { document.title = 'Engent Labs | Interactive Decision Coaches'; };
  }, [explore]);
  useEffect(() => {
    const section = hash && document.getElementById(hash.slice(1));
    if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [explore, hash]);

  return <div className="engent-site">
    <a className="engent-skip" href="#engent-main">Skip to content</a>
    <header className="engent-header">
      <div className="engent-wrap engent-header-row">
        <Link to="/" aria-label="Engent Labs home"><img src={logo} alt="Engent Labs" width="152" height="48" /></Link>
        <nav aria-label="Main navigation">
          <Link to="/explore" aria-current={explore ? 'page' : undefined}>Explore Engent Labs</Link>
          <Link to="/labs">Practice Lab <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
    <main id="engent-main" tabIndex={-1}>{children}</main>
    <footer className="engent-footer"><div className="engent-wrap engent-header-row">
      <Link to="/">Engent Labs</Link><span>Interactive Decision Coaches</span>
    </div></footer>
  </div>;
}

function Availability({ coach }) {
  if (coach.id === 'process') return <>
    <span className="engent-status">Legacy Practice Lab available</span>
    <Link to="/labs" className="engent-text-link">Open Practice Lab <span aria-hidden="true">↗</span></Link>
  </>;
  if (coach.id === 'tree' && treeUrl === 'https://decisiontree.engentlabs.com/') {
    return <a href={treeUrl} className="engent-text-link">Launch Decision Tree Coach <span aria-hidden="true">↗</span></a>;
  }
  return <span className="engent-status">{coach.id === 'tree' ? 'Public launch pending' : 'In development'}</span>;
}

export default function Homepage() {
  return <MarketingLayout>
    <section className="engent-hero">
      <div className="engent-wrap engent-hero-grid">
        <div>
          <h1>Interactive Decision Coaches<span>.</span></h1>
          <p className="engent-lede">Set clear objectives, compare your options, and make a decision you can explain.</p>
          <div className="engent-actions">
            <Link to="/explore" className="engent-button">Explore the Coaches <span aria-hidden="true">→</span></Link>
            <a href="#engent-intro" className="engent-text-link">Watch the introduction <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <figure className="engent-hero-art">
          <img src={heroArtwork} alt="" width="900" height="600" fetchPriority="high" />
          <figcaption><span>Objectives</span><span>Analysis</span><span>Human Judgment</span></figcaption>
        </figure>
      </div>
    </section>
    <section className="engent-wrap engent-section engent-why" aria-labelledby="why-engent">
      <h2 id="why-engent">Why Engent Labs?</h2>
      <div className="engent-principles">
        <div><h3>A Systematic Approach</h3><p>Break a complex decision into manageable steps and make your reasoning visible.</p></div>
        <div><h3>Interactive AI Decision Coaching</h3><p>Learn by doing. Use Practice Lab to challenge assumptions and explore alternatives with guided questions.</p></div>
        <div><h3>Real-World Applications</h3><p>See how decision tools apply to business and engineering challenges.</p><Link to="/explore#simulation-applications" className="engent-text-link">Browse case previews →</Link></div>
      </div>
    </section>
    <section className="engent-intro-band" aria-labelledby="engent-intro">
      <div className="engent-wrap engent-section">
        <div className="engent-section-head"><h2 id="engent-intro">Six ways to think through a decision</h2><p>A silent, one-minute introduction.</p></div>
        <CoachIntro />
      </div>
    </section>
    <section id="decision-tools" className="engent-wrap engent-section" aria-labelledby="decision-tools-title">
      <div className="engent-section-head"><h2 id="decision-tools-title">Explore Our Decision Tools</h2><p>Choose a coach for the kind of decision you face.</p></div>
      <div className="engent-tools">
        {coaches.map(coach => <article key={coach.id}>
          <div className="engent-card-art"><CoachArtwork kind={coach.id} /></div>
          <h3>{coach.name}</h3><p>{coach.subtitle}</p>
          <div className="engent-card-actions"><Availability coach={coach} /><Link to={`/explore#${coach.id}`} className="engent-text-link" aria-label={`Explore ${coach.name}`}>Details <span aria-hidden="true">↗</span></Link></div>
        </article>)}
      </div>
    </section>
    <section className="engent-closing"><div className="engent-wrap">
      <h2>Bring a decision you’re working on.</h2>
      <Link className="engent-button" to="/explore">Explore Engent Labs <span aria-hidden="true">↗</span></Link>
    </div></section>
  </MarketingLayout>;
}

function ExploreCoach({ coach }) {
  const [open, setOpen] = useState(false);
  return <article id={coach.id} className="engent-explore-coach" aria-labelledby={`${coach.id}-title`}>
    <div>
      <h2 id={`${coach.id}-title`}>{coach.name}</h2><p className="engent-explore-subtitle">{coach.subtitle}</p><p>{coach.detail}</p>
      <h3>Practice with Your Coach</h3>
      <div className="engent-card-actions"><Availability coach={coach} /></div>
      <h3>Explore Real-World Applications</h3>
      {coach.id === 'simulation' ? <a className="engent-text-link" href="#simulation-applications">Browse Simulation cases →</a> : <p>Applications are planned for this coach.</p>}
    </div>
    <div className="engent-demo">
      <h3>Understand the Tool</h3>
      <p><strong>{coach.question}</strong> {coach.method} {coach.judgment}</p>
      <button type="button" className="engent-illustration-toggle" aria-expanded={open} aria-controls={`${coach.id}-illustration`} onClick={() => setOpen(!open)}>
        {!open && <span className="engent-explore-art"><CoachArtwork kind={coach.id} /></span>}
        <span className="engent-text-link">{open ? 'Close illustration' : 'Open illustration'}</span>
      </button>
      <div id={`${coach.id}-illustration`} hidden={!open}>{open && <><p>{coach.demo}</p><CoachIntro coach={coach} /></>}</div>
      {coach.id === 'process' && <details className="coach-transcript">
        <summary>Watch the legacy Practice Lab demo</summary>
        <video controls muted playsInline preload="none" poster="/assets/decision-making-demo.png" aria-label="Silent demo of the legacy Practice Lab interface">
          <source src="/assets/Engent Labs.mp4" type="video/mp4" />
        </video>
        <p>The demo shows the strategic thinking lens, follow-up prompts, and course-aligned concepts in Practice Lab.</p>
      </details>}
    </div>
  </article>;
}

export function ExplorePage() {
  return <MarketingLayout explore>
    <section className="engent-explore-hero"><div className="engent-wrap engent-section">
      <h1>Explore Engent Labs<span>.</span></h1>
      <p className="engent-lede">Choose a coach based on the question you need to answer, from setting objectives to finding a solution within constraints.</p>
      <nav aria-label="Coaches" className="engent-coach-nav">{coaches.map(coach => <a href={`#${coach.id}`} key={coach.id}>{coach.name}</a>)}</nav>
    </div></section>
    <section className="engent-wrap engent-explore-list" aria-label="Coach descriptions and demos">
      {coaches.map(coach => <ExploreCoach key={coach.id} coach={coach} />)}
    </section>
    <ApplicationLibrary />
  </MarketingLayout>;
}
