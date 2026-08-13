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
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>Your details</h2>
      <p className="card-sub">Everything stays on this device — nothing is uploaded to a server.</p>

      <PhotoUpload photo={draft.photo} onChange={(photo) => set('photo', photo)} />

      <div className="grid">
        <label className="field field-wide">
          <span>Name (optional)</span>
          <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Selvi" />
        </label>

        <label className="field">
          <span>Age</span>
          <input
            inputMode="numeric"
            value={draft.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="24"
            aria-invalid={Boolean(errors.age)}
          />
          {errors.age && <em className="field-error">{errors.age}</em>}
        </label>

        <label className="field">
          <span>Sex</span>
          <select value={draft.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
            {(Object.keys(SEX_LABELS) as Sex[]).map((k) => (
              <option key={k} value={k}>
                {SEX_LABELS[k]}
              </option>
            ))}
          </select>
          <em className="hint">Used for the metabolic rate formula.</em>
        </label>

        <label className="field">
          <span>Height (cm)</span>
          <input
            inputMode="decimal"
            value={draft.heightCm}
            onChange={(e) => set('heightCm', e.target.value)}
            placeholder="170"
            aria-invalid={Boolean(errors.heightCm)}
          />
          {errors.heightCm && <em className="field-error">{errors.heightCm}</em>}
        </label>

        <label className="field">
          <span>Current weight (kg)</span>
          <input
            inputMode="decimal"
            value={draft.weightKg}
            onChange={(e) => set('weightKg', e.target.value)}
            placeholder="72"
            aria-invalid={Boolean(errors.weightKg)}
          />
          {errors.weightKg && <em className="field-error">{errors.weightKg}</em>}
        </label>

        <label className="field">
          <span>Target weight (kg)</span>
          <input
            inputMode="decimal"
            value={draft.targetWeightKg}
            onChange={(e) => set('targetWeightKg', e.target.value)}
            placeholder="65"
            aria-invalid={Boolean(errors.targetWeightKg)}
          />
          {errors.targetWeightKg && <em className="field-error">{errors.targetWeightKg}</em>}
        </label>

        <label className="field">
          <span>Days to reach it</span>
          <input
            inputMode="numeric"
            value={draft.days}
            onChange={(e) => set('days', e.target.value)}
            placeholder="90"
            aria-invalid={Boolean(errors.days)}
          />
          {errors.days && <em className="field-error">{errors.days}</em>}
        </label>

        <label className="field field-wide">
          <span>Fitness goal</span>
          <select value={draft.goal} onChange={(e) => set('goal', e.target.value as Goal)}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
              <option key={k} value={k}>
                {GOAL_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-wide">
          <span>Activity level</span>
          <select value={draft.activity} onChange={(e) => set('activity', e.target.value as ActivityLevel)}>
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Food preference</span>
          <select value={draft.diet} onChange={(e) => set('diet', e.target.value as DietPreference)}>
            {(Object.keys(DIET_LABELS) as DietPreference[]).map((k) => (
              <option key={k} value={k}>
                {DIET_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Foods to avoid</span>
          <input
            value={draft.avoidFoods}
            onChange={(e) => set('avoidFoods', e.target.value)}
            placeholder="mushroom, peanut"
          />
          <em className="hint">Comma separated.</em>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
