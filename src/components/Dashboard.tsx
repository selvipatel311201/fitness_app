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

  const tiles: Array<{ label: string; value: string; note: string }> = [
    {
      label: 'Daily calories',
      value: plan.dailyCalories.toLocaleString(),
      note: 'kcal per day',
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

  return (
    <>
      <div className="print-head">
        <strong>FitPlan</strong>
        <span>
          {profile.name ? `${profile.name}'s plan` : 'Your plan'} · generated {formatDate(todayIso())}
        </span>
      </div>

      <article className="post featured plan-hero">
        <header className="major">
          <span className="date">{GOAL_LABELS[profile.goal]}</span>
          <h2>{profile.name ? `${profile.name}'s plan` : 'Your plan'}</h2>
          <p>
            {Math.abs(plan.weightDeltaKg)} kg {direction} · {profile.weightKg} kg today ·{' '}
            {clamped ? 'realistic finish ' : 'target '}
            {formatDate(clamped ? plan.projectedDate : plan.targetDate)}
          </p>
        </header>

        {profile.photo && (
          <span className="image main plan-photo">
            <img src={profile.photo} alt="Your progress photo" />
          </span>
        )}

        <div className="progress">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="progress-label">
          <span>
            Day {elapsed} of {profile.days}
          </span>
          <span>{plan.daysLeft} days left</span>
        </p>

        <div className={`notice notice-${plan.safety.level}`}>
          <strong>{NOTICE_TITLES[plan.safety.level]}</strong>
          <span>{plan.safety.message}</span>
        </div>
      </article>

      <section className="posts stat-posts">
        {tiles.map((tile) => (
          <article key={tile.label} className="stat">
            <span className="date">{tile.label}</span>
            <strong className="stat-value">{tile.value}</strong>
            <span className="stat-note">{tile.note}</span>
          </article>
        ))}
      </section>

      <article className="post">
        <header>
          <div className="title">
            <h2>Macros</h2>
            <p>
              {plan.macros.proteinG}g protein · {plan.macros.carbsG}g carbs · {plan.macros.fatG}g fat
            </p>
          </div>
        </header>
        <Macro label="Protein" grams={plan.macros.proteinG} kcal={plan.macros.proteinG * 4} total={plan.dailyCalories} />
        <Macro label="Carbs" grams={plan.macros.carbsG} kcal={plan.macros.carbsG * 4} total={plan.dailyCalories} />
        <Macro label="Fat" grams={plan.macros.fatG} kcal={plan.macros.fatG * 9} total={plan.dailyCalories} />
      </article>

      <section className="posts">
        <article>
          <h3>Meal plan</h3>
          <p className="muted">Built around your {profile.diet.replace('-', ' ')} preference.</p>
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
        </article>

        <article>
          <h3>Training week</h3>
          <p className="muted">Repeat weekly, adding a little weight or distance each time.</p>
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
        </article>
      </section>

      <article className="post">
        <header>
          <div className="title">
            <h2>Checkpoints</h2>
            <p>Weigh in once a week, same time of day.</p>
          </div>
        </header>
        <div className="table-wrapper">
          <table className="alt">
            <thead>
              <tr>
                <th>Week</th>
                <th>Target weight</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {plan.milestones.map((m) => (
                <tr key={m.week}>
                  <td>{m.week}</td>
                  <td>{m.targetWeightKg} kg</td>
                  <td>{formatDate(m.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="post">
        <header>
          <div className="title">
            <h2>Habits</h2>
            <p>The part that decides the outcome.</p>
          </div>
        </header>
        <ul className="habits">
          {notes.map((note, i) => (
            <li key={note}>
              <span className="habit-index">{String(i + 1).padStart(2, '0')}</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>

        <ul className="actions plan-actions">
          <li>
            <button className="button primary icon solid fa-file-pdf" onClick={handlePrint}>
              Save as PDF
            </button>
          </li>
          <li>
            <a className="button icon solid fa-envelope" href={mailtoHref}>
              Email my plan
            </a>
          </li>
          <li>
            <button className="button" onClick={onEdit}>
              Edit details
            </button>
          </li>
          <li>
            <button className="button" onClick={onReset}>
              Start over
            </button>
          </li>
        </ul>
        <p className="hint plan-actions-hint">
          “Save as PDF” opens your browser’s print dialog — choose <em>Save as PDF</em> as the destination. “Email my
          plan” opens your mail app with the plan written into the message; nothing is sent from this page.
        </p>
      </article>
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
