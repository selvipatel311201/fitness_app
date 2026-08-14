import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { Fitty } from './components/Fitty';
import { Icon, Logo } from './components/Chrome';
import { Exercises, Faq, Home, HowItWorks, PageHeader } from './components/Pages';
import { clearProfile, loadProfile, saveProfile } from './lib/storage';
import { draftFromProfile, emptyDraft } from './lib/validate';
import { type Route, useRoute } from './lib/router';

const PROMOS = [
  'Free forever · No account · Your plan stays on your device',
  'AI coach · Ask anything in your own words',
  'Calories · Macros · Meals · A training week',
];

const NAV: Array<{ route: Route; label: string }> = [
  { route: 'home', label: 'Home' },
  { route: 'how', label: 'How it works' },
  { route: 'exercises', label: 'Exercises' },
  { route: 'faq', label: 'Questions' },
];

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [promo, setPromo] = useState(0);
  const [route, go] = useRoute();

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    const id = setInterval(() => setPromo((n) => (n + 1) % PROMOS.length), 5000);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(next: Profile) {
    // Keep the original start date when editing so the countdown stays honest.
    setProfile((prev) => (prev ? { ...next, startedOn: prev.startedOn } : next));
    go('plan');
  }

  function handleReset() {
    clearProfile();
    setProfile(null);
    go('home');
  }

  // Someone linking straight to #/plan without a saved plan gets the form.
  const view: Route = route === 'plan' && !profile ? 'details' : route;

  return (
    <>
      <div className="promo-bar">
        <span key={promo}>{PROMOS[promo]}</span>
      </div>

      <header className="site-header">
        <div className="shell header-inner">
          <button className="brand" onClick={() => go('home')}>
            <Logo />
            FitPlan
          </button>

          <nav className="header-nav">
            {NAV.map((item) => (
              <button
                key={item.route}
                className={`header-link${view === item.route ? ' is-active' : ''}`}
                onClick={() => go(item.route)}
              >
                {item.label}
              </button>
            ))}
            {profile && (
              <button className={`header-link${view === 'plan' ? ' is-active' : ''}`} onClick={() => go('plan')}>
                My plan
              </button>
            )}
          </nav>

          <div className="header-tools">
            <button className="btn btn-primary btn-sm header-cta" onClick={() => go(profile ? 'plan' : 'details')}>
              {profile ? 'My plan' : 'Start free'}
            </button>
            <button
              className="icon-button"
              aria-label="Ask Fitty"
              onClick={() => window.dispatchEvent(new Event('fitty:open'))}
            >
              <Icon name="chat" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="ask-bar">
        <div className="shell">
          <button onClick={() => window.dispatchEvent(new Event('fitty:open'))}>
            <Icon name="chat" size={18} /> ASK FITTY — “how do I do a squat?” · “what should I eat today?”
          </button>
        </div>
      </div>

      <main>
        {view === 'home' && <Home go={go} profile={profile} />}
        {view === 'how' && <HowItWorks go={go} />}
        {view === 'exercises' && <Exercises />}
        {view === 'faq' && <Faq />}

        {view === 'details' && (
          <>
            <PageHeader
              eyebrow="Your details"
              title={profile ? 'Edit your details' : 'Tell us about you'}
              lede="Worked out in this browser. Nothing is uploaded, photo included."
            />
            <section className="form-wrap">
              <div className="shell">
                <ProfileForm
                  initial={profile ? draftFromProfile(profile) : emptyDraft()}
                  submitLabel={profile ? 'Save changes' : 'Build my plan'}
                  onSubmit={handleSubmit}
                  onCancel={profile ? () => go('plan') : undefined}
                />
              </div>
            </section>
          </>
        )}

        {view === 'plan' && profile && (
          <section className="plan">
            <div className="shell">
              <Dashboard profile={profile} onEdit={() => go('details')} onReset={handleReset} />
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <nav className="footer-nav">
            {NAV.map((item) => (
              <button key={item.route} onClick={() => go(item.route)}>
                {item.label}
              </button>
            ))}
          </nav>
          <span>Built by Selvi Patel</span>
        </div>
      </footer>

      <Fitty profile={profile} onProfile={handleSubmit} />
    </>
  );
}
