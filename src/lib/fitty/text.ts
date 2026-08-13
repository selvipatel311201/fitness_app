/**
 * Damerau-Levenshtein distance. Transpositions count as one edit, not two,
 * because swapping adjacent letters ("sqaut") is the most common typo there is.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let twoBack: number[] = [];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      // Adjacent transposition, e.g. "sqaut" -> "squat".
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j], (twoBack[j - 2] ?? Infinity) + 1);
      }
    }
    twoBack = prev;
    prev = row;
  }
  return prev[b.length];
}

/** Words people reliably misspell in a fitness chat. */
const TARGETS = [
  'exercise',
  'exercises',
  'workout',
  'workouts',
  'stretch',
  'shoulder',
  'shoulders',
  'training',
  'muscle',
  'muscles',
  'stomach',
  'calories',
  'protein',
  'weight',
];

/**
 * Ordinary words that sit within edit range of a target and must never be
 * "corrected". "should" is two edits from "shoulder", which turned every
 * "what should I eat?" into a request for arm exercises.
 */
const NEVER_CORRECT = new Set([
  'should', 'shall', 'would', 'could', 'about', 'above', 'again', 'other', 'there', 'their',
  'these', 'those', 'where', 'which', 'while', 'being', 'doing', 'going', 'thing', 'think',
  'right', 'night', 'start', 'still', 'every', 'first', 'after', 'before', 'water', 'weigh',
  'weighs', 'eating', 'meals', 'please', 'thanks', 'better', 'little', 'morning', 'evening',
  'strong', 'stronger', 'routine', 'session', 'sessions', 'calorie', 'protein', 'portion',
]);

/**
 * Repairs near-miss spellings so "leg excerice" reaches the same branch as
 * "leg exercise". Only words of five letters or more are touched, only when
 * they are within a couple of edits of a known term, and never when the word is
 * a perfectly ordinary one.
 */
export function normalizeTypos(input: string): string {
  return input.replace(/[A-Za-z]{5,}/g, (word) => {
    const lower = word.toLowerCase();
    if (TARGETS.includes(lower) || NEVER_CORRECT.has(lower)) return word;
    for (const target of TARGETS) {
      const limit = target.length >= 8 ? 2 : 1;
      if (editDistance(lower, target) <= limit) return target;
    }
    return word;
  });
}

/** True when any word in `text` is within `limit` edits of `term`. */
export function fuzzyIncludes(text: string, term: string, limit = 1): boolean {
  if (text.includes(term)) return true;
  if (term.length < 4) return false;
  const words = text.split(/[^a-z]+/i).filter((w) => w.length >= 4);
  const parts = term.split(' ');
  if (parts.length > 1) return false; // multi-word aliases need an exact hit
  return words.some((w) => editDistance(w.toLowerCase(), term) <= limit);
}
