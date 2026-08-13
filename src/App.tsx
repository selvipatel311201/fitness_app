import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { Fitty } from './components/Fitty';
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
    <div id="wrapper" className="fade-in">
      <div className="bg fixed" />

      {!profile && (
        <div id="intro">
          <h1>
            Fit
            <br />
            Plan
          </h1>
          <p>
            Your age, height, weight and goal in — a calorie target, macro split,
            <br />
            meal plan and training week out. Nothing leaves this device.
          </p>
          <ul className="actions">
            <li>
              <a
                href="#main"
                className="button icon solid solo fa-arrow-down"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('main')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Continue
              </a>
            </li>
          </ul>
        </div>
      )}

      <header id="header">
        <a href="#main" className="logo" onClick={(e) => e.preventDefault()}>
          FitPlan
        </a>
        <nav id="nav">
          <ul className="links">
            <li className={showForm ? 'active' : undefined}>
              <a
                href="#main"
                onClick={(e) => {
                  e.preventDefault();
                  if (profile) setEditing(true);
                }}
              >
                Your details
              </a>
            </li>
            {profile && (
              <li className={!showForm ? 'active' : undefined}>
                <a
                  href="#main"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditing(false);
                  }}
                >
                  Your plan
                </a>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <div id="main">
        {showForm ? (
          <ProfileForm
            initial={profile ? draftFromProfile(profile) : emptyDraft()}
            submitLabel={profile ? 'Save changes' : 'Build my plan'}
            onSubmit={handleSubmit}
            onCancel={profile ? () => setEditing(false) : undefined}
          />
        ) : (
          <Dashboard profile={profile} onEdit={() => setEditing(true)} onReset={handleReset} />
        )}
      </div>

      <footer id="footer">
        <section className="split contact">
          <section>
            <h3>Privacy</h3>
            <p>
              Your details, photo and plan stay in this browser's storage. There is no account, no server and no
              tracking.
            </p>
          </section>
          <section>
            <h3>Method</h3>
            <p>
              Mifflin-St Jeor for metabolic rate, 7,700 kcal per kilogram of body mass. Estimates, not medical advice.
            </p>
          </section>
        </section>
        <p className="copyright">
          &copy; FitPlan. Design: <a href="https://html5up.net">HTML5 UP</a>.
        </p>
      </footer>

      <Fitty profile={profile} onProfile={handleSubmit} />
    </div>
  );
}
