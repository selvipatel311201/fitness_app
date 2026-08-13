import type { ActivityLevel, DietPreference, Goal, Sex } from '../../types';

/** What Fitty has managed to learn about the user so far. */
export interface Facts {
  name?: string;
  age?: number;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  goal?: Goal;
  diet?: DietPreference;
  activity?: ActivityLevel;
  days?: number;
}

export const FACT_LABELS: Record<keyof Facts, string> = {
  name: 'your name',
  age: 'your age',
  sex: 'whether you are male or female',
  heightCm: 'your height',
  weightKg: 'your weight',
  targetWeightKg: 'your target weight',
  goal: 'your goal',
  diet: 'what you eat',
  activity: 'how much you train',
  days: 'how many days you want',
};

/** Everything needed before a full plan can be built. */
export const REQUIRED: Array<keyof Facts> = [
  'age',
  'sex',
  'heightCm',
  'weightKg',
  'targetWeightKg',
  'goal',
  'diet',
  'activity',
  'days',
];

function num(match: RegExpMatchArray | null, group = 1): number | undefined {
  if (!match) return undefined;
  const value = Number(match[group]);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Pulls whatever facts a sentence happens to contain. Deliberately forgiving —
 * people type "24yo 5'8 165lbs veg" as readily as full sentences.
 */
export function extractFacts(input: string): Facts {
  const t = ` ${input.toLowerCase().replace(/[,]/g, ' ')} `;
  const facts: Facts = {};

  // --- name ---------------------------------------------------------------
  const name =
    input.match(/\bmy name is ([a-z][a-z' -]{1,30})/i) ||
    input.match(/\bi(?:'m| am) ([a-z][a-z' -]{1,30})\b(?!\s*\d)/i) ||
    input.match(/\bcall me ([a-z][a-z' -]{1,30})/i);
  if (name) {
    const candidate = name[1].trim();
    // "I'm tired" / "I am hungry" should not become a name.
    if (!/^(a|an|the|tired|hungry|fat|thin|fine|good|ok|okay|male|female|man|woman|vegetarian|vegan|here|back|new|trying|looking|ready|sure)$/i.test(candidate)) {
      facts.name = candidate.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  // --- age ----------------------------------------------------------------
  facts.age =
    num(t.match(/\b(\d{2})\s*(?:years?\s*old|yrs?\s*old|yo\b|y\/o)/)) ??
    num(t.match(/\bage\s*(?:is|:)?\s*(\d{2})\b/)) ??
    num(t.match(/\bi(?:'m| am)\s*(\d{2})\b(?!\s*(?:kg|kgs|lb|lbs|cm))/));

  // --- sex ----------------------------------------------------------------
  if (/\b(female|woman|girl|she\/her)\b/.test(t)) facts.sex = 'female';
  else if (/\b(male|man|boy|he\/him)\b/.test(t)) facts.sex = 'male';

  // --- height -------------------------------------------------------------
  const cm = num(t.match(/\b(\d{2,3})\s*(?:cm|centimet)/));
  const feetInches = t.match(/\b(\d)\s*(?:'|ft|feet|foot)\s*(\d{1,2})?\s*(?:"|in|inch|inches)?/);
  if (cm && cm >= 100 && cm <= 250) {
    facts.heightCm = cm;
  } else if (feetInches) {
    const feet = Number(feetInches[1]);
    const inches = feetInches[2] ? Number(feetInches[2]) : 0;
    const value = Math.round(feet * 30.48 + inches * 2.54);
    if (value >= 100 && value <= 250) facts.heightCm = value;
  }

  // --- weight (current and target) ----------------------------------------
  const kg = num(t.match(/\b(\d{2,3}(?:\.\d)?)\s*(?:kg|kgs|kilo)/));
  const lb = num(t.match(/\b(\d{2,3}(?:\.\d)?)\s*(?:lb|lbs|pound)/));
  const currentWeight = kg ?? (lb !== undefined ? Math.round(lb * 0.4536 * 10) / 10 : undefined);
  if (currentWeight && currentWeight >= 30 && currentWeight <= 300) facts.weightKg = currentWeight;

  const targetRaw =
    t.match(/(?:target|goal|want to (?:be|reach|get to|weigh)|get to|down to|up to|reach)\s*(?:weight\s*)?(?:is|of|:)?\s*(\d{2,3}(?:\.\d)?)\s*(kg|kgs|lb|lbs|pound)?/) ||
    null;
  if (targetRaw) {
    const raw = Number(targetRaw[1]);
    const isPounds = /lb|pound/.test(targetRaw[2] ?? '') || (!targetRaw[2] && lb !== undefined && kg === undefined);
    const value = isPounds ? Math.round(raw * 0.4536 * 10) / 10 : raw;
    if (value >= 30 && value <= 300) facts.targetWeightKg = value;
  }

  // A bare second weight in the same sentence reads as the target.
  if (facts.weightKg && !facts.targetWeightKg) {
    const all = [...t.matchAll(/\b(\d{2,3}(?:\.\d)?)\s*(?:kg|kgs|lb|lbs)/g)].map((m) => Number(m[1]));
    if (all.length >= 2) {
      const second = all[1];
      const asKg = /lb|lbs/.test(t) && !/kg/.test(t) ? Math.round(second * 0.4536 * 10) / 10 : second;
      if (asKg >= 30 && asKg <= 300 && asKg !== facts.weightKg) facts.targetWeightKg = asKg;
    }
  }

  // --- goal ---------------------------------------------------------------
  if (/\b(lose|losing|cut|cutting|drop|shed|slim|fat loss|weight loss|lean out)\b/.test(t)) facts.goal = 'lose-fat';
  else if (/\b(gain|bulk|build muscle|muscle|mass|bigger|stronger|strength)\b/.test(t)) facts.goal = 'build-muscle';
  else if (/\b(endurance|stamina|marathon|running|run a|cardio fitness|5k|10k)\b/.test(t)) facts.goal = 'endurance';
  else if (/\b(maintain|maintenance|stay the same|keep my weight|tone)\b/.test(t)) facts.goal = 'maintain';

  // --- diet ---------------------------------------------------------------
  if (/\bvegan\b/.test(t)) facts.diet = 'vegan';
  else if (/\b(eggetarian|eggitarian|veg \+ egg|veg with egg)\b/.test(t)) facts.diet = 'eggetarian';
  else if (/\b(non[- ]?veg|nonveg|meat|chicken eater|omnivore)\b/.test(t)) facts.diet = 'non-vegetarian';
  else if (/\b(vegetarian|veggie|\bveg\b)\b/.test(t)) facts.diet = 'vegetarian';

  // --- activity -----------------------------------------------------------
  if (/\b(sedentary|desk job|no exercise|never exercise|not active|couch)\b/.test(t)) facts.activity = 'sedentary';
  else if (/\b(athlete|twice a day|two a day|professional|competitive)\b/.test(t)) facts.activity = 'athlete';
  else if (/\b(very active|6 days|7 days|six days|seven days|daily workout|every day)\b/.test(t)) facts.activity = 'active';
  else if (/\b(beginner|just start|light|1-2|1 to 2|once a week|twice a week|2 days)\b/.test(t)) facts.activity = 'light';
  else if (/\b(moderate|3-5|3 to 5|3 days|4 days|5 days|few times|intermediate)\b/.test(t)) facts.activity = 'moderate';

  // --- timeline -----------------------------------------------------------
  // "3-5 days a week" is training frequency, not a deadline — strip those
  // phrases first or "5 days" gets read as the whole timeline.
  const timeline = t.replace(/\b\d{1,2}\s*(?:-|–|to)?\s*\d{0,2}\s*(?:days?|times?|sessions?|x)\s*(?:a|per|\/|each)\s*week\b/g, ' ');
  const days = num(timeline.match(/\b(\d{1,3})\s*days?\b/));
  const weeks = num(timeline.match(/\b(\d{1,3})\s*weeks?\b/));
  const months = num(timeline.match(/\b(\d{1,2})\s*months?\b/));
  if (days) facts.days = days;
  else if (weeks) facts.days = weeks * 7;
  else if (months) facts.days = months * 30;

  // Strip anything that came out nonsensical.
  (Object.keys(facts) as Array<keyof Facts>).forEach((k) => {
    if (facts[k] === undefined) delete facts[k];
  });
  return facts;
}

export function missingFacts(facts: Facts): Array<keyof Facts> {
  return REQUIRED.filter((k) => facts[k] === undefined);
}
