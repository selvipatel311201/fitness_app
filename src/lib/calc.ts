import type { ActivityLevel, Goal, Profile, Sex } from '../types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary — desk job, little exercise',
  light: 'Light — 1-3 workouts / week',
  moderate: 'Moderate — 3-5 workouts / week',
  active: 'Active — 6-7 workouts / week',
  athlete: 'Athlete — training twice a day',
};

export const GOAL_LABELS: Record<Goal, string> = {
  'lose-fat': 'Lose fat',
  'build-muscle': 'Build muscle',
  maintain: 'Maintain weight',
  endurance: 'Improve endurance',
};

/** Energy stored in a kilogram of body mass, in kcal. */
const KCAL_PER_KG = 7700;

/** Lowest daily intake we are willing to recommend, by sex. */
const CALORIE_FLOOR: Record<Sex, number> = {
  male: 1500,
  female: 1200,
  other: 1350,
};

export type SafetyLevel = 'ok' | 'aggressive' | 'unrealistic';

export interface Milestone {
  week: number;
  date: string;
  targetWeightKg: number;
}

export interface Plan {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  /** Daily intake we recommend, after safety clamping. */
  dailyCalories: number;
  /** Daily surplus (+) or deficit (-) vs. maintenance. */
  adjustment: number;
  weightDeltaKg: number;
  /** Pace the recommended calorie target actually produces. */
  weeklyRateKg: number;
  /** Days the effective pace needs — longer than `days` if the ask was clamped. */
  projectedDays: number;
  safety: { level: SafetyLevel; message: string };
  macros: { proteinG: number; carbsG: number; fatG: number };
  waterMl: number;
  stepsTarget: number;
  /** Date the requested timeline ends. */
  targetDate: string;
  /** Date the effective pace actually lands on. */
  projectedDate: string;
  daysLeft: number;
  milestones: Milestone[];
}

export function calcBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy range';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/** Mifflin-St Jeor resting metabolic rate. */
export function calcBmr(p: Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  const offset = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  return base + offset;
}

export function calcTdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activity];
}

function proteinPerKg(goal: Goal): number {
  switch (goal) {
    case 'build-muscle':
      return 2.0;
    case 'lose-fat':
      return 1.8;
    case 'endurance':
      return 1.6;
    case 'maintain':
      return 1.6;
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`).getTime();
  const to = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function buildPlan(p: Profile): Plan {
  const bmi = calcBmi(p.heightCm, p.weightKg);
  const bmr = calcBmr(p);
  const tdee = calcTdee(bmr, p.activity);

  const weightDeltaKg = p.targetWeightKg - p.weightKg;
  const requestedWeeklyRateKg = weightDeltaKg / (p.days / 7);

  // Calories needed per day to move the requested amount in the requested time.
  const rawAdjustment = (weightDeltaKg * KCAL_PER_KG) / p.days;

  // Clamp to something a body can actually do: up to ~1% of bodyweight per week
  // coming off, but only ~0.5% going on (past that it is mostly fat), and never
  // below the calorie floor for the user's sex.
  const maxWeeklyRate = p.weightKg * (weightDeltaKg < 0 ? 0.01 : 0.005);
  const rateRatio = Math.abs(requestedWeeklyRateKg) / maxWeeklyRate;
  const maxAdjustment = (maxWeeklyRate * KCAL_PER_KG) / 7;

  const cappedAdjustment =
    Math.sign(rawAdjustment) * Math.min(Math.abs(rawAdjustment), maxAdjustment);

  const floor = CALORIE_FLOOR[p.sex];
  let dailyCalories = tdee + cappedAdjustment;
  let clampedByFloor = false;
  if (dailyCalories < floor) {
    dailyCalories = floor;
    clampedByFloor = true;
  }

  // The pace the clamped calorie target will actually produce. Everything the
  // user sees — weekly rate, checkpoints, projected finish — is built off this
  // rather than off what they asked for, so the plan never promises a pace its
  // own calorie number cannot deliver.
  const effectiveWeeklyRateKg = ((dailyCalories - tdee) * 7) / KCAL_PER_KG;
  const projectedDays =
    Math.abs(effectiveWeeklyRateKg) < 0.01
      ? p.days
      : Math.ceil((Math.abs(weightDeltaKg) / Math.abs(effectiveWeeklyRateKg)) * 7);

  let level: SafetyLevel = 'ok';
  let message = 'This pace is sustainable. Stay consistent and you will land on time.';

  if (Math.abs(weightDeltaKg) < 0.5) {
    message = 'You are at your target weight — this plan holds you there while you train.';
  } else if (clampedByFloor || rateRatio > 1) {
    level = 'unrealistic';
    message =
      `${Math.abs(weightDeltaKg).toFixed(1)} kg in ${p.days} days is faster than is safe. ` +
      `The plan below uses the fastest healthy pace instead — about ${projectedDays} days, ` +
      `landing around ${formatShortDate(addDays(p.startedOn, projectedDays))}.`;
  } else if (rateRatio > 0.75) {
    level = 'aggressive';
    message = 'This is an aggressive but doable pace. Expect real hunger or fatigue on training days.';
  }

  // Protein is set off the lighter of current/target weight so a large cut does
  // not inflate the number, but never off less than 80% of current weight.
  const referenceWeight = Math.max(Math.min(p.weightKg, p.targetWeightKg), p.weightKg * 0.8);
  const proteinG = Math.round(proteinPerKg(p.goal) * referenceWeight);
  const fatG = Math.round((dailyCalories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4));

  const targetDate = addDays(p.startedOn, p.days);
  const daysLeft = Math.max(0, daysBetween(todayIso(), targetDate));

  // Checkpoints follow the effective rate and stop once the target is reached.
  const milestones: Milestone[] = [];
  const totalWeeks = Math.min(12, Math.ceil(projectedDays / 7));
  for (let week = 1; week <= totalWeeks; week++) {
    const moved = effectiveWeeklyRateKg * week;
    const capped =
      weightDeltaKg === 0
        ? 0
        : weightDeltaKg < 0
          ? Math.max(moved, weightDeltaKg)
          : Math.min(moved, weightDeltaKg);
    milestones.push({
      week,
      date: addDays(p.startedOn, week * 7),
      targetWeightKg: Number((p.weightKg + capped).toFixed(1)),
    });
  }

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiCategory: bmiCategory(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories: Math.round(dailyCalories),
    adjustment: Math.round(dailyCalories - tdee),
    weightDeltaKg: Number(weightDeltaKg.toFixed(1)),
    weeklyRateKg: Number(effectiveWeeklyRateKg.toFixed(2)),
    projectedDays,
    safety: { level, message },
    macros: { proteinG, carbsG, fatG },
    waterMl: Math.round((p.weightKg * 35) / 100) * 100,
    stepsTarget: p.goal === 'lose-fat' ? 10_000 : 8_000,
    targetDate,
    projectedDate: addDays(p.startedOn, projectedDays),
    daysLeft,
    milestones,
  };
}
