import type { Profile } from '../types';

const KEY = 'fitplan.profile.v1';

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    // Guard against an older or hand-edited payload.
    if (typeof parsed.weightKg !== 'number' || typeof parsed.days !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded (usually a large photo) — keep the app usable by storing
    // everything except the image.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...profile, photo: null }));
    } catch {
      /* storage unavailable — the session still works in memory */
    }
  }
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}
