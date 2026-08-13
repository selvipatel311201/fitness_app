import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ActivityLevel, DietPreference, FieldErrors, Goal, Profile, ProfileDraft, Sex } from '../types';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../lib/calc';
import { validate } from '../lib/validate';
import { PhotoUpload } from './PhotoUpload';
import { Icon } from './Chrome';

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
    <form className="form" onSubmit={handleSubmit} noValidate>
      <header>
        <span className="eyebrow">
          <Icon name="bolt" size={14} /> Two minutes
        </span>
        <h1>Your details</h1>
        <p className="lede">Everything is worked out in this browser. Nothing is uploaded, photo included.</p>
      </header>

      <fieldset className="fieldset">
        <legend>
          <span className="legend-num">1</span> Photo (optional)
        </legend>
        <PhotoUpload photo={draft.photo} onChange={(photo) => set('photo', photo)} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="legend-num">2</span> About you
        </legend>
        <div className="grid">
          <label className="field" htmlFor="name">
            <span>Name (optional)</span>
            <input id="name" type="text" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Selvi" />
          </label>
          <label className="field" htmlFor="age">
            <span>Age</span>
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
          </label>
          <label className="field" htmlFor="sex">
            <span>Sex</span>
            <select id="sex" value={draft.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
              {(Object.keys(SEX_LABELS) as Sex[]).map((k) => (
                <option key={k} value={k}>
                  {SEX_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="height">
            <span>Height (cm)</span>
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
          </label>
          <label className="field" htmlFor="weight">
            <span>Current weight (kg)</span>
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
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="legend-num">3</span> Your goal
        </legend>
        <div className="grid">
          <label className="field" htmlFor="target">
            <span>Target weight (kg)</span>
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
          </label>
          <label className="field" htmlFor="days">
            <span>Days to reach it</span>
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
          </label>
          <label className="field" htmlFor="goal">
            <span>Fitness goal</span>
            <select id="goal" value={draft.goal} onChange={(e) => set('goal', e.target.value as Goal)}>
              {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
                <option key={k} value={k}>
                  {GOAL_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide" htmlFor="activity">
            <span>Activity level</span>
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
          </label>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>
          <span className="legend-num">4</span> Food
        </legend>
        <div className="grid">
          <label className="field" htmlFor="diet">
            <span>Preference</span>
            <select id="diet" value={draft.diet} onChange={(e) => set('diet', e.target.value as DietPreference)}>
              {(Object.keys(DIET_LABELS) as DietPreference[]).map((k) => (
                <option key={k} value={k}>
                  {DIET_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field" htmlFor="avoid">
            <span>Foods to avoid</span>
            <input
              id="avoid"
              type="text"
              value={draft.avoidFoods}
              onChange={(e) => set('avoidFoods', e.target.value)}
              placeholder="mushroom, peanut"
            />
            <p className="hint">Comma separated.</p>
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
          <span className="hint">You can change any of this later.</span>
        </div>
      </fieldset>
    </form>
  );
}
