// Feature: nijam-paaku-daily-tracker, Property 17: Mood selection persistence round-trip
// Feature: nijam-paaku-daily-tracker, Property 18: Mood clears on new day

/**
 * Property-based tests for mood.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: MOODS, getMoodForDay.
 *
 * Validates: Requirements 7.2, 7.3, 7.5
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { MOODS, getMoodForDay } from '../mood.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PREFIX = 'np_';

function makeStore(initial = {}) {
  const data = { ...initial };
  return {
    get: (key) => {
      const raw = Object.prototype.hasOwnProperty.call(data, PREFIX + key)
        ? data[PREFIX + key]
        : null;
      if (raw === null) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set: (key, value) => { data[PREFIX + key] = JSON.stringify(value); },
  };
}

/** Generate a valid YYYY-MM-DD date key */
const dateKeyArb = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
);

/** Generate two distinct date keys */
const twoDifferentDatesArb = fc.tuple(dateKeyArb, dateKeyArb).filter(
  ([a, b]) => a !== b
);

// ---------------------------------------------------------------------------
// Property 17: Mood selection persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 17: Mood selection persistence round-trip', () => {
  test('saving a mood to a mock store and reading it back returns the same mood', () => {
    // Feature: nijam-paaku-daily-tracker, Property 17: Mood selection persistence round-trip
    fc.assert(
      fc.property(
        fc.constantFrom(...MOODS),
        dateKeyArb,
        (mood, dateKey) => {
          const store = makeStore();
          store.set(`mood_${dateKey}`, mood);
          const retrieved = getMoodForDay(store, dateKey);
          return retrieved === mood;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Mood clears on new day
// ---------------------------------------------------------------------------

describe('Property 18: Mood clears on new day', () => {
  test('mood stored under a previous date key returns null when queried for a different date', () => {
    // Feature: nijam-paaku-daily-tracker, Property 18: Mood clears on new day
    fc.assert(
      fc.property(
        fc.constantFrom(...MOODS),
        twoDifferentDatesArb,
        (mood, [storedDate, queryDate]) => {
          const store = makeStore();
          // Store mood under storedDate
          store.set(`mood_${storedDate}`, mood);
          // Query for a different date — should return null
          const retrieved = getMoodForDay(store, queryDate);
          return retrieved === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});
