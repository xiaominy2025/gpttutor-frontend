import { useEffect } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import CoachArtwork from './CoachArtwork';
import CoachIntro from './CoachIntro';
import ApplicationLibrary from './ApplicationLibrary';
import { podcastCollections } from './podcastCollections';
import { coaches } from './coaches';
import heroArtwork from '../assets/decision-framework.webp';
import './marketing.css';

const logo = '/assets/Engent Labs Transparent.png';
const treeUrl = import.meta.env.VITE_VERIFIED_DECISION_TREE_URL;

function MarketingLayout({ explore, coachNav, children }) {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    document.title = explore ? 'Explore Decision Coaches | Engent Labs' : 'Engent Labs | Interactive Decision Coaches';
    return () => { document.title = 'Engent Labs | Interactive Decision Coaches'; };
  }, [explore]);
  useEffect(() => {
    const section = hash && document.getElementById(hash.slice(1));
    if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return <div className="engent-site">
    <a className="engent-skip" href="#engent-main">Skip to content</a>
    <header className="engent-header">
      <div className="engent-wrap engent-header-row">
        <Link to="/" aria-label="Engent Labs home"><img src={logo} alt="Engent Labs" width="152" height="48" /></Link>
        {pathname.replace(/\/+$/, '') !== '/explore' &&
          <nav aria-label="Main navigation">{coachNav ?? <Link to="/explore">Explore Coaches</Link>}</nav>}
      </div>
    </header>
    <main id="engent-main" tabIndex={-1}>{children}</main>
  </div>;
}

function Availability({ coach, explore }) {
  if (coach.id === 'process') return <>
    {!explore && <span className="engent-status">Legacy Practice Lab available</span>}
    <Link to="/labs" className={explore ? 'engent-button' : 'engent-text-link'}>{explore ? 'Open Legacy Practice Lab' : 'Open Practice Lab'} <span aria-hidden="true">↗</span></Link>
  </>;
  if (coach.id === 'tree' && treeUrl === 'https://decisiontree.engentlabs.com/') {
    return <a href={treeUrl} className={explore ? 'engent-button' : 'engent-text-link'}>{explore ? 'Launch Coach' : 'Launch Decision Tree Coach'} <span aria-hidden="true">↗</span></a>;
  }
  return <span className="engent-status">{coach.id === 'tree' ? 'Public launch pending' : 'Coming soon'}</span>;
}

export default function Homepage() {
  return <MarketingLayout>
    <section className="engent-hero">
      <div className="engent-wrap engent-hero-grid">
        <div>
          <h1>Interactive Decision Coaches<span>.</span></h1>
          <p className="engent-lede">Set clear objectives, compare your options, and make a decision you can explain.</p>
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
        <div><h3>Real-World Applications</h3><p>See how decision tools apply to business and engineering challenges.</p></div>
      </div>
    </section>
    <section className="engent-intro-band" aria-labelledby="engent-intro">
      <div className="engent-wrap engent-section">
        <div className="engent-section-head"><h2 id="engent-intro">Meet Your Six Decision Coaches</h2><p>A one-minute introduction.</p></div>
        <CoachIntro autoplay />
      </div>
    </section>
    <section id="decision-tools" className="engent-wrap engent-section" aria-labelledby="decision-tools-title">
      <div className="engent-section-head"><h2 id="decision-tools-title">Explore Decision Coaches</h2><p>Choose a coach for the kind of decision you face.</p></div>
      <div className="engent-tools">
        {coaches.map(coach => <article key={coach.id}>
          <Link to={`/explore#${coach.id}`} className="engent-card-art" aria-label={`Learn about ${coach.name}`}><CoachArtwork kind={coach.id} /></Link>
          <h3>{coach.name}</h3><p>{coach.subtitle}</p>
          <div className="engent-card-actions"><Availability coach={coach} /><Link to={`/explore#${coach.id}`} className="engent-text-link" aria-label={`Explore ${coach.name}`}>Explore <span aria-hidden="true">↗</span></Link></div>
        </article>)}
      </div>
    </section>
  </MarketingLayout>;
}

function ExploreCoach({ coach }) {
  return <article id={coach.id} className="engent-explore-coach" aria-labelledby={`${coach.id}-title`}>
    <header className="engent-coach-heading">
      <h2 id={`${coach.id}-title`}>{coach.name}</h2>
      <p className="engent-explore-subtitle">{coach.subtitle}</p>
      <p>{coach.detail}</p>
    </header>
    <div className="engent-coach-content">
      <CoachIntro coach={coach} thumbnail={<CoachArtwork kind={coach.id} />} />
      <aside className="engent-coach-actions">
        <section>
          <h3>Business Case Podcasts</h3>
          <p>Systematic decision-making in action.</p>
          {Object.hasOwn(podcastCollections, coach.id) ? <Link className="engent-text-link" to={`/explore/${coach.id}/cases`} aria-label={`Explore Cases: ${coach.name}`}>Explore Cases →</Link> : <span className="engent-status">Cases coming soon</span>}
        </section>
        <section>
          <h3>Meet Your Coach</h3>
          <Availability coach={coach} explore />
        </section>
      </aside>
    </div>
  </article>;
}

export function ExplorePage() {
  return <MarketingLayout explore>
    <section className="engent-explore-hero"><div className="engent-wrap engent-section">
      <h1>Explore Decision Coaches</h1>
      <p className="engent-lede">Find the right coach for your decision.</p>
      <nav aria-label="Coaches" className="engent-coach-nav">{coaches.map(coach => <a href={`#${coach.id}`} key={coach.id}>{coach.name}</a>)}</nav>
    </div></section>
    <section className="engent-wrap engent-explore-list" aria-label="Decision coaches">
      {coaches.map(coach => <ExploreCoach key={coach.id} coach={coach} />)}
    </section>
  </MarketingLayout>;
}

export function CoachCasesPage() {
  const { coachId } = useParams();
  if (!Object.hasOwn(podcastCollections, coachId)) return <Navigate to="/explore" replace />;
  const collection = podcastCollections[coachId];
  return <MarketingLayout explore coachNav={<Link to={`/explore#${coachId}`}><span aria-hidden="true">← </span>{collection.title} Coach</Link>}>
    <ApplicationLibrary key={coachId} {...collection} coachId={coachId} />
  </MarketingLayout>;
}
