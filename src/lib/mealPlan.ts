import type { DietPreference, Profile } from '../types';
import type { Plan } from './calc';

interface FoodBank {
  proteins: string[];
  carbs: string[];
  veg: string[];
  fats: string[];
  breakfasts: string[];
  snacks: string[];
}

const BANKS: Record<DietPreference, FoodBank> = {
  vegetarian: {
    proteins: ['paneer', 'greek yogurt', 'rajma', 'chana', 'tofu', 'moong dal', 'whey shake'],
    carbs: ['brown rice', 'roti', 'oats', 'quinoa', 'sweet potato', 'poha'],
    veg: ['spinach', 'broccoli', 'bhindi', 'mixed salad', 'lauki', 'capsicum'],
    fats: ['almonds', 'peanut butter', 'ghee', 'walnuts', 'olive oil'],
    breakfasts: ['oats with milk, banana and almonds', 'paneer bhurji with 2 rotis', 'besan chilla with curd', 'poha with peanuts and a glass of milk'],
    snacks: ['greek yogurt with berries', 'roasted chana', 'a fruit with 10 almonds', 'peanut butter on toast'],
  },
  vegan: {
    proteins: ['tofu', 'tempeh', 'rajma', 'chana', 'soy chunks', 'lentils', 'pea protein shake'],
    carbs: ['brown rice', 'roti', 'oats', 'quinoa', 'sweet potato', 'millet'],
    veg: ['spinach', 'broccoli', 'bhindi', 'mixed salad', 'zucchini', 'capsicum'],
    fats: ['almonds', 'peanut butter', 'flax seeds', 'walnuts', 'olive oil'],
    breakfasts: ['oats with soy milk, banana and flax seeds', 'tofu scramble with 2 rotis', 'chana chaat', 'peanut butter toast with a banana'],
    snacks: ['roasted chana', 'a fruit with 10 almonds', 'hummus with carrot sticks', 'soy milk with dates'],
  },
  eggetarian: {
    proteins: ['eggs', 'paneer', 'greek yogurt', 'rajma', 'chana', 'tofu', 'whey shake'],
    carbs: ['brown rice', 'roti', 'oats', 'quinoa', 'sweet potato', 'poha'],
    veg: ['spinach', 'broccoli', 'bhindi', 'mixed salad', 'lauki', 'capsicum'],
    fats: ['almonds', 'peanut butter', 'ghee', 'walnuts', 'olive oil'],
    breakfasts: ['3 egg omelette with 2 rotis', 'oats with milk and boiled eggs', 'egg bhurji with toast', 'veggie omelette with a fruit'],
    snacks: ['2 boiled eggs', 'greek yogurt with berries', 'roasted chana', 'a fruit with 10 almonds'],
  },
  'non-vegetarian': {
    proteins: ['chicken breast', 'fish', 'eggs', 'prawns', 'lean mutton', 'greek yogurt', 'whey shake'],
    carbs: ['brown rice', 'roti', 'oats', 'quinoa', 'sweet potato', 'poha'],
    veg: ['spinach', 'broccoli', 'bhindi', 'mixed salad', 'beans', 'capsicum'],
    fats: ['almonds', 'peanut butter', 'ghee', 'walnuts', 'olive oil'],
    breakfasts: ['3 egg omelette with 2 rotis', 'oats with milk and boiled eggs', 'chicken sandwich on brown bread', 'egg bhurji with a fruit'],
    snacks: ['2 boiled eggs', 'greek yogurt with berries', 'grilled chicken strips', 'a fruit with 10 almonds'],
  },
};

export interface Meal {
  name: string;
  time: string;
  calories: number;
  idea: string;
}

/** Fraction of daily calories per meal — breakfast, lunch, snack, dinner. */
const SPLIT: Array<{ name: string; time: string; share: number }> = [
  { name: 'Breakfast', time: '8:00 AM', share: 0.25 },
  { name: 'Lunch', time: '1:00 PM', share: 0.35 },
  { name: 'Snack', time: '5:00 PM', share: 0.15 },
  { name: 'Dinner', time: '8:30 PM', share: 0.25 },
];

function parseAvoided(avoidFoods: string): string[] {
  return avoidFoods
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function keep(items: string[], avoided: string[]): string[] {
  const left = items.filter((item) => !avoided.some((bad) => item.toLowerCase().includes(bad)));
  // If the user avoided everything in a category, fall back to the full list
  // rather than rendering an empty meal.
  return left.length > 0 ? left : items;
}

/** Deterministic pick so the plan does not reshuffle on every render. */
function pick(items: string[], seed: number): string {
  return items[seed % items.length];
}

export function buildMeals(profile: Profile, plan: Plan): Meal[] {
  const bank = BANKS[profile.diet];
  const avoided = parseAvoided(profile.avoidFoods);

  const proteins = keep(bank.proteins, avoided);
  const carbs = keep(bank.carbs, avoided);
  const veg = keep(bank.veg, avoided);
  const fats = keep(bank.fats, avoided);
  const breakfasts = keep(bank.breakfasts, avoided);
  const snacks = keep(bank.snacks, avoided);

  const seed = profile.age + Math.round(profile.weightKg);

  return SPLIT.map((slot, i) => {
    const calories = Math.round((plan.dailyCalories * slot.share) / 10) * 10;
    let idea: string;
    if (slot.name === 'Breakfast') {
      idea = pick(breakfasts, seed);
    } else if (slot.name === 'Snack') {
      idea = pick(snacks, seed + 1);
    } else {
      idea =
        `${pick(proteins, seed + i)} with ${pick(carbs, seed + i)}, ` +
        `${pick(veg, seed + i)} and a little ${pick(fats, seed + i)}`;
    }
    return { name: slot.name, time: slot.time, calories, idea };
  });
}

export function dietNotes(profile: Profile, plan: Plan): string[] {
  const notes = [
    `Hit ${plan.macros.proteinG}g protein a day — split it across all four meals, not just dinner.`,
    `Drink about ${(plan.waterMl / 1000).toFixed(1)} litres of water daily.`,
    `Aim for ${plan.stepsTarget.toLocaleString()} steps a day outside of your workouts.`,
  ];
  if (plan.adjustment < 0) {
    notes.push('Weigh yourself once a week, same time of day — daily weight swings are mostly water.');
  }
  if (plan.adjustment > 0) {
    notes.push('If the scale is not moving after 2 weeks, add 200 kcal of carbs around your workout.');
  }
  if (profile.diet === 'vegan') {
    notes.push('Add a B12 supplement — it is the one nutrient a vegan diet reliably misses.');
  }
  notes.push('Sleep 7-8 hours. Short sleep raises hunger and blunts recovery.');
  return notes;
}
