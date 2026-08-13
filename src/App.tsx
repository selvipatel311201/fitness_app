import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { Logo } from './components/Logo';
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
      <div className="promo-strip">No account · No tracking · Your data stays on this device</div>

      <header className="site-header">
        <div className="header-inner">
          <span className="header-side header-left">Personal fitness planner</span>
          <Logo />
          <span className="header-side header-right">
            {profile && !editing && (
              <button className="link-btn" onClick={() => setEditing(true)}>
                Edit details
              </button>
            )}
          </span>
        </div>
      </header>

      <main className="main">
        <nav className="crumbs" aria-label="Breadcrumb">
          Home <span aria-hidden="true">/</span>{' '}
          <strong>{showForm ? (profile ? 'Edit details' : 'Your details') : 'Your plan'}</strong>
        </nav>

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
      </main>

      <footer className="site-footer">
        <p>Estimates from standard formulas, not medical advice.</p>
        <p>Built with React and TypeScript · Everything runs in your browser</p>
      </footer>
    </>
  );
}
