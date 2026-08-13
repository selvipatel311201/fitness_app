import { fuzzyIncludes } from './text';

export interface Exercise {
  name: string;
  /** Words a user might type for this movement. */
  aliases: string[];
  targets: string;
  /** Plain-language steps, two or three lines each at most. */
  steps: string[];
  /** The mistake that actually causes injury or wasted effort. */
  watchOut: string;
  /** Sensible starting volume. */
  starter: string;
}

export const EXERCISES: Exercise[] = [
  {
    name: 'Squat',
    aliases: ['squat', 'squats', 'back squat', 'air squat', 'bodyweight squat'],
    targets: 'quads, glutes, core',
    steps: [
      'Stand with feet shoulder-width apart, toes turned out slightly.',
      'Push your hips back and bend your knees, like sitting into a chair.',
      'Go down until your thighs are roughly parallel to the floor, chest tall.',
      'Drive through your whole foot to stand back up.',
    ],
    watchOut: 'Knees caving inward. Think about pushing them out over your toes.',
    starter: '3 sets of 10, bodyweight only, until it feels smooth.',
  },
  {
    name: 'Push-up',
    aliases: ['push up', 'pushup', 'push-ups', 'pushups', 'press up'],
    targets: 'chest, shoulders, triceps, core',
    steps: [
      'Hands slightly wider than your shoulders, body in one straight line.',
      'Lower your chest towards the floor with elbows at about 45 degrees.',
      'Stop when your chest is a fist-width off the ground.',
      'Push back up without letting your hips sag.',
    ],
    watchOut: 'Hips dropping or flaring elbows straight out to the sides.',
    starter: "3 sets to two reps short of failure. Do them on your knees or against a wall if full ones aren't there yet.",
  },
  {
    name: 'Deadlift',
    aliases: ['deadlift', 'deadlifts', 'conventional deadlift'],
    targets: 'hamstrings, glutes, back',
    steps: [
      'Bar over the middle of your feet, feet hip-width apart.',
      'Push your hips back and grip the bar just outside your legs.',
      'Chest up, back flat, then push the floor away and stand tall.',
      'Lower it by pushing your hips back again, keeping the bar close to your legs.',
    ],
    watchOut: 'Rounding your lower back. If it rounds, the weight is too heavy — drop it.',
    starter: 'Learn it light. 3 sets of 5 with a weight you could do 10 times.',
  },
  {
    name: 'Plank',
    aliases: ['plank', 'planks', 'planking'],
    targets: 'core, shoulders',
    steps: [
      'Forearms on the floor, elbows under your shoulders.',
      'Legs straight behind you, body in one line from head to heels.',
      'Squeeze your glutes and brace your stomach as if bracing for a punch.',
      'Breathe normally and hold.',
    ],
    watchOut: 'Hips sagging or lifting into a pike. Both make it easier and useless.',
    starter: '3 holds of 20-30 seconds. Quality beats duration.',
  },
  {
    name: 'Lunge',
    aliases: ['lunge', 'lunges', 'walking lunge', 'reverse lunge'],
    targets: 'quads, glutes, balance',
    steps: [
      'Stand tall, then step one foot back about two feet.',
      'Lower until both knees are bent near 90 degrees, back knee just off the floor.',
      'Keep your torso upright, weight through the front foot.',
      'Push through the front heel to stand back up.',
    ],
    watchOut: 'Leaning forward and letting the front knee collapse inward.',
    starter: '3 sets of 8 per leg. Hold a wall for balance if you need it.',
  },
  {
    name: 'Overhead press',
    aliases: ['overhead press', 'shoulder press', 'ohp', 'military press'],
    targets: 'shoulders, triceps, core',
    steps: [
      'Hold the weight at shoulder height, elbows slightly in front of the bar.',
      'Squeeze your glutes and brace your stomach so your back does not arch.',
      'Press straight up, moving your head back slightly out of the way.',
      'Finish with the weight over the middle of your feet, arms locked.',
    ],
    watchOut: 'Leaning back to muscle the weight up. If you lean, go lighter.',
    starter: '3 sets of 8 with a weight you could press 12 times.',
  },
  {
    name: 'Row',
    aliases: ['row', 'rows', 'bent over row', 'dumbbell row', 'barbell row'],
    targets: 'upper back, lats, biceps',
    steps: [
      'Hinge forward at the hips until your torso is about 45 degrees, back flat.',
      'Let the weight hang straight down from your shoulders.',
      'Pull it towards your belly button, leading with your elbows.',
      'Lower it under control all the way.',
    ],
    watchOut: 'Yanking with your lower back instead of pulling with your back muscles.',
    starter: '3 sets of 10, pausing for a second at the top of each rep.',
  },
  {
    name: 'Pull-up',
    aliases: ['pull up', 'pullup', 'pull-ups', 'pullups', 'chin up', 'chinup'],
    targets: 'lats, upper back, biceps',
    steps: [
      'Hang from the bar, hands a bit wider than your shoulders.',
      'Pull your shoulder blades down first, then bend your arms.',
      'Pull until your chin clears the bar.',
      'Lower all the way down under control.',
    ],
    watchOut: 'Kicking your legs to generate swing. It feels easier and trains less.',
    starter: 'Cannot do one yet? Do slow 5-second lowers from the top, 3 sets of 3.',
  },
  {
    name: 'Hip thrust',
    aliases: ['hip thrust', 'glute bridge', 'bridge', 'hip thrusts'],
    targets: 'glutes, hamstrings',
    steps: [
      'Sit on the floor with your upper back against a bench or sofa.',
      'Feet flat, about hip-width apart, knees bent.',
      'Drive through your heels and lift your hips until your body is flat from knees to shoulders.',
      'Squeeze your glutes hard at the top for a second, then lower.',
    ],
    watchOut: 'Arching your lower back at the top instead of squeezing your glutes.',
    starter: '3 sets of 12. Add weight across your hips once that feels easy.',
  },
  {
    name: 'Burpee',
    aliases: ['burpee', 'burpees'],
    targets: 'full body, conditioning',
    steps: [
      'From standing, squat down and put your hands on the floor.',
      'Jump or step your feet back into a push-up position.',
      'Do a push-up if you want the harder version, then jump your feet back in.',
      'Stand and jump with your hands overhead.',
    ],
    watchOut: 'Rushing and letting your back sag when your feet land. Step back instead of jumping if that happens.',
    starter: '4 rounds of 30 seconds on, 60 seconds off.',
  },
  {
    name: 'Running',
    aliases: ['run', 'running', 'jog', 'jogging', 'cardio'],
    targets: 'heart, lungs, legs',
    steps: [
      'Stand tall, lean very slightly forward from the ankles, not the waist.',
      'Land with your foot under your body, not way out in front.',
      'Take shorter, quicker steps — around 170-180 per minute.',
      'Keep your shoulders relaxed and your hands loose.',
    ],
    watchOut: 'Starting too fast. You should be able to speak a full sentence on an easy run.',
    starter: 'Alternate 2 minutes jogging with 1 minute walking, 6 rounds.',
  },
  {
    name: 'Bicep curl',
    aliases: ['curl', 'curls', 'bicep curl', 'biceps curl'],
    targets: 'biceps',
    steps: [
      'Stand with a weight in each hand, arms by your sides, palms forward.',
      'Keep your elbows pinned to your ribs.',
      'Bend your elbows to bring the weight to your shoulders.',
      'Lower slowly, taking about three seconds.',
    ],
    watchOut: 'Swinging your body to lift the weight. Your elbows should not move forward.',
    starter: '3 sets of 12 with a weight that gets hard by rep 10.',
  },
];

export interface VideoLink {
  label: string;
  url: string;
}

function search(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Three angles on the same movement, because one tutorial rarely covers all of
 * them. Search links rather than video IDs — a pinned ID breaks the day the
 * uploader deletes it, and these always surface current results.
 */
export function youTubeLinks(exercise: Exercise): VideoLink[] {
  const n = exercise.name.toLowerCase();
  return [
    { label: `${exercise.name}: full form tutorial`, url: search(`how to do a ${n} proper form tutorial`) },
    { label: `${exercise.name}: common mistakes`, url: search(`${n} common mistakes form fix`) },
    { label: `${exercise.name}: beginner version`, url: search(`${n} for beginners easier variation progression`) },
  ];
}

/** Kept for anything that only needs the primary link. */
export function youTubeLink(exercise: Exercise): string {
  return youTubeLinks(exercise)[0].url;
}

const BY_GOAL: Record<string, string[]> = {
  'lose-fat': ['Squat', 'Burpee', 'Running', 'Plank'],
  'build-muscle': ['Squat', 'Deadlift', 'Row', 'Overhead press'],
  endurance: ['Running', 'Lunge', 'Plank', 'Squat'],
  maintain: ['Squat', 'Push-up', 'Plank', 'Row'],
};

/** A handful of movements worth learning first, biased to the user's goal. */
export function suggestExercises(goal: string | undefined, count = 3, exclude: string[] = []): Exercise[] {
  const preferred = BY_GOAL[goal ?? 'maintain'] ?? BY_GOAL.maintain;
  const ordered = [
    ...preferred.map((name) => EXERCISES.find((e) => e.name === name)).filter((e): e is Exercise => Boolean(e)),
    ...EXERCISES,
  ];
  const picked: Exercise[] = [];
  for (const exercise of ordered) {
    if (picked.length >= count) break;
    if (exclude.includes(exercise.name)) continue;
    if (picked.some((p) => p.name === exercise.name)) continue;
    picked.push(exercise);
  }
  return picked;
}

export function findExercise(text: string): Exercise | null {
  const t = text.toLowerCase();
  let best: { exercise: Exercise; length: number } | null = null;
  for (const exercise of EXERCISES) {
    for (const alias of exercise.aliases) {
      // Longest alias wins so "pull up" doesn't lose to "up".
      if (t.includes(alias) && (!best || alias.length > best.length)) {
        best = { exercise, length: alias.length };
      }
    }
  }
  if (best) return best.exercise;

  // Nothing matched exactly — allow one typo, so "sqaut" still lands.
  for (const exercise of EXERCISES) {
    for (const alias of exercise.aliases) {
      if (alias.length >= 5 && fuzzyIncludes(t, alias)) return exercise;
    }
  }
  return null;
}

export interface MuscleGroup {
  label: string;
  aliases: string[];
  /** Exercise names, best first. */
  names: string[];
}

/** People ask by body part far more often than by movement name. */
export const GROUPS: MuscleGroup[] = [
  {
    label: 'legs',
    aliases: ['leg', 'legs', 'leg day', 'lower body', 'quad', 'quads', 'hamstring', 'hamstrings', 'thigh', 'thighs', 'glute', 'glutes', 'butt', 'bum', 'calf', 'calves'],
    names: ['Squat', 'Lunge', 'Hip thrust'],
  },
  {
    label: 'chest',
    aliases: ['chest', 'pec', 'pecs', 'push day', 'bench', 'upper body'],
    names: ['Push-up', 'Overhead press', 'Row'],
  },
  {
    label: 'back',
    aliases: ['back', 'lat', 'lats', 'pull day', 'posture'],
    names: ['Row', 'Pull-up', 'Deadlift'],
  },
  {
    label: 'core',
    aliases: ['core', 'abs', 'ab', 'six pack', 'sixpack', 'stomach', 'belly', 'tummy', 'midsection', 'waist'],
    names: ['Plank', 'Burpee', 'Squat'],
  },
  {
    label: 'arms and shoulders',
    aliases: ['arm', 'arms', 'bicep', 'biceps', 'tricep', 'triceps', 'shoulder', 'shoulders', 'delts'],
    names: ['Bicep curl', 'Overhead press', 'Push-up'],
  },
  {
    label: 'cardio',
    aliases: ['cardio', 'conditioning', 'stamina', 'endurance', 'hiit', 'fat burning', 'fat burn'],
    names: ['Running', 'Burpee', 'Lunge'],
  },
  {
    label: 'full body',
    aliases: ['full body', 'whole body', 'total body', 'all over', 'everything'],
    names: ['Squat', 'Push-up', 'Plank'],
  },
];

export function findGroup(text: string): { group: MuscleGroup; exercises: Exercise[] } | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, ' ')} `;
  let best: { group: MuscleGroup; length: number } | null = null;
  for (const group of GROUPS) {
    for (const alias of group.aliases) {
      // Space-padded so "ab" doesn't match inside "about".
      if (t.includes(` ${alias} `) && (!best || alias.length > best.length)) {
        best = { group, length: alias.length };
      }
    }
  }
  if (!best) return null;
  const exercises = best.group.names
    .map((name) => EXERCISES.find((e) => e.name === name))
    .filter((e): e is Exercise => Boolean(e));
  return exercises.length > 0 ? { group: best.group, exercises } : null;
}
