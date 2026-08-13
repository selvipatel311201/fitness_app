import type { Profile } from '../../types';
import { GOAL_LABELS, buildPlan, todayIso } from '../calc';
import { buildMeals } from '../mealPlan';
import { buildTrainingWeek } from '../trainingPlan';
import { EXERCISES, findExercise, findGroup, suggestExercises, youTubeLinks } from './exercises';
import { normalizeTypos } from './text';
import { FACT_LABELS, type Facts, missingFacts } from './facts';

export interface Reply {
  text: string;
  /** Tappable follow-ups, so the user never has to guess what to say. */
  chips?: string[];
  /** Set when Fitty has enough to build a real plan the app can save. */
  profile?: Profile;
  /** The fact this reply is asking for, so the next answer is read in context. */
  asking?: keyof Facts;
  /** Exercise names this reply covered, so the next request brings new ones. */
  showed?: string[];
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
      'Videos:',
      ...youTubeLinks(exercise).map((link) => `• [${link.label}](${link.url})`),
    ].join('\n'),
    chips: ['Show me more exercises', 'What should I eat today?'],
    showed: [exercise.name],
  };
}

/** Answers "leg exercise" and friends: the best movement in full, then options. */
function groupAnswer(text: string): Reply | null {
  const match = findGroup(text);
  if (!match) return null;
  const [lead, ...rest] = match.exercises;
  return {
    text: [
      // "the squat" reads fine; "the running" does not.
      `For **${match.group.label}**, start with ${/ing$/.test(lead.name) ? '' : 'the '}${lead.name.toLowerCase()} — it works your ${lead.targets}.`,
      '',
      ...lead.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `⚠️ Watch out: ${lead.watchOut}`,
      `Start with: ${lead.starter}`,
      `• [Watch: ${lead.name} form tutorial](${youTubeLinks(lead)[0].url})`,
      `• [Watch: ${lead.name} common mistakes](${youTubeLinks(lead)[1].url})`,
      '',
      rest.length > 0 ? `Also worth learning for ${match.group.label}:` : '',
      ...rest.map((e) => `• **${e.name}** — ${e.starter} [Watch](${youTubeLinks(e)[0].url})`),
    ]
      .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
      .join('\n'),
    chips: rest.length > 0 ? [`How do I do a ${rest[0].name.toLowerCase()}?`, 'Show me more exercises'] : ['Show me more exercises'],
    showed: match.exercises.map((e) => e.name),
  };
}

/** Several movements at once, each with its own video. */
function exerciseRoundup(goal: string | undefined, exclude: string[] = [], count = 3): Reply {
  const picks = suggestExercises(goal, count, exclude);
  return {
    text: [
      goal ? 'Three worth learning for your goal, with a video each:' : 'Three good ones to start with, with a video each:',
      '',
      ...picks.flatMap((exercise) => [
        `**${exercise.name}** — ${exercise.targets}. ${exercise.starter}`,
        `• [Watch: ${exercise.name} form tutorial](${youTubeLinks(exercise)[0].url})`,
        `• [Watch: ${exercise.name} common mistakes](${youTubeLinks(exercise)[1].url})`,
        '',
      ]),
      'Ask me about any of them and I will walk you through the steps.',
    ].join('\n'),
    chips: [`How do I do a ${picks[0].name.toLowerCase()}?`, 'Show me more exercises'],
    showed: picks.map((p) => p.name),
  };
}

function askForNext(facts: Facts, previouslyAsked?: keyof Facts): Reply {
  const missing = missingFacts(facts);
  const known = (Object.keys(facts) as Array<keyof Facts>).filter((k) => facts[k] !== undefined);

  const next = missing[0];

  // The same question a second time means the last answer didn't parse. Ask
  // differently and say exactly what will work, rather than repeating verbatim.
  if (previouslyAsked && previouslyAsked === next) {
    const retries: Partial<Record<keyof Facts, { text: string; chips?: string[] }>> = {
      age: { text: "Sorry, I didn't catch that. Just the number is fine — like 24." },
      sex: { text: 'Tap one of these so I can pick the right formula:', chips: ['Male', 'Female', 'Prefer not to say'] },
      heightCm: { text: 'Give me a number — "165 cm" or "5\'6" both work.' },
      weightKg: { text: 'Just the number is fine — "70 kg" or "154 lbs".' },
      targetWeightKg: { text: 'The weight you want to reach — a number like 62 works.' },
      goal: { text: 'Pick whichever is closest:', chips: ['Lose fat', 'Build muscle', 'Maintain weight', 'Improve endurance'] },
      diet: { text: 'Which one fits you best?', chips: ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian'] },
      activity: { text: 'Roughly how many days a week do you train? A number works too.', chips: ['0', '2', '4', '6'] },
      days: { text: 'How many days do you want to give it? A number like 90 is fine.', chips: ['60 days', '90 days', '180 days'] },
    };
    const retry = retries[next];
    if (retry) return { ...retry, asking: next };
  }
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

  return { text: acknowledgement + prompt.text, chips: prompt.chips, asking: next };
}

interface Context {
  facts: Facts;
  profile: Profile | null;
  /** True on the very first exchange. */
  isFirstMessage: boolean;
  /** The fact Fitty asked for last turn, if any. */
  lastAsked?: keyof Facts;
  /** Exercises already shown, so a repeat request brings different ones. */
  shown?: string[];
}

/**
 * Deterministic coach. Everything here runs in the browser with no API key and
 * no network, which is what lets the page keep its no-upload promise.
 */
export function respond(input: string, ctx: Context): Reply {
  // Repair near-miss spellings first: "leg excerice" must reach the same
  // branches as "leg exercise".
  const text = normalizeTypos(input.trim());
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

  // A named exercise always wins — the single answer already carries three
  // links, so "video for squats" lands here rather than in the roundup.
  if (/\b(how (do|to|should)|form|technique|proper way|teach me|show me|video|youtube|link|watch)\b/.test(t) || /^(squat|deadlift|plank|burpee|lunge)s?\b/.test(t)) {
    const answer = exerciseAnswer(text);
    if (answer) return answer;
  }

  // A body part — "leg exercise", "ab workout", "something for my back".
  const groupReply = groupAnswer(text);
  if (groupReply && /\b(exercise|exercises|workout|workouts|move|moves|movement|train|training|how|what|which|best|good|routine|day|stretch|video|link|something|anything|help|need|want|give|show|suggest|recommend|tips?|for my|strengthen|tone|build)\b/.test(t)) {
    return groupReply;
  }

  // Asking for videos, links, or exercises in general — hand over several.
  if (/\b(videos?|youtube|links?|clips?|tutorials?)\b/.test(t) || /\b(more|other|another|different|some|few|list of|examples? of)\b.*\b(exercises?|workouts?|moves?|movements?)\b/.test(t) || /\b(exercises?|moves?)\b.*\b(list|examples?|ideas?|suggest)/.test(t)) {
    return exerciseRoundup(profile?.goal ?? ctx.facts.goal, ctx.shown ?? []);
  }

  // Only for genuine "how do I perform X" questions. Matching a bare
  // "workout" here would swallow "what's my workout today?".
  if (/\b(how (do|to|should|can)|form|technique|proper way|teach me|show me how)\b/.test(t)) {
    return {
      text: [
        `I don't know that exact one, but I can walk you through any of these: ${EXERCISES.map((e) => e.name.toLowerCase()).join(', ')}.`,
        '',
        'You can also ask by body part — legs, chest, back, core, arms or cardio.',
      ].join('\n'),
      chips: ['Leg exercises', 'Core exercises', 'How do I do a squat?'],
    };
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
    return askForNext(ctx.facts, ctx.lastAsked);
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

  return askForNext(ctx.facts, ctx.lastAsked);
}

function plansafeDelta(profile: Profile): number {
  return Number((profile.targetWeightKg - profile.weightKg).toFixed(1));
}

export { planSummary, titleCase, GOAL_LABELS };
