import type { Profile } from '../types';
import { GOAL_LABELS, buildPlan, todayIso } from '../lib/calc';
import { buildMeals, dietNotes } from '../lib/mealPlan';
import { buildTrainingWeek } from '../lib/trainingPlan';
import { buildMailtoHref, planFileName } from '../lib/planText';
import { Icon } from './Chrome';

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

const NOTICE = {
  ok: { title: 'On track', icon: '✓' },
  aggressive: { title: 'Ambitious pace', icon: '!' },
  unrealistic: { title: 'Timeline adjusted', icon: '!' },
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

  const tiles = [
    {
      label: 'Daily calories',
      value: plan.dailyCalories.toLocaleString(),
      note: 'kcal per day',
      hero: true,
    },
    {
      label: plan.adjustment < 0 ? 'Deficit' : plan.adjustment > 0 ? 'Surplus' : 'Balance',
      value: Math.abs(plan.adjustment).toLocaleString(),
      note:
        plan.adjustment < 0
          ? 'kcal below maintenance'
          : plan.adjustment > 0
            ? 'kcal above maintenance'
            : 'kcal at maintenance',
    },
    { label: 'Maintenance', value: plan.tdee.toLocaleString(), note: 'kcal to hold weight' },
    { label: 'Resting burn', value: plan.bmr.toLocaleString(), note: 'kcal at complete rest' },
    { label: 'Body mass index', value: String(plan.bmi), note: plan.bmiCategory },
    {
      label: 'Expected change',
      value: `${plan.weeklyRateKg > 0 ? '+' : ''}${plan.weeklyRateKg}`,
      note: 'kg per week',
    },
    { label: 'Water', value: (plan.waterMl / 1000).toFixed(1), note: 'litres per day' },
    { label: 'Steps', value: plan.stepsTarget.toLocaleString(), note: 'outside your workouts' },
  ];

  const notice = NOTICE[plan.safety.level];

  return (
    <>
      <div className="print-head">
        <strong>FitPlan</strong>
        <span>
          {profile.name ? `${profile.name}'s plan` : 'Your plan'} · generated {formatDate(todayIso())}
        </span>
      </div>

      <section className="plan-hero">
        <div className="plan-hero-top">
          {profile.photo && <img className="plan-avatar" src={profile.photo} alt="Your progress photo" />}
          <div>
            <span className="eyebrow">{GOAL_LABELS[profile.goal]}</span>
            <h1>{profile.name ? `${profile.name}'s plan` : 'Your plan'}</h1>
            <p className="plan-sub">
              {Math.abs(plan.weightDeltaKg)} kg {direction} · {profile.weightKg} kg today ·{' '}
              {clamped ? 'realistic finish ' : 'target '}
              {formatDate(clamped ? plan.projectedDate : plan.targetDate)}
            </p>
          </div>
          <div className="plan-hero-actions">
            <button className="btn btn-ghost btn-sm" onClick={onEdit}>
              Edit details
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Icon name="download" size={15} /> Save PDF
            </button>
          </div>
        </div>

        <div className="progress">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="progress-label">
          <span>
            Day {elapsed} of {profile.days}
          </span>
          <span>{plan.daysLeft} days left</span>
        </p>
      </section>

      <div className={`notice notice-${plan.safety.level}`}>
        <span className="notice-icon">{notice.icon}</span>
        <div>
          <strong>{notice.title}</strong>
          <p>{plan.safety.message}</p>
        </div>
      </div>

      <div className="stat-grid">
        {tiles.map((tile) => (
          <article key={tile.label} className={`stat${tile.hero ? ' stat-hero' : ''}`}>
            <span className="stat-label">{tile.label}</span>
            <span className="stat-value">{tile.value}</span>
            <span className="stat-note">{tile.note}</span>
          </article>
        ))}
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3>Macros</h3>
            <span className="card-note">Every day, in grams</span>
          </div>
          <Macro label="Protein" grams={plan.macros.proteinG} kcal={plan.macros.proteinG * 4} total={plan.dailyCalories} />
          <Macro label="Carbs" grams={plan.macros.carbsG} kcal={plan.macros.carbsG * 4} total={plan.dailyCalories} />
          <Macro label="Fat" grams={plan.macros.fatG} kcal={plan.macros.fatG * 9} total={plan.dailyCalories} />
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Meal plan</h3>
            <span className="card-note">{profile.diet.replace('-', ' ')}</span>
          </div>
          <ul className="rows">
            {meals.map((meal) => (
              <li key={meal.name}>
                <div className="row-head">
                  <strong>{meal.name}</strong>
                  <span className="row-meta">{meal.time}</span>
                  <span className="pill">{meal.calories} kcal</span>
                </div>
                <p>{meal.idea}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3>Training week</h3>
            <span className="card-note">Repeat weekly, add a little each time</span>
          </div>
          <ul className="rows">
            {week.map((day) => (
              <li key={day.day} className={day.focus === 'Rest' ? 'day-rest' : undefined}>
                <div className="row-head">
                  <span className="day-tag">{day.day}</span>
                  <strong>{day.focus}</strong>
                </div>
                <p>{day.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Checkpoints</h3>
            <span className="card-note">Weigh in weekly, same time of day</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Target</th>
                  <th>Date</th>
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
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Habits that decide the outcome</h3>
          <span className="card-note">The unglamorous part that actually works</span>
        </div>
        <ul className="habits">
          {notes.map((note) => (
            <li key={note}>
              <span className="habit-check">
                <Icon name="check" size={12} />
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="plan-actions">
        <button className="btn btn-primary" onClick={handlePrint}>
          <Icon name="download" size={16} /> Save as PDF
        </button>
        <a className="btn btn-ghost" href={mailtoHref}>
          <Icon name="mail" size={16} /> Email my plan
        </a>
        <button className="btn btn-ghost" onClick={onEdit}>
          Edit details
        </button>
        <button className="btn btn-quiet" onClick={onReset}>
          Start over
        </button>
      </div>

      <p className="disclaimer plan-actions-hint">
        “Save as PDF” opens your browser’s print dialog — choose <em>Save as PDF</em> as the destination. “Email my
        plan” opens your mail app with the plan written in; nothing is sent from this page. Numbers come from standard
        estimates (Mifflin-St Jeor, 7,700 kcal per kg) and are a starting point, not medical advice.
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
          {grams} g · {pct}%
        </span>
      </div>
      <div className="macro-bar">
        <span className={`macro-fill macro-${label.toLowerCase()}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
