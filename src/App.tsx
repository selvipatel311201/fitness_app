import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { clearProfile, loadProfile, saveProfile } from './lib/storage';
import { draftFromProfile, emptyDraft } from './lib/validate';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

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
    <div className="app">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            💪
          </span>
          <div>
            <h1>FitPlan</h1>
            <p>Your stats in, a real plan out.</p>
          </div>
        </div>
      </header>

      <main>
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
        <p>Built with React + TypeScript. Data lives in your browser only.</p>
      </footer>
    </div>
  );
}
