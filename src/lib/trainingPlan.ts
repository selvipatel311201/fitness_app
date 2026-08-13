import type { ActivityLevel, Goal } from '../types';

export interface TrainingDay {
  day: string;
  focus: string;
  detail: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SPLITS: Record<Goal, Array<[string, string]>> = {
  'lose-fat': [
    ['Full body strength', 'Squat, push, pull, hinge — 3 sets of 8-12 each'],
    ['Cardio + core', '30 min brisk incline walk or cycling, then 10 min core'],
    ['Full body strength', 'Lunge, overhead press, row, hip thrust — 3 sets of 10'],
    ['Active recovery', 'Long walk, mobility and stretching'],
    ['Full body strength', 'Deadlift, bench or push-up, pull-down — 4 sets of 8'],
    ['Intervals', '20 min: 30s hard / 90s easy, any machine or sprint'],
    ['Rest', 'Full rest. Sleep in, eat on plan'],
  ],
  'build-muscle': [
    ['Push', 'Bench, overhead press, dips, triceps — 4 sets of 6-10'],
    ['Pull', 'Rows, pull-ups, curls, face pulls — 4 sets of 6-10'],
    ['Legs', 'Squat, RDL, leg press, calves — 4 sets of 8-12'],
    ['Rest', 'Walk, stretch, eat'],
    ['Upper body', 'Incline press, weighted pull-up, lateral raise — 4 sets of 8'],
    ['Lower body + core', 'Front squat, hip thrust, hamstring curl, planks'],
    ['Rest', 'Full rest — muscle is built while you recover'],
  ],
  maintain: [
    ['Strength', 'Full body, 3 sets of 8-12, keep the weights honest'],
    ['Cardio', '30-40 min steady zone 2 work'],
    ['Strength', 'Full body, swap in different variations'],
    ['Mobility', '30 min yoga or stretching'],
    ['Strength', 'Full body, push a heavier top set'],
    ['Sport or hike', 'Something fun that keeps you moving 60+ min'],
    ['Rest', 'Full rest'],
  ],
  endurance: [
    ['Easy run', '30-40 min conversational pace'],
    ['Intervals', '6 x 400m hard with 90s jog recovery'],
    ['Strength', 'Legs and core — squat, lunge, plank, 3 sets each'],
    ['Easy run', '30 min easy, focus on cadence'],
    ['Tempo', '20 min at comfortably-hard pace, 10 min warm up and cool down'],
    ['Long run', '60-90 min slow, build 10% per week'],
    ['Rest', 'Full rest and stretching'],
  ],
};

/** Trim the split to the number of hard days the user's activity level supports. */
const MAX_TRAINING_DAYS: Record<ActivityLevel, number> = {
  sedentary: 3,
  light: 3,
  moderate: 4,
  active: 6,
  athlete: 6,
};

export function buildTrainingWeek(goal: Goal, activity: ActivityLevel): TrainingDay[] {
  const split = SPLITS[goal];
  const budget = MAX_TRAINING_DAYS[activity];

  let used = 0;
  return split.map(([focus, detail], i) => {
    const isRest = focus === 'Rest' || focus === 'Active recovery';
    if (!isRest) {
      used += 1;
      if (used > budget) {
        return { day: DAYS[i], focus: 'Walk / recovery', detail: '30-45 min easy walk and stretching' };
      }
    }
    return { day: DAYS[i], focus, detail };
  });
}
