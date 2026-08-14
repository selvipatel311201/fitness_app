import type { Route } from '../lib/router';
import type { Profile } from '../types';
import { buildPlan } from '../lib/calc';
import { EXERCISES, youTubeLinks } from '../lib/fitty/exercises';
import { Counter, Reveal } from './Reveal';
import { Icon } from './Chrome';

interface NavProps {
  go: (to: Route) => void;
}

/** The glowing readout beside the headline: real numbers when a plan exists,
    a representative one otherwise. */
function Readout({ profile }: { profile: Profile | null }) {
  const sample: Profile = profile ?? {
    name: '', age: 28, sex: 'female', heightCm: 168, weightKg: 72, targetWeightKg: 65,
    activity: 'moderate', goal: 'lose-fat', diet: 'vegetarian', avoidFoods: '', days: 90,
    photo: null, startedOn: new Date().toISOString().slice(0, 10),
  };
  const plan = buildPlan(sample);
  const bars = [0.5, 0.75, 0.45, 0.9, 0.6, 1, 0.7, 0.85, 0.55, 0.95, 0.65, 0.8];

  return (
    <div className="hero-media">
      <div className="hero-photo" aria-hidden="true" />
      <div className="readout">
        <div className="readout-top">
          <span>{profile ? 'Your plan' : 'Sample plan'}</span>
          <span className="readout-live">Live</span>
        </div>
        <div className="readout-hero">
          <strong>{plan.dailyCalories.toLocaleString()}</strong>
          <span>kcal today</span>
        </div>
        <div className="readout-bars" aria-hidden="true">
          {bars.map((h, i) => (
            <i key={i} style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <div className="readout-tiles">
          <div className="readout-tile">
            <strong>{plan.macros.proteinG}g</strong>
            <span>Protein</span>
          </div>
          <div className="readout-tile">
            <strong>{plan.macros.carbsG}g</strong>
            <span>Carbs</span>
          </div>
          <div className="readout-tile">
            <strong>{plan.macros.fatG}g</strong>
            <span>Fat</span>
          </div>
        </div>
        <div className="readout-note">
          <Icon name="bolt" size={15} /> {Math.abs(plan.weeklyRateKg)} kg per week at this intake
        </div>
      </div>
    </div>
  );
}

/** Every page except home opens with the same band, so pages feel distinct. */
export function PageHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <section className="page-header">
      <div className="shell">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </div>
    </section>
  );
}

export function Home({ go, profile }: NavProps & { profile: Profile | null }) {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <span className="eyebrow">AI-powered coaching</span>
            <h1>
              The plan that <span className="accent-word">adapts</span> to the body you actually{' '}
              <span className="accent-word accent-word-2">have</span>.
            </h1>
            <p className="lede">
              FitPlan reads your numbers, sets a calorie target you can hold, and writes the week around the days you
              can really train. Fitty answers anything else, in your own words.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary" onClick={() => go('details')}>
                <Icon name="bolt" size={16} /> Build my plan
              </button>
              <button className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event('fitty:open'))}>
                <Icon name="chat" size={16} /> Ask Fitty
              </button>
            </div>
            <ul className="hero-points">
              <li>
                <Icon name="check" size={15} /> Two minutes
              </li>
              <li>
                <Icon name="check" size={15} /> Save as PDF
              </li>
              <li>
                <Icon name="check" size={15} /> Plan stays on your device
              </li>
            </ul>
          </div>
          <Readout profile={profile} />
        </div>
      </section>

      <section className="band band-light" style={{ paddingBottom: 0 }}>
        <div className="shell">
          <ul className="tiles">
            {[
              ['flame', 'Eat', 'A calorie target and macro split, with four meals a day that match how you eat.', 'details'],
              ['calendar', 'Train', 'A seven-day split scaled to the days you can realistically get to.', 'details'],
              ['chat', 'Ask', 'Fitty explains any movement in plain steps, with videos worth watching.', 'exercises'],
            ].map(([icon, title, body, to], i) => (
              <Reveal as="li" key={title} delay={i * 80}>
                <button className="tile-card" onClick={() => go(to as Route)}>
                  <span className="icon-badge">
                    <Icon name={icon} size={20} />
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="band band-alt">
        <div className="shell">
          <Reveal>
            <div className="band-head">
              <span className="eyebrow">What you get</span>
              <h2>Everything a coach would write down for you</h2>
              <p className="lede">
                Every number is worked out from your body, your goal and the days you can actually train.
              </p>
            </div>
          </Reveal>

          <ul className="icons-grid">
            {[
              ['flame', 'Calories and macros', 'A daily target from the Mifflin-St Jeor formula, split into protein, carbs and fat in grams.'],
              ['plate', 'Meals you will eat', 'Four a day matched to how you eat — vegetarian, vegan, eggetarian or not — minus anything you avoid.'],
              ['calendar', 'A training week', 'Seven days planned around your goal and trimmed to the days you can realistically train.'],
              ['check', 'Dated checkpoints', 'A target weight for every week, so you know on any Sunday whether you are on pace.'],
              ['chat', 'Fitty, your AI coach', 'Ask anything in your own words and get a real answer, with videos to watch.'],
              ['shield', 'Safe by design', 'The pace is capped at what a body can do, and your plan never leaves this device.'],
            ].map(([icon, title, body], i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <span className="icon-badge">
                  <Icon name={icon} size={20} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </Reveal>
            ))}
          </ul>

          <ul className="figures">
            <li className="figure">
              <strong>
                <Counter to={2} /> min
              </strong>
              <span>to a finished plan</span>
            </li>
            <li className="figure">
              <strong>
                <Counter to={EXERCISES.length} />
              </strong>
              <span>movements explained</span>
            </li>
            <li className="figure">
              <strong>
                <Counter to={0} />
              </strong>
              <span>accounts to create</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="band cta-band">
        <div className="shell">
          <Reveal>
            <div className="band-head" style={{ marginBottom: 0, borderBottom: 0 }}>
              <h2>Ready when you are</h2>
              <p className="lede">Two minutes of typing and you will have the whole thing.</p>
            </div>
            <div className="cta-actions">
              <button className="btn btn-primary" onClick={() => go('details')}>
                Build my plan
              </button>
              <button className="btn btn-quiet" onClick={() => window.dispatchEvent(new Event('fitty:open'))}>
                Ask Fitty a question
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function HowItWorks({ go }: NavProps) {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Three steps, then you just follow it"
        lede="No subscriptions, no logins, no data collection. The plan is worked out in your browser."
      />

      <section className="band band-light">
        <div className="shell">
          <ol className="steps">
            {[
              ['Tell it about you', 'Age, height, weight, target, how you eat and how often you train. Or chat it through with Fitty instead of filling a form.'],
              ['Get real numbers', 'A calorie target and macro split from proven formulas — capped at a pace that is actually safe for a body.'],
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

      <section className="band band-alt">
        <div className="shell">
          <Reveal>
            <div className="band-head">
              <span className="eyebrow">The maths</span>
              <h2>Where the numbers come from</h2>
              <p className="lede">Nothing here is invented. These are the same formulas a dietitian would use.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="table-wrap card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>How it is worked out</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Resting burn (BMR)', 'Mifflin-St Jeor, from your height, weight, age and sex'],
                    ['Maintenance (TDEE)', 'Resting burn × an activity factor between 1.2 and 1.9'],
                    ['Calorie target', 'Maintenance ± (weight change × 7,700 kcal per kg ÷ your days)'],
                    ['Protein', '1.6 – 2.0 g per kg of bodyweight, depending on your goal'],
                    ['Fat and carbs', 'Fat is 25% of calories; carbohydrate takes the remainder'],
                    ['Safety cap', 'At most ~1% of bodyweight lost per week, never below 1,200 / 1,500 kcal'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <div className="cta-actions">
            <button className="btn btn-primary" onClick={() => go('details')}>
              Build my plan
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export function Exercises() {
  return (
    <>
      <PageHeader
        eyebrow="Exercise library"
        title="Movements worth learning properly"
        lede="Each one in four plain steps, the mistake that matters most, and videos to watch. Ask Fitty for anything not listed."
      />

      <section className="band band-light">
        <div className="shell">
          <ul className="exercise-grid">
            {EXERCISES.map((exercise, i) => (
              <Reveal as="li" key={exercise.name} delay={(i % 3) * 70}>
                <article className="exercise-card">
                  <header>
                    <h3>{exercise.name}</h3>
                    <span className="pill">{exercise.targets}</span>
                  </header>
                  <ol>
                    {exercise.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="exercise-watch">
                    <strong>Watch out:</strong> {exercise.watchOut}
                  </p>
                  <p className="exercise-start">
                    <strong>Start with:</strong> {exercise.starter}
                  </p>
                  <div className="exercise-links">
                    {youTubeLinks(exercise)
                      .slice(0, 2)
                      .map((link) => (
                        <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
                          ▶ {link.label.replace(`${exercise.name}: `, '')}
                        </a>
                      ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function Faq() {
  return (
    <>
      <PageHeader
        eyebrow="Questions"
        title="The things people ask first"
        lede="If something is not here, ask Fitty — it answers in your own words."
      />

      <section className="band band-light">
        <div className="shell">
          <div className="faq">
            {[
              [
                'What happens to my data?',
                'There is no account and no database. Your details, photo and plan live in this browser only — clearing site data deletes them, and they are never uploaded. The one exception is the chat: what you type to Fitty is sent to the AI service that writes the reply.',
              ],
              [
                'Where do the numbers come from?',
                'Mifflin-St Jeor for resting metabolic rate, an activity multiplier for maintenance, and 7,700 kcal per kilogram of body mass for the deficit or surplus. Protein is 1.6–2.0 g/kg depending on your goal.',
              ],
              [
                'What if I ask for something unrealistic?',
                'It tells you. The pace is capped at about 1% of bodyweight lost per week and never drops below 1,500 kcal for men or 1,200 for women — if your timeline needs more, it plans the fastest healthy version and says so plainly.',
              ],
              [
                'Can I get the plan out of the browser?',
                'Save as PDF uses your browser’s own print-to-PDF, so the text stays selectable. Email my plan opens your mail app with everything written into the message.',
              ],
              [
                'Is Fitty a real AI?',
                'Yes. Chat is answered by a large language model, so you can ask in your own words. If it is ever unreachable, a simpler built-in coach answers instead so you are never stuck.',
              ],
              [
                'Is this medical advice?',
                'No. These are estimates from population formulas. If you have a health condition, are pregnant, or are recovering from injury, talk to a doctor before making a big change.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
