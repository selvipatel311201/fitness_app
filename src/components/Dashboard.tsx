import type { Profile } from '../types';
import { GOAL_LABELS, buildPlan } from '../lib/calc';
import { buildMeals, dietNotes } from '../lib/mealPlan';
import { buildTrainingWeek } from '../lib/trainingPlan';

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

export function Dashboard({ profile, onEdit, onReset }: Props) {
  const plan = buildPlan(profile);
  const meals = buildMeals(profile, plan);
  const week = buildTrainingWeek(profile.goal, profile.activity);
  const notes = dietNotes(profile, plan);

  const elapsed = profile.days - plan.daysLeft;
  const progressPct = Math.min(100, Math.max(0, (elapsed / profile.days) * 100));
  const direction = plan.weightDeltaKg < 0 ? 'to lose' : plan.weightDeltaKg > 0 ? 'to gain' : 'to hold';

  return (
    <div className="dashboard">
      <section className="card hero">
        {profile.photo && <img className="avatar" src={profile.photo} alt="Your progress photo" />}
        <div className="hero-text">
          <h2>{profile.name ? `${profile.name}'s plan` : 'Your plan'}</h2>
          <p className="card-sub">
            {GOAL_LABELS[profile.goal]} · {Math.abs(plan.weightDeltaKg)} kg {direction} ·{' '}
            {plan.projectedDays > profile.days ? 'realistic finish ' : 'target '}
            {formatDate(plan.projectedDays > profile.days ? plan.projectedDate : plan.targetDate)}
          </p>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="progress-label">
            Day {Math.max(0, elapsed)} of {profile.days} · {plan.daysLeft} days left
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-ghost" onClick={onEdit}>
            Edit details
          </button>
          <button className="btn btn-ghost btn-danger" onClick={onReset}>
            Start over
          </button>
        </div>
      </section>

      <p className={`banner banner-${plan.safety.level}`}>{plan.safety.message}</p>

      <section className="stat-grid">
        <Stat label="Daily calories" value={plan.dailyCalories.toLocaleString()} unit="kcal" accent />
        <Stat
          label={plan.adjustment < 0 ? 'Daily deficit' : plan.adjustment > 0 ? 'Daily surplus' : 'At maintenance'}
          value={Math.abs(plan.adjustment).toLocaleString()}
          unit="kcal"
        />
        <Stat label="Maintenance (TDEE)" value={plan.tdee.toLocaleString()} unit="kcal" />
        <Stat label="Resting rate (BMR)" value={plan.bmr.toLocaleString()} unit="kcal" />
        <Stat label="BMI" value={String(plan.bmi)} unit={plan.bmiCategory} />
        <Stat label="Weekly change" value={`${plan.weeklyRateKg > 0 ? '+' : ''}${plan.weeklyRateKg}`} unit="kg / week" />
      </section>

      <section className="card">
        <h3>Daily macros</h3>
        <div className="macro-row">
          <Macro label="Protein" grams={plan.macros.proteinG} kcal={plan.macros.proteinG * 4} total={plan.dailyCalories} />
          <Macro label="Carbs" grams={plan.macros.carbsG} kcal={plan.macros.carbsG * 4} total={plan.dailyCalories} />
          <Macro label="Fat" grams={plan.macros.fatG} kcal={plan.macros.fatG * 9} total={plan.dailyCalories} />
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h3>Meal plan</h3>
          <p className="card-sub">Built around your {profile.diet.replace('-', ' ')} preference.</p>
          <ul className="meal-list">
            {meals.map((meal) => (
              <li key={meal.name}>
                <div className="meal-head">
                  <strong>{meal.name}</strong>
                  <span className="meal-time">{meal.time}</span>
                  <span className="pill">{meal.calories} kcal</span>
                </div>
                <p>{meal.idea}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>Training week</h3>
          <p className="card-sub">Repeat weekly and add a little weight or distance each time.</p>
          <ul className="week-list">
            {week.map((day) => (
              <li key={day.day}>
                <span className="day-tag">{day.day}</span>
                <div>
                  <strong>{day.focus}</strong>
                  <p>{day.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h3>Weekly checkpoints</h3>
        <ul className="milestones">
          {plan.milestones.map((m) => (
            <li key={m.week}>
              <span className="milestone-week">Week {m.week}</span>
              <span className="milestone-weight">{m.targetWeightKg} kg</span>
              <span className="milestone-date">{formatDate(m.date)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Habits that decide the outcome</h3>
        <ul className="notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <p className="disclaimer">
        These numbers are estimates from standard formulas (Mifflin-St Jeor, 7700 kcal per kg). They are not medical
        advice — check with a doctor before a big change, especially if you have a health condition.
      </p>
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className={`card stat${accent ? ' stat-accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-unit">{unit}</span>
    </div>
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
        <div className={`macro-fill macro-${label.toLowerCase()}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
