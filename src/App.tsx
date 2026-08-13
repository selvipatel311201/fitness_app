import { useEffect, useState } from 'react';
import type { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';
import { Dashboard } from './components/Dashboard';
import { Fitty } from './components/Fitty';
import { Icon, Logo } from './components/Chrome';
import { Counter, Reveal } from './components/Reveal';
import { clearProfile, loadProfile, saveProfile } from './lib/storage';
import { draftFromProfile, emptyDraft } from './lib/validate';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [editing, setEditing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  // The header sits transparent over the hero and turns solid past it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <header className={`site-header${!profile ? ' over-hero' : ''}${scrolled ? ' is-solid' : ''}`}>
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
                <h1>Your body. Your goal. A plan that fits.</h1>
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
              <a className="goto-next" href="#what" aria-label="See what you get">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </a>
            </section>

            <section className="band" id="what">
              <div className="shell">
                <Reveal>
                  <div className="band-head">
                    <span className="eyebrow">What you get</span>
                    <h2>Everything a coach would write down for you</h2>
                    <p className="lede">
                      Not a generic PDF off the internet. Every number below is worked out from your body, your goal and
                      the days you can actually train.
                    </p>
                  </div>
                </Reveal>

                <ul className="icons-grid">
                  {[
                    {
                      icon: 'flame',
                      title: 'Calories and macros',
                      body: 'A daily target from the Mifflin-St Jeor formula, split into protein, carbs and fat in grams.',
                    },
                    {
                      icon: 'plate',
                      title: 'Meals you will actually eat',
                      body: 'Four a day matched to how you eat — vegetarian, vegan, eggetarian or not — minus anything you avoid.',
                    },
                    {
                      icon: 'calendar',
                      title: 'A training week',
                      body: 'Seven days planned around your goal and trimmed to the number of days you can realistically train.',
                    },
                    {
                      icon: 'check',
                      title: 'Dated checkpoints',
                      body: 'A target weight for every week, so you know on any given Sunday whether you are on pace.',
                    },
                    {
                      icon: 'chat',
                      title: 'Fitty, your coach',
                      body: 'Ask for any body part and get the movement explained in plain steps, with videos to watch.',
                    },
                    {
                      icon: 'shield',
                      title: 'Safe by design',
                      body: 'The pace is capped at what a body can do, and nothing you type ever leaves this device.',
                    },
                  ].map((item, i) => (
                    <Reveal as="li" key={item.title} delay={i * 70}>
                      <span className="icon-badge">
                        <Icon name={item.icon} size={20} />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </Reveal>
                  ))}
                </ul>

                <ul className="figures">
                  <li className="figure">
                    <strong>
                      <Counter to={2} />&nbsp;min
                    </strong>
                    <span>to a finished plan</span>
                  </li>
                  <li className="figure">
                    <strong>
                      <Counter to={12} />
                    </strong>
                    <span>movements explained step by step</span>
                  </li>
                  <li className="figure">
                    <strong>
                      <Counter to={0} />
                    </strong>
                    <span>bytes of your data sent anywhere</span>
                  </li>
                </ul>
              </div>
              <a className="goto-next" href="#how" aria-label="See how it works">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </a>
            </section>

            <section className="band band-page" id="how">
              <div className="shell">
                <Reveal>
                  <div className="band-head">
                    <span className="eyebrow">How it works</span>
                    <h2>Three steps, then you just follow it</h2>
                    <p className="lede">No subscriptions, no logins, no data collection. It runs entirely in your browser.</p>
                  </div>
                </Reveal>
                <ol className="steps">
                  {[
                    ['Tell it about you', 'Age, height, weight, target, how you eat and how often you train. Or chat it through with Fitty.'],
                    ['Get real numbers', 'A calorie target and macro split from proven formulas — capped at a pace that is actually safe.'],
                    ['Follow the week', 'Meals, training and weekly weigh-in checkpoints. Save it as a PDF or email it to yourself.'],
                  ].map(([title, body], i) => (
                    <Reveal as="li" key={title} delay={i * 90}>
                      <div className="step">
                        <span className="step-num">{i + 1}</span>
                        <h3>{title}</h3>
                        <p>{body}</p>
                      </div>
                    </Reveal>
                  ))}
                </ol>
              </div>
            </section>

            <section className="band band-light" id="faq">
              <div className="shell">
                <Reveal>
                  <div className="band-head">
                    <span className="eyebrow">Questions</span>
                    <h2>The things people ask first</h2>
                  </div>
                </Reveal>
                <Reveal>
                  <div className="faq">
                    {[
                      ['Is my data really private?', 'Yes. There is no account and no server. Your details, photo and plan live in this browser only — clearing site data deletes them, and nothing is ever uploaded.'],
                      ['Where do the numbers come from?', 'Mifflin-St Jeor for resting metabolic rate, an activity multiplier for maintenance, and 7,700 kcal per kilogram of body mass for the deficit or surplus. Protein is 1.6–2.0 g/kg depending on your goal.'],
                      ['What if I ask for something unrealistic?', 'It tells you. The pace is capped at about 1% of bodyweight lost per week and never drops below 1,500 kcal for men or 1,200 for women — if your timeline needs more, it plans the fastest healthy version and says so.'],
                      ['Can I get the plan out of the browser?', 'Save as PDF uses your browser’s own print-to-PDF, so the text stays selectable. Email my plan opens your mail app with everything written in.'],
                      ['Is this medical advice?', 'No. These are estimates from population formulas. If you have a health condition, are pregnant, or are recovering from injury, talk to a doctor before making a big change.'],
                    ].map(([q, a]) => (
                      <details key={q}>
                        <summary>{q}</summary>
                        <p>{a}</p>
                      </details>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>

            <section className="band cta-band">
              <div className="shell">
                <Reveal>
                  <div className="band-head" style={{ marginBottom: 0 }}>
                    <h2>Ready when you are</h2>
                    <p className="lede">Two minutes of typing and you will have the whole thing — meals, training and all.</p>
                  </div>
                  <div className="cta-actions">
                    <a className="btn btn-primary" href="#form">
                      Build my plan <Icon name="bolt" size={16} />
                    </a>
                    <button className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event('fitty:open'))}>
                      <Icon name="chat" size={16} /> Ask Fitty a question
                    </button>
                  </div>
                </Reveal>
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
          <span className="footer-credit">
            Built with React &amp; TypeScript · Design inspired by{' '}
            <a href="https://html5up.net" target="_blank" rel="noreferrer noopener">
              HTML5 UP
            </a>
          </span>
        </div>
      </footer>

      <Fitty profile={profile} onProfile={handleSubmit} />
    </>
  );
}
