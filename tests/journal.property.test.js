// Feature: nijam-paaku-daily-tracker, Property 22: Journal persistence round-trip
// Feature: nijam-paaku-daily-tracker, Property 23: Journal clears on new day

/**
 * Property-based tests for journal.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: getJournalEntry, saveJournalEntry.
 *
 * Validates: Requirements 10.2, 10.3, 10.4
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { getJournalEntry, saveJournalEntry } from '../journal.js';

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

/** Two distinct date keys */
const twoDifferentDatesArb = fc.tuple(dateKeyArb, dateKeyArb).filter(
  ([a, b]) => a !== b
);

// ---------------------------------------------------------------------------
// Property 22: Journal persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 22: Journal persistence round-trip', () => {
  test('saving text and reading it back returns the same text', () => {
    // Feature: nijam-paaku-daily-tracker, Property 22: Journal persistence round-trip
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        dateKeyArb,
        (text, dateKey) => {
          const store = makeStore();
          saveJournalEntry(store, dateKey, text);
          const retrieved = getJournalEntry(store, dateKey);
          return retrieved === text;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 23: Journal clears on new day
// ---------------------------------------------------------------------------

describe('Property 23: Journal clears on new day', () => {
  test('entry stored under a previous date returns empty string for a different date', () => {
    // Feature: nijam-paaku-daily-tracker, Property 23: Journal clears on new day
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        twoDifferentDatesArb,
        (text, [storedDate, queryDate]) => {
          const store = makeStore();
          saveJournalEntry(store, storedDate, text);
          const retrieved = getJournalEntry(store, queryDate);
          return retrieved === '';
        }
      ),
      { numRuns: 100 }
    );
  });
});
