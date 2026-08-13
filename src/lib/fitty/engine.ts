import type { Profile } from '../../types';
import { GOAL_LABELS, buildPlan, todayIso } from '../calc';
import { buildMeals } from '../mealPlan';
import { buildTrainingWeek } from '../trainingPlan';
import { findExercise, youTubeLink } from './exercises';
import { FACT_LABELS, type Facts, missingFacts } from './facts';

export interface Reply {
  text: string;
  /** Tappable follow-ups, so the user never has to guess what to say. */
  chips?: string[];
  /** Set when Fitty has enough to build a real plan the app can save. */
  profile?: Profile;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Facts become a Profile only once everything required is present. */
export function factsToProfile(facts: Facts, existing?: Profile | null): Profile | null {
  if (missingFacts(facts).length > 0) return null;
  return {
    name: facts.name ?? existing?.name ?? '',
    age: facts.age!,
    sex: facts.sex!,
    heightCm: facts.heightCm!,
    weightKg: facts.weightKg!,
    targetWeightKg: facts.targetWeightKg!,
    activity: facts.activity!,
    goal: facts.goal!,
    diet: facts.diet!,
    avoidFoods: existing?.avoidFoods ?? '',
    days: Math.round(facts.days!),
    photo: existing?.photo ?? null,
    startedOn: existing?.startedOn ?? todayIso(),
  };
}

function planSummary(profile: Profile): string {
  const plan = buildPlan(profile);
  const direction = plan.adjustment < 0 ? 'below' : plan.adjustment > 0 ? 'above' : 'at';
  const lines = [
    `Here's your plan${profile.name ? `, ${profile.name}` : ''}:`,
    '',
    `• Eat ${plan.dailyCalories.toLocaleString()} kcal a day — ${Math.abs(plan.adjustment)} ${direction} maintenance.`,
    `• Protein ${plan.macros.proteinG}g, carbs ${plan.macros.carbsG}g, fat ${plan.macros.fatG}g.`,
    `• Expect about ${Math.abs(plan.weeklyRateKg)} kg per week.`,
    `• Water ${(plan.waterMl / 1000).toFixed(1)} L, and ${plan.stepsTarget.toLocaleString()} steps outside training.`,
  ];
  if (plan.safety.level !== 'ok') lines.push('', plan.safety.message);
  return lines.join('\n');
}

function mealAnswer(profile: Profile): string {
  const plan = buildPlan(profile);
  const meals = buildMeals(profile, plan);
  return [
    `Your ${profile.diet.replace('-', ' ')} day, ${plan.dailyCalories.toLocaleString()} kcal total:`,
    '',
    ...meals.map((m) => `• ${m.name} (${m.time}) — ${m.idea}. About ${m.calories} kcal.`),
    '',
    `Hit ${plan.macros.proteinG}g of protein across those four and the rest takes care of itself.`,
  ].join('\n');
}

function trainingAnswer(profile: Profile): string {
  const week = buildTrainingWeek(profile.goal, profile.activity);
  const today = new Date().getDay(); // 0 = Sunday
  const index = today === 0 ? 6 : today - 1;
  const todayPlan = week[index];
  return [
    `Today (${todayPlan.day}) is **${todayPlan.focus}** — ${todayPlan.detail}`,
    '',
    'Your week:',
    ...week.map((d) => `• ${d.day} — ${d.focus}`),
  ].join('\n');
}

function exerciseAnswer(text: string): Reply | null {
  const exercise = findExercise(text);
  if (!exercise) return null;
  return {
    text: [
      `**${exercise.name}** — works your ${exercise.targets}.`,
      '',
      ...exercise.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `⚠️ Watch out: ${exercise.watchOut}`,
      `Start with: ${exercise.starter}`,
      '',
      `Watch it done properly: ${youTubeLink(exercise)}`,
    ].join('\n'),
    chips: ['Show me another exercise', 'What should I eat today?'],
  };
}

function askForNext(facts: Facts): Reply {
  const missing = missingFacts(facts);
  const known = (Object.keys(facts) as Array<keyof Facts>).filter((k) => facts[k] !== undefined);

  const next = missing[0];
  const prompts: Partial<Record<keyof Facts, { text: string; chips?: string[] }>> = {
    age: { text: 'How old are you?' },
    sex: { text: 'And are you male or female? I only need it for the metabolism formula.', chips: ['Male', 'Female'] },
    heightCm: { text: 'How tall are you? Centimetres or feet and inches both work.' },
    weightKg: { text: 'What do you weigh right now?' },
    targetWeightKg: { text: 'What weight are you aiming for?' },
    goal: {
      text: 'What are you going for?',
      chips: ['Lose fat', 'Build muscle', 'Maintain weight', 'Improve endurance'],
    },
    diet: {
      text: 'How do you eat?',
      chips: ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian'],
    },
    activity: {
      text: 'How much do you train at the moment?',
      chips: ['Barely at all', '1-2 days a week', '3-5 days a week', '6-7 days a week'],
    },
    days: { text: 'How many days do you want to give it? 90 is a good first block.', chips: ['60 days', '90 days', '180 days'] },
  };

  const prompt = prompts[next] ?? { text: 'Tell me a bit more about yourself.' };
  const acknowledgement =
    known.length > 0 && missing.length <= 3
      ? `Nearly there — I still need ${missing.map((m) => FACT_LABELS[m]).join(', ')}.\n\n`
      : '';

  return { text: acknowledgement + prompt.text, chips: prompt.chips };
}

interface Context {
  facts: Facts;
  profile: Profile | null;
  /** True on the very first exchange. */
  isFirstMessage: boolean;
}

/**
 * Deterministic coach. Everything here runs in the browser with no API key and
 * no network, which is what lets the page keep its no-upload promise.
 */
export function respond(input: string, ctx: Context): Reply {
  const text = input.trim();
  const t = text.toLowerCase();
  const profile = ctx.profile;

  if (!text) return { text: 'Say anything — even "help" works.' };

  // Greetings and small talk.
  if (/^(hi|hey|hello|yo|hiya|good (morning|evening|afternoon))\b/.test(t) && text.length < 25) {
    return {
      text: profile
        ? `Hey${profile.name ? ` ${profile.name}` : ''}! What do you need — food, training, or a form check?`
        : "Hi, I'm Fitty, your coach. Tell me about yourself and I'll build you a plan — age, height, weight, what you're going for.",
      chips: profile
        ? ['What should I eat today?', "What's my workout today?", 'How do I do a squat?']
        : ["I'm 24, 165cm, 70kg, want to lose fat", 'What can you do?'],
    };
  }

  if (/\b(help|what can you do|how does this work|commands)\b/.test(t)) {
    return {
      text: [
        "I'm Fitty. Here's what I'm good for:",
        '',
        '• Building you a calorie, macro and meal plan from your details',
        '• Telling you what to train today and for the rest of the week',
        '• Explaining any exercise simply, with a video to watch',
        '• Answering "how much protein", "am I on track", "what do I eat"',
        '',
        'Everything stays in your browser. I never send your details anywhere.',
      ].join('\n'),
      chips: ["What's my workout today?", 'How do I do a deadlift?', 'What should I eat today?'],
    };
  }

  // "How do I do X" — check before profile questions so it works immediately.
  if (/\b(how (do|to|should)|form|technique|proper way|teach me|show me)\b/.test(t) || /^(squat|deadlift|plank|burpee|lunge)s?\b/.test(t)) {
    const answer = exerciseAnswer(text);
    if (answer) return answer;
    if (/\bexercise\b|\bmove\b/.test(t)) {
      return {
        text: "I don't know that one yet. I can walk you through squats, push-ups, deadlifts, planks, lunges, overhead press, rows, pull-ups, hip thrusts, burpees, running and curls.",
        chips: ['How do I do a squat?', 'How do I do a push-up?'],
      };
    }
  }

  // A bare exercise name anywhere in the message.
  const bareExercise = findExercise(t);
  if (bareExercise && text.split(/\s+/).length <= 4) {
    return exerciseAnswer(text)!;
  }

  // Questions that need a profile.
  const wantsFood = /\b(eat|food|meal|diet|breakfast|lunch|dinner|snack|calorie|kcal|macro|protein|carb|fat)\b/.test(t);
  const wantsTraining = /\b(workout|train|training|exercise|gym|routine|split|today|week)\b/.test(t);
  const wantsProgress = /\b(on track|progress|how am i|weigh|weight loss so far|check ?in)\b/.test(t);

  if (!profile && (wantsFood || wantsTraining || wantsProgress)) {
    return askForNext(ctx.facts);
  }

  if (profile) {
    if (/\b(protein)\b/.test(t)) {
      const plan = buildPlan(profile);
      return {
        text: `${plan.macros.proteinG}g a day. Split it across your four meals — about ${Math.round(plan.macros.proteinG / 4)}g each — rather than loading it all at dinner.`,
        chips: ['What should I eat today?'],
      };
    }
    if (/\b(calorie|kcal|how much should i eat|macro)\b/.test(t)) {
      const plan = buildPlan(profile);
      return {
        text: `${plan.dailyCalories.toLocaleString()} kcal a day. That's ${plan.macros.proteinG}g protein, ${plan.macros.carbsG}g carbs, ${plan.macros.fatG}g fat. Your maintenance is ${plan.tdee.toLocaleString()}.`,
        chips: ['What should I eat today?', "What's my workout today?"],
      };
    }
    if (wantsFood) {
      return { text: mealAnswer(profile), chips: ["What's my workout today?", 'How much protein?'] };
    }
    if (wantsTraining) {
      return { text: trainingAnswer(profile), chips: ['How do I do a squat?', 'What should I eat today?'] };
    }
    if (wantsProgress) {
      const plan = buildPlan(profile);
      const elapsed = Math.max(0, profile.days - plan.daysLeft);
      return {
        text: [
          `Day ${elapsed} of ${profile.days}, ${plan.daysLeft} to go.`,
          `Target for this week: ${plan.milestones[0]?.targetWeightKg ?? profile.targetWeightKg} kg.`,
          '',
          'Weigh yourself once a week at the same time of day. Daily swings are mostly water and will mess with your head.',
        ].join('\n'),
        chips: ['What should I eat today?', "What's my workout today?"],
      };
    }
    if (/\b(motivat|lazy|giv(e|ing) up|quit|struggl|demotivated|discouraged|can'?t do this|too hard|no energy|exhausted|failing)/.test(t)) {
      return {
        text: [
          "Everyone has these days — they're not a sign you're doing it wrong.",
          '',
          `You're ${Math.abs(plansafeDelta(profile))} kg from where you want to be, and the plan only asks for one good decision at a time.`,
          "If today feels impossible, do the smallest version: a 20-minute walk and hit your protein. That still counts, and it keeps the streak alive.",
        ].join('\n'),
        chips: ["What's my workout today?"],
      };
    }
  }

  // Profile is complete but the question didn't match anything — offer routes
  // rather than repeating the whole plan at them.
  const missing = missingFacts(ctx.facts);
  if (missing.length === 0 && profile) {
    if (/\b(plan|summary|my numbers|recap|again)\b/.test(t)) {
      return { text: planSummary(profile), chips: ['What should I eat today?', "What's my workout today?"] };
    }
    return {
      text: "I'm not sure I follow — I'm best on food, training, and how to do a movement properly. Which one?",
      chips: ['What should I eat today?', "What's my workout today?", 'How do I do a squat?', 'Show my plan'],
    };
  }

  if (ctx.isFirstMessage) {
    return {
      text: "I'm Fitty, your fitness coach. Tell me your age, height, weight, what you're aiming for and how you eat, and I'll put a plan together. You can do it all in one message or one at a time.",
      chips: ["I'm 24, 165cm, 70kg, want to lose fat", 'What can you do?'],
    };
  }

  return askForNext(ctx.facts);
}

function plansafeDelta(profile: Profile): number {
  return Number((profile.targetWeightKg - profile.weightKg).toFixed(1));
}

export { planSummary, titleCase, GOAL_LABELS };
