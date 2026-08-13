export type Sex = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete';

export type Goal = 'lose-fat' | 'build-muscle' | 'maintain' | 'endurance';

export type DietPreference =
  | 'vegetarian'
  | 'vegan'
  | 'eggetarian'
  | 'non-vegetarian';

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  diet: DietPreference;
  /** Comma separated foods to leave out of the meal plan. */
  avoidFoods: string;
  /** Days the user wants to reach the goal in. */
  days: number;
  /** Uploaded photo as a data URL, or null. */
  photo: string | null;
  /** ISO date (YYYY-MM-DD) the plan started. */
  startedOn: string;
}

/** Form values are kept as strings so number inputs can be empty while typing. */
export interface ProfileDraft {
  name: string;
  age: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activity: ActivityLevel;
  goal: Goal;
  diet: DietPreference;
  avoidFoods: string;
  days: string;
  photo: string | null;
}

export type FieldErrors = Partial<Record<keyof ProfileDraft, string>>;
