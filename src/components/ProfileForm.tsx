import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ActivityLevel, DietPreference, FieldErrors, Goal, Profile, ProfileDraft, Sex } from '../types';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../lib/calc';
import { validate } from '../lib/validate';
import { PhotoUpload } from './PhotoUpload';

interface Props {
  initial: ProfileDraft;
  submitLabel: string;
  onSubmit: (profile: Profile) => void;
  onCancel?: () => void;
}

const DIET_LABELS: Record<DietPreference, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  eggetarian: 'Eggetarian',
  'non-vegetarian': 'Non-vegetarian',
};

const SEX_LABELS: Record<Sex, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Prefer not to say',
};

export function ProfileForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { errors: found, profile } = validate(draft);
    if (profile) {
      onSubmit(profile);
    } else {
      setErrors(found);
    }
  }

  return (
    <article className="post">
      <header>
        <div className="title">
          <h2>Your details</h2>
          <p>Everything is worked out in this browser and stored on this device.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <h3>Photo</h3>
        <PhotoUpload photo={draft.photo} onChange={(photo) => set('photo', photo)} />

        <h3>About you</h3>
        <div className="row gtr-uniform">
          <div className="col-4 col-12-small">
            <label htmlFor="name">Name (optional)</label>
            <input id="name" type="text" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Selvi" />
          </div>
          <div className="col-4 col-6-small">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="text"
              inputMode="numeric"
              value={draft.age}
              onChange={(e) => set('age', e.target.value)}
              placeholder="24"
              aria-invalid={Boolean(errors.age)}
            />
            {errors.age && <p className="field-error">{errors.age}</p>}
          </div>
          <div className="col-4 col-6-small">
            <label htmlFor="sex">Sex</label>
            <select id="sex" value={draft.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
              {(Object.keys(SEX_LABELS) as Sex[]).map((k) => (
                <option key={k} value={k}>
                  {SEX_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-12-small">
            <label htmlFor="height">Height (cm)</label>
            <input
              id="height"
              type="text"
              inputMode="decimal"
              value={draft.heightCm}
              onChange={(e) => set('heightCm', e.target.value)}
              placeholder="170"
              aria-invalid={Boolean(errors.heightCm)}
            />
            {errors.heightCm && <p className="field-error">{errors.heightCm}</p>}
          </div>
          <div className="col-6 col-12-small">
            <label htmlFor="weight">Current weight (kg)</label>
            <input
              id="weight"
              type="text"
              inputMode="decimal"
              value={draft.weightKg}
              onChange={(e) => set('weightKg', e.target.value)}
              placeholder="72"
              aria-invalid={Boolean(errors.weightKg)}
            />
            {errors.weightKg && <p className="field-error">{errors.weightKg}</p>}
          </div>
        </div>

        <h3>Your goal</h3>
        <div className="row gtr-uniform">
          <div className="col-4 col-6-small">
            <label htmlFor="target">Target weight (kg)</label>
            <input
              id="target"
              type="text"
              inputMode="decimal"
              value={draft.targetWeightKg}
              onChange={(e) => set('targetWeightKg', e.target.value)}
              placeholder="65"
              aria-invalid={Boolean(errors.targetWeightKg)}
            />
            {errors.targetWeightKg && <p className="field-error">{errors.targetWeightKg}</p>}
          </div>
          <div className="col-4 col-6-small">
            <label htmlFor="days">Days to reach it</label>
            <input
              id="days"
              type="text"
              inputMode="numeric"
              value={draft.days}
              onChange={(e) => set('days', e.target.value)}
              placeholder="90"
              aria-invalid={Boolean(errors.days)}
            />
            {errors.days && <p className="field-error">{errors.days}</p>}
          </div>
          <div className="col-4 col-12-small">
            <label htmlFor="goal">Fitness goal</label>
            <select id="goal" value={draft.goal} onChange={(e) => set('goal', e.target.value as Goal)}>
              {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
                <option key={k} value={k}>
                  {GOAL_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label htmlFor="activity">Activity level</label>
            <select
              id="activity"
              value={draft.activity}
              onChange={(e) => set('activity', e.target.value as ActivityLevel)}
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                <option key={k} value={k}>
                  {ACTIVITY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3>Food</h3>
        <div className="row gtr-uniform">
          <div className="col-6 col-12-small">
            <label htmlFor="diet">Preference</label>
            <select id="diet" value={draft.diet} onChange={(e) => set('diet', e.target.value as DietPreference)}>
              {(Object.keys(DIET_LABELS) as DietPreference[]).map((k) => (
                <option key={k} value={k}>
                  {DIET_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-12-small">
            <label htmlFor="avoid">Foods to avoid</label>
            <input
              id="avoid"
              type="text"
              value={draft.avoidFoods}
              onChange={(e) => set('avoidFoods', e.target.value)}
              placeholder="mushroom, peanut"
            />
            <p className="hint">Comma separated.</p>
          </div>
        </div>

        <ul className="actions">
          <li>
            <button type="submit" className="button primary">
              {submitLabel}
            </button>
          </li>
          {onCancel && (
            <li>
              <button type="button" className="button" onClick={onCancel}>
                Cancel
              </button>
            </li>
          )}
        </ul>
      </form>
    </article>
  );
}
