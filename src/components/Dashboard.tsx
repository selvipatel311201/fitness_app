import type { Profile } from '../types';
import { GOAL_LABELS, buildPlan, todayIso } from '../lib/calc';
import { buildMeals, dietNotes } from '../lib/mealPlan';
import { buildTrainingWeek } from '../lib/trainingPlan';
import { buildMailtoHref, planFileName } from '../lib/planText';

interface Props {
  profile: Profile;
  onEdit: () => void;
  onReset: () => void;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const NOTICE_TITLES = {
  ok: 'On track',
  aggressive: 'Ambitious pace',
  unrealistic: 'Timeline adjusted',
} as const;

export function Dashboard({ profile, onEdit, onReset }: Props) {
  const plan = buildPlan(profile);
  const meals = buildMeals(profile, plan);
  const week = buildTrainingWeek(profile.goal, profile.activity);
  const notes = dietNotes(profile, plan);

  const elapsed = Math.max(0, profile.days - plan.daysLeft);
  const progressPct = Math.min(100, (elapsed / profile.days) * 100);
  const direction = plan.weightDeltaKg < 0 ? 'to lose' : plan.weightDeltaKg > 0 ? 'to gain' : 'to hold';
  // Keyed off the safety verdict, not a day-count comparison: rounding the
  // weekly rate can push projectedDays one day past an otherwise on-target plan.
  const clamped = plan.safety.level === 'unrealistic';

  const mailtoHref = buildMailtoHref({ profile, plan, meals, week });

  /**
   * Print dialogs name the PDF after the document title, so swap it for the
   * duration of the print and put it back afterwards.
   */
  function handlePrint() {
    const previous = document.title;
    document.title = planFileName(profile);
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  }

  return (
    <>
      <div className="print-head">
        <strong>FitPlan</strong>
        <span>
          {profile.name ? `${profile.name}'s plan` : 'Your plan'} · generated {formatDate(todayIso())}
        </span>
      </div>

      <section className="section hero">
        <div className="hero-media">
          {profile.photo ? <img src={profile.photo} alt="Your progress photo" /> : <span>No photo</span>}
        </div>
        <div className="hero-body">
          <span className="eyebrow">{GOAL_LABELS[profile.goal]}</span>
          <h1 className="hero-title">{profile.name ? `${profile.name}'s plan` : 'Your plan'}</h1>
          <p className="hero-sub">
            {Math.abs(plan.weightDeltaKg)} kg {direction} · {profile.weightKg} kg today ·{' '}
            {clamped ? 'realistic finish ' : 'target '}
            {formatDate(clamped ? plan.projectedDate : plan.targetDate)}
          </p>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="progress-label">
            <span>
              Day {elapsed} of {profile.days}
            </span>
            <span>{plan.daysLeft} days left</span>
          </p>
        </div>
      </section>

      <div className={`notice notice-${plan.safety.level}`}>
        <span className="eyebrow">{NOTICE_TITLES[plan.safety.level]}</span>
        <p>{plan.safety.message}</p>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Daily targets</h2>
          <p className="section-note">Recalculated whenever you edit your details</p>
        </div>
        <div className="rule" />
        <div className="grid-4">
          <article className="card tile tile-feature">
            <span className="badge tile-badge">Eat this</span>
            <span className="tile-label">Daily calories</span>
            <strong className="tile-value">{plan.dailyCalories.toLocaleString()}</strong>
            <span className="tile-note">kcal per day</span>
          </article>
          <article className="card tile">
            <span className="tile-label">
              {plan.adjustment < 0 ? 'Deficit' : plan.adjustment > 0 ? 'Surplus' : 'Balance'}
            </span>
            <strong className="tile-value">{Math.abs(plan.adjustment).toLocaleString()}</strong>
            <span className="tile-note">
              {plan.adjustment < 0
                ? 'kcal below maintenance'
                : plan.adjustment > 0
                  ? 'kcal above maintenance'
                  : 'kcal at maintenance'}
            </span>
          </article>
          <article className="card tile">
            <span className="tile-label">Maintenance</span>
            <strong className="tile-value">{plan.tdee.toLocaleString()}</strong>
            <span className="tile-note">kcal to hold weight</span>
          </article>
          <article className="card tile">
            <span className="tile-label">Resting burn</span>
            <strong className="tile-value">{plan.bmr.toLocaleString()}</strong>
            <span className="tile-note">kcal at complete rest</span>
          </article>
          <article className="card tile">
            <span className="tile-label">Body mass index</span>
            <strong className="tile-value">{plan.bmi}</strong>
            <span className="tile-note">{plan.bmiCategory}</span>
          </article>
          <article className="card tile">
            <span className="tile-label">Expected change</span>
            <strong className="tile-value">
              {plan.weeklyRateKg > 0 ? '+' : ''}
              {plan.weeklyRateKg}
            </strong>
            <span className="tile-note">kg per week</span>
          </article>
          <article className="card tile">
            <span className="tile-label">Water</span>
            <strong className="tile-value">{(plan.waterMl / 1000).toFixed(1)}</strong>
            <span className="tile-note">litres per day</span>
          </article>
          <article className="card tile">
            <span className="tile-label">Steps</span>
            <strong className="tile-value">{plan.stepsTarget.toLocaleString()}</strong>
            <span className="tile-note">outside your workouts</span>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Macros</h2>
          <p className="section-note">
            {plan.macros.proteinG}P · {plan.macros.carbsG}C · {plan.macros.fatG}F grams
          </p>
        </div>
        <div className="rule" />
        <div className="card">
          <Macro label="Protein" grams={plan.macros.proteinG} kcal={plan.macros.proteinG * 4} total={plan.dailyCalories} />
          <Macro label="Carbs" grams={plan.macros.carbsG} kcal={plan.macros.carbsG * 4} total={plan.dailyCalories} />
          <Macro label="Fat" grams={plan.macros.fatG} kcal={plan.macros.fatG * 9} total={plan.dailyCalories} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Your week</h2>
          <p className="section-note">{profile.diet.replace('-', ' ')} meals · {GOAL_LABELS[profile.goal].toLowerCase()} training</p>
        </div>
        <div className="rule" />
        <div className="grid-2">
          <div className="card">
            <span className="eyebrow">Meal plan</span>
            <ul className="rows">
              {meals.map((meal) => (
                <li key={meal.name}>
                  <div className="row-head">
                    <strong>{meal.name}</strong>
                    <span className="row-meta">{meal.time}</span>
                    <span className="badge">{meal.calories} kcal</span>
                  </div>
                  <p>{meal.idea}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <span className="eyebrow">Training split</span>
            <ul className="rows">
              {week.map((day) => (
                <li key={day.day}>
                  <div className="row-head">
                    <span className="day-tag">{day.day}</span>
                    <strong>{day.focus}</strong>
                  </div>
                  <p>{day.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Checkpoints</h2>
          <p className="section-note">Weigh in once a week, same time of day</p>
        </div>
        <div className="rule" />
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Week</th>
                <th scope="col">Target weight</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {plan.milestones.map((m) => (
                <tr key={m.week}>
                  <td>{m.week}</td>
                  <td className="num">{m.targetWeightKg} kg</td>
                  <td>{formatDate(m.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Habits</h2>
          <p className="section-note">The part that decides the outcome</p>
        </div>
        <div className="rule" />
        <div className="grid-3">
          {notes.map((note, i) => (
            <article className="card habit" key={note}>
              <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="form-actions plan-actions">
        <button className="btn btn-primary" onClick={handlePrint}>
          Save as PDF
        </button>
        <a className="btn" href={mailtoHref}>
          Email my plan
        </a>
        <button className="btn" onClick={onEdit}>
          Edit details
        </button>
        <button className="btn btn-quiet" onClick={onReset}>
          Start over
        </button>
      </div>
      <p className="hint plan-actions-hint">
        “Save as PDF” opens your browser’s print dialog — choose <em>Save as PDF</em> as the destination. “Email my
        plan” opens your mail app with the plan written into the message; nothing is sent from this page.
      </p>

      <p className="disclaimer">
        Numbers come from standard estimates — Mifflin-St Jeor for metabolic rate and 7,700 kcal per kilogram of body
        mass. They are a starting point, not medical advice. Check with a doctor before a big change, especially with a
        health condition.
      </p>
    </>
  );
}

function Macro({ label, grams, kcal, total }: { label: string; grams: number; kcal: number; total: number }) {
  const pct = Math.round((kcal / total) * 100);
  return (
    <div className="macro">
      <div className="macro-head">
        <strong>{label}</strong>
        <span>
          {grams} g · {pct}% of calories
        </span>
      </div>
      <div className="macro-bar">
        <span className={`macro-fill macro-${label.toLowerCase()}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
