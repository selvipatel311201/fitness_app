import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { Fitty } from './components/Fitty';
import { Icon, Logo } from './components/Chrome';
import { clearProfile, loadProfile, saveProfile } from './lib/storage';
import { draftFromProfile, emptyDraft } from './lib/validate';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  // Submitting from the bottom of a long form would otherwise drop you into the
  // middle of the plan.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [profile, editing]);

  function handleSubmit(next: Profile) {
    // Keep the original start date when editing so the countdown stays honest.
    setProfile((prev) => (prev ? { ...next, startedOn: prev.startedOn } : next));
    setEditing(false);
  }

  function handleReset() {
    clearProfile();
    setProfile(null);
    setEditing(false);
  }

  const showForm = !profile || editing;

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top">
            <Logo />
            FitPlan
          </a>
          <nav className="header-nav">
            <button
              className={`header-link${showForm ? ' is-active' : ''}`}
              onClick={() => (profile ? setEditing(true) : document.getElementById('form')?.scrollIntoView())}
            >
              Your details
            </button>
            {profile && (
              <button className={`header-link${!showForm ? ' is-active' : ''}`} onClick={() => setEditing(false)}>
                Your plan
              </button>
            )}
          </nav>
        </div>
      </header>

      <main id="top">
        {!profile && (
          <>
            <section className="hero">
              <div className="shell hero-grid">
                <span className="eyebrow">
                  <Icon name="bolt" size={14} /> Free · no account · private
                </span>
                <h1>
                  Your body. Your goal. <em>A plan that fits.</em>
                </h1>
                <p className="lede">
                  Tell FitPlan your numbers and it works out exactly what to eat and how to train — calories, macros,
                  meals and a weekly split, built around the time you actually have.
                </p>
                <div className="hero-cta">
                  <a className="btn btn-primary" href="#form">
                    Build my plan <Icon name="bolt" size={16} />
                  </a>
                  <button className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event('fitty:open'))}>
                    <Icon name="chat" size={16} /> Ask Fitty instead
                  </button>
                </div>
                <ul className="hero-points">
                  <li>
                    <Icon name="check" size={15} /> Takes two minutes
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Save it as a PDF
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Nothing leaves your device
                  </li>
                </ul>
              </div>
            </section>

            <div className="shell">
              <div className="hero-cards">
                <article className="hero-card">
                  <span className="hero-card-icon">
                    <Icon name="flame" size={18} />
                  </span>
                  <strong>Calories &amp; macros</strong>
                  <span>Worked out from your body and your goal, not a guess.</span>
                </article>
                <article className="hero-card">
                  <span className="hero-card-icon">
                    <Icon name="plate" size={18} />
                  </span>
                  <strong>Meals you'll eat</strong>
                  <span>Four a day, matched to how you eat and what you avoid.</span>
                </article>
                <article className="hero-card">
                  <span className="hero-card-icon">
                    <Icon name="calendar" size={18} />
                  </span>
                  <strong>A week of training</strong>
                  <span>Scaled to the days you can realistically train.</span>
                </article>
              </div>
            </div>

            <section className="section">
              <div className="shell">
                <div className="section-head">
                  <span className="eyebrow">How it works</span>
                  <h2>Three steps, then you just follow it</h2>
                  <p className="lede">No subscriptions, no logins, no data collection. It runs entirely in your browser.</p>
                </div>
                <ol className="steps">
                  <li className="step">
                    <span className="step-num">1</span>
                    <h3>Tell it about you</h3>
                    <p>Age, height, weight, target, how you eat and how often you train. Or just chat it through with Fitty.</p>
                  </li>
                  <li className="step">
                    <span className="step-num">2</span>
                    <h3>Get real numbers</h3>
                    <p>A calorie target and macro split from proven formulas — capped at a pace that is actually safe.</p>
                  </li>
                  <li className="step">
                    <span className="step-num">3</span>
                    <h3>Follow the week</h3>
                    <p>Meals, training and weekly weigh-in checkpoints. Save it as a PDF or email it to yourself.</p>
                  </li>
                </ol>
              </div>
            </section>
          </>
        )}

        {showForm ? (
          <section className="form-wrap" id="form">
            <div className="shell">
              <ProfileForm
                initial={profile ? draftFromProfile(profile) : emptyDraft()}
                submitLabel={profile ? 'Save changes' : 'Build my plan'}
                onSubmit={handleSubmit}
                onCancel={profile ? () => setEditing(false) : undefined}
              />
            </div>
          </section>
        ) : (
          <section className="plan">
            <div className="shell">
              <Dashboard profile={profile} onEdit={() => setEditing(true)} onReset={handleReset} />
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <span>© FitPlan · Estimates from standard formulas, not medical advice.</span>
          <span>Built with React &amp; TypeScript · Your data stays in this browser</span>
        </div>
      </footer>

      <Fitty profile={profile} onProfile={handleSubmit} />
    </>
  );
}
