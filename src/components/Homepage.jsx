import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import CoachArtwork from './CoachArtwork';
import CoachLaunchControl from './CoachLaunchControl';
import EngentHeader from '../shared/EngentHeader';
import ReleaseBAccess from './ReleaseBAccess';
import PlatformAccess from './PlatformAccess';
import CoachIntro from './CoachIntro';
import ApplicationLibrary from './ApplicationLibrary';
import { podcastCollections } from './podcastCollections';
import { coaches } from './coaches';
import heroArtwork from '../assets/decision-framework.webp';
import './marketing.css';

const logo = '/assets/Engent Labs Transparent.png';
const treeUrl = import.meta.env.VITE_VERIFIED_DECISION_TREE_URL;
const forecastUrl = import.meta.env.VITE_FORECAST_COACH_URL || '/engent-alpha/forecasting/';
// Separate Alpha opt-in; existing Release B and production builds exclude Navigator.
const DecisionNavigator = import.meta.env.VITE_NAVIGATOR_ALPHA_ENABLED === 'true'
  ? lazy(() => import('./DecisionNavigator')) : null;

function MarketingLayout({ explore, coachNav, children, onSharedLaunch }) {
  const { hash, pathname, search } = useLocation();
  const [headerAccount,setHeaderAccount]=useState(null);
  const bHeader=import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED==='true';
  const accountStatus=headerAccount?.unavailable?'Account unavailable':headerAccount?.pendingSignIn?'Sign-in pending':headerAccount?.signedIn?(headerAccount.entitlements?.tree?.advanced?'Advanced':'Student'):'Guest';
  useEffect(() => {
    document.title = explore ? 'Explore Decision Coaches | Engent Labs' : 'Engent Labs | Interactive Decision Coaching';
    return () => { document.title = 'Engent Labs | Interactive Decision Coaching'; };
  }, [explore]);
  useEffect(() => {
    const section = hash && document.getElementById(hash.slice(1));
    if (section) section.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return <div className="engent-site">
    <a className="engent-skip" href="#engent-main">Skip to content</a>
    {bHeader?<EngentHeader homeUrl={treeUrl==='https://d6owpirihdsus.cloudfront.net/'?'/engent-alpha/':'https://www.engentlabs.com/'} logoUrl={logo} pageName={explore?(pathname.includes('/cases')?'Business Case Podcasts':'Explore Decision Coaches'):'Interactive Decision Coaching'} status={accountStatus} navigation={pathname.replace(/\/+$/,'')!=='/explore'?(coachNav??<Link to="/explore">Explore Coaches</Link>):null}><ReleaseBAccess entryRequest={pathname+search} onAccountState={setHeaderAccount} onSharedLaunch={onSharedLaunch}/></EngentHeader>:<header className="engent-header">
      <div className="engent-wrap engent-header-row">
        <Link to="/" aria-label="Engent Labs home"><img src={logo} alt="Engent Labs" width="152" height="48" /></Link>
        {pathname.replace(/\/+$/, '') !== '/explore' &&
          <nav aria-label="Main navigation">{coachNav ?? <Link to="/explore">Explore Coaches</Link>}</nav>}
      </div>
    </header>}
    <main id="engent-main" tabIndex={-1}>{children}</main>
  </div>;
}

function canLaunch(coach) {
  if (coach.id === 'scenario') return import.meta.env.VITE_SCENARIO_COACH_ENABLED === 'true';
  if (coach.id === 'forecast') return import.meta.env.VITE_FORECAST_COACH_ENABLED === 'true';
  if (coach.id === 'process') return import.meta.env.VITE_PROCESS_COACH_ENABLED === 'true';
  return coach.id === 'tree' && (treeUrl === 'https://decisiontree.engentlabs.com/' || (import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED === 'true' && treeUrl === 'https://d6owpirihdsus.cloudfront.net/'));
}

function Availability({ coach, sharedLaunch }) {
  if (coach.id === 'scenario' && canLaunch(coach)) return <CoachLaunchControl href="/scenario-analysis/" label="Launch Scenario Analysis Coach" />;
  if (coach.id === 'forecast' && canLaunch(coach)) return <CoachLaunchControl href={forecastUrl} label="Launch Forecasting Coach" />;
  if (coach.id === 'process' && canLaunch(coach)) return <CoachLaunchControl href="/process/" label="Launch Decision Process Coach" />;
  if (canLaunch(coach)) {
    const safePath = import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED === 'true' ? 'api/shared/email/login' : 'api/shared/login';
    const destination = sharedLaunch === treeUrl + safePath ? sharedLaunch : treeUrl;
    if (import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED === 'true' && destination === treeUrl + safePath) {
      return <form method="post" action={destination}><CoachLaunchControl type="submit" label="Launch Decision Tree Coach" /></form>;
    }
    return <CoachLaunchControl href={destination} label="Launch Decision Tree Coach" />;
  }
  return <span className="engent-status">Coming Soon</span>;
}

export default function Homepage() {
  return <MarketingLayout>
    <section className="engent-hero">
      <div className="engent-wrap engent-hero-grid">
        <div>
          <h1>Interactive Decision Coaching<span>.</span></h1>
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
        <div><h3>Interactive AI Decision Coaching</h3><p>Explore alternatives, challenge assumptions, and examine uncertainty with AI Decision Tree Coach.</p></div>
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
      <div className="engent-section-head"><h2 id="decision-tools-title">Explore Our Decision Tools</h2><p>Choose a coach for the kind of decision you face.</p></div>
      <div className="engent-tools">
        {coaches.map(coach => <article key={coach.id}>
          <Link to={`/explore#${coach.id}`} className="engent-card-art" aria-label={`Learn about ${coach.name}`}><CoachArtwork kind={coach.id} /></Link>
          <h3>{coach.name}</h3><p>{coach.subtitle}</p>
          {!canLaunch(coach) && <span className="engent-status">Coming Soon</span>}
        </article>)}
      </div>
    </section>
  </MarketingLayout>;
}

function ExploreCoach({ coach, sharedLaunch }) {
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
          {Object.hasOwn(podcastCollections, coach.id) ? <Link className="engent-text-link" to={`/explore/${coach.id}/cases`} aria-label={`Explore Cases: ${coach.name}`}>Explore Cases</Link> : <span className="engent-status">Cases coming soon</span>}
        </section>
        <section>
          <h3>Meet Your Coach</h3>
          <Availability coach={coach} sharedLaunch={sharedLaunch} />
        </section>
      </aside>
    </div>
  </article>;
}

export function ExplorePage() {
  const [sharedLaunch, setSharedLaunch] = useState(null);
  return <MarketingLayout explore onSharedLaunch={setSharedLaunch}>
    <section className="engent-explore-hero"><div className="engent-wrap engent-section">
      <h1>Explore Decision Coaches</h1>
      {import.meta.env.VITE_RELEASE_B_EMAIL_ENABLED !== 'true' && import.meta.env.VITE_SHARED_AUTH_ENABLED === 'true' && <PlatformAccess onSharedLaunch={setSharedLaunch} />}
      <p className="engent-lede">Find the right coach for your decision.</p>
      <nav aria-label="Coaches" className="engent-coach-nav">{coaches.map(coach => <a href={`#${coach.id}`} key={coach.id}>{coach.name}</a>)}</nav>
    </div></section>
    {DecisionNavigator && <Suspense fallback={null}><DecisionNavigator /></Suspense>}
    <section className="engent-wrap engent-explore-list" aria-label="Decision coaches">
      {coaches.map(coach => <ExploreCoach key={coach.id} coach={coach} sharedLaunch={sharedLaunch} />)}
    </section>
  </MarketingLayout>;
}

export function CoachCasesPage() {
  const { coachId } = useParams();
  if (!Object.hasOwn(podcastCollections, coachId)) return <Navigate to="/explore" replace />;
  const collection = podcastCollections[coachId];
  return <MarketingLayout explore coachNav={<Link to={coachId === 'navigator' ? '/explore#navigator-intro-title' : `/explore#${coachId}`}>{collection.title}{coachId === 'navigator' ? '' : ' Coach'}</Link>}>
    <ApplicationLibrary key={coachId} {...collection} coachId={coachId} />
  </MarketingLayout>;
}
