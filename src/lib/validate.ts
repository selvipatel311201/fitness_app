import type { FieldErrors, Profile, ProfileDraft } from '../types';
import { todayIso } from './calc';

interface Range {
  min: number;
  max: number;
  label: string;
}

const RANGES: Record<'age' | 'heightCm' | 'weightKg' | 'targetWeightKg' | 'days', Range> = {
  age: { min: 13, max: 100, label: 'Age must be between 13 and 100' },
  heightCm: { min: 100, max: 250, label: 'Height must be between 100 and 250 cm' },
  weightKg: { min: 30, max: 300, label: 'Weight must be between 30 and 300 kg' },
  targetWeightKg: { min: 30, max: 300, label: 'Target weight must be between 30 and 300 kg' },
  days: { min: 7, max: 730, label: 'Pick between 7 and 730 days' },
};

export function emptyDraft(): ProfileDraft {
  return {
    name: '',
    age: '',
    sex: 'male',
    heightCm: '',
    weightKg: '',
    targetWeightKg: '',
    activity: 'moderate',
    goal: 'lose-fat',
    diet: 'vegetarian',
    avoidFoods: '',
    days: '90',
    photo: null,
  };
}

export function draftFromProfile(p: Profile): ProfileDraft {
  return {
    name: p.name,
    age: String(p.age),
    sex: p.sex,
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
    targetWeightKg: String(p.targetWeightKg),
    activity: p.activity,
    goal: p.goal,
    diet: p.diet,
    avoidFoods: p.avoidFoods,
    days: String(p.days),
    photo: p.photo,
  };
}

export interface ValidationResult {
  errors: FieldErrors;
  profile: Profile | null;
}

export function validate(draft: ProfileDraft, startedOn = todayIso()): ValidationResult {
  const errors: FieldErrors = {};

  const numbers: Partial<Record<keyof typeof RANGES, number>> = {};
  (Object.keys(RANGES) as Array<keyof typeof RANGES>).forEach((field) => {
    const raw = draft[field].trim();
    if (raw === '') {
      errors[field] = 'Required';
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[field] = 'Enter a number';
      return;
    }
    const range = RANGES[field];
    if (value < range.min || value > range.max) {
      errors[field] = range.label;
      return;
    }
    numbers[field] = value;
  });

  if (Object.keys(errors).length > 0) return { errors, profile: null };

  return {
    errors,
    profile: {
      name: draft.name.trim(),
      age: numbers.age!,
      sex: draft.sex,
      heightCm: numbers.heightCm!,
      weightKg: numbers.weightKg!,
      targetWeightKg: numbers.targetWeightKg!,
      activity: draft.activity,
      goal: draft.goal,
      diet: draft.diet,
      avoidFoods: draft.avoidFoods.trim(),
      days: Math.round(numbers.days!),
      photo: draft.photo,
      startedOn,
    },
  };
}
