import type { Profile } from '../types';
import { GOAL_LABELS, type Plan } from './calc';
import type { Meal } from './mealPlan';
import type { TrainingDay } from './trainingPlan';

/**
 * Practical ceiling for a mailto: URL. Windows caps the command line around
 * 2048 characters and long links get truncated silently, so the builder falls
 * back to a shorter body rather than handing over a clipped plan.
 */
const MAILTO_LIMIT = 1900;

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface Parts {
  profile: Profile;
  plan: Plan;
  meals: Meal[];
  week: TrainingDay[];
}

interface TextOptions {
  /** Include what each training session actually is, not just its name. */
  detail?: boolean;
  /** Include the weekly weight checkpoints. */
  checkpoints?: boolean;
}

/** Plain-text plan. The flags exist so a mailto can be trimmed to fit. */
export function buildPlanText(
  { profile, plan, meals, week }: Parts,
  { detail = true, checkpoints = true }: TextOptions = {},
): string {
  const who = profile.name ? `${profile.name}'s plan` : 'My plan';
  const finish = plan.safety.level === 'unrealistic' ? plan.projectedDate : plan.targetDate;

  const lines: string[] = [
    `FITPLAN — ${who}`,
    `${GOAL_LABELS[profile.goal]} · ${profile.weightKg} kg → ${profile.targetWeightKg} kg · ` +
      `${profile.days} days · finish ${shortDate(finish)}`,
    '',
    'DAILY TARGETS',
    `Calories: ${plan.dailyCalories.toLocaleString()} kcal ` +
      `(${plan.adjustment === 0 ? 'at maintenance' : `${Math.abs(plan.adjustment)} ${plan.adjustment < 0 ? 'below' : 'above'} maintenance`})`,
    `Protein ${plan.macros.proteinG} g · Carbs ${plan.macros.carbsG} g · Fat ${plan.macros.fatG} g`,
    `Water ${(plan.waterMl / 1000).toFixed(1)} L · Steps ${plan.stepsTarget.toLocaleString()}`,
    `Expected change: ${plan.weeklyRateKg > 0 ? '+' : ''}${plan.weeklyRateKg} kg per week`,
    '',
    'MEALS',
    ...meals.map((m) => `${m.name} (${m.time}, ${m.calories} kcal): ${m.idea}`),
    '',
    'TRAINING',
    ...week.map((d) => (detail ? `${d.day} — ${d.focus}: ${d.detail}` : `${d.day} — ${d.focus}`)),
  ];

  if (checkpoints) {
    lines.push(
      '',
      'CHECKPOINTS',
      ...plan.milestones.map((m) => `Week ${m.week} (${shortDate(m.date)}): ${m.targetWeightKg} kg`),
    );
  }

  lines.push('', 'Estimates from standard formulas, not medical advice.');
  return lines.join('\n');
}

export function planSubject(profile: Profile): string {
  const who = profile.name ? `${profile.name}'s` : 'My';
  return `${who} ${profile.days}-day ${GOAL_LABELS[profile.goal].toLowerCase()} plan`;
}

/**
 * mailto: link with the plan in the body. No recipient — the mail client asks.
 * Nothing is sent from the page itself, so the plan stays on this device until
 * the user presses send.
 */
export function buildMailtoHref(parts: Parts): string {
  const subject = encodeURIComponent(planSubject(parts.profile));

  // Shed the least useful part first: checkpoints can be recreated from the
  // weekly rate, the training detail cannot.
  const attempts: TextOptions[] = [
    { detail: true, checkpoints: true },
    { detail: true, checkpoints: false },
    { detail: false, checkpoints: false },
  ];

  let href = '';
  for (const options of attempts) {
    href = `mailto:?subject=${subject}&body=${encodeURIComponent(buildPlanText(parts, options))}`;
    if (href.length <= MAILTO_LIMIT) return href;
  }
  return href;
}

/** File name used for the PDF, via the document title the print dialog reads. */
export function planFileName(profile: Profile): string {
  const who = profile.name ? profile.name.replace(/[^\w-]+/g, '-') : 'plan';
  return `FitPlan-${who}-${profile.days}-days`;
}
