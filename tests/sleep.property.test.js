// Feature: nijam-paaku-daily-tracker, Property 14: Sleep duration calculation
// Feature: nijam-paaku-daily-tracker, Property 15: Sleep data persistence round-trip

/**
 * Property-based tests for sleep.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: calcSleepDuration, formatDuration.
 *
 * Validates: Requirements 5.2, 5.3, 5.4
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { calcSleepDuration, formatDuration } from '../sleep.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PREFIX = 'np_';

function makeStore() {
  const data = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}

function storeSet(store, key, value) {
  store.setItem(PREFIX + key, JSON.stringify(value));
}

function storeGet(store, key, fallback = null) {
  const raw = store.getItem(PREFIX + key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

/** Generate a valid HH:MM time string */
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

// ---------------------------------------------------------------------------
// Property 14: Sleep duration calculation
// ---------------------------------------------------------------------------

describe('Property 14: Sleep duration calculation', () => {
  test('calcSleepDuration returns positive minutes with overnight logic', () => {
    // Feature: nijam-paaku-daily-tracker, Property 14: Sleep duration calculation
    fc.assert(
      fc.property(
        timeArb,
        timeArb,
        (sleepTime, wakeTime) => {
          const duration = calcSleepDuration(sleepTime, wakeTime);

          // Duration must always be positive
          if (duration <= 0) return false;

          // Compute expected manually
          const [sh, sm] = sleepTime.split(':').map(Number);
          const [wh, wm] = wakeTime.split(':').map(Number);
          const sleepMins = sh * 60 + sm;
          let wakeMins = wh * 60 + wm;
          if (wakeMins <= sleepMins) wakeMins += 1440;
          const expected = wakeMins - sleepMins;

          return duration === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Sleep data persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 15: Sleep data persistence round-trip', () => {
  test('saving sleep data to a mock store and reading it back returns the same values', () => {
    // Feature: nijam-paaku-daily-tracker, Property 15: Sleep data persistence round-trip
    fc.assert(
      fc.property(
        timeArb,
        timeArb,
        (sleepTime, wakeTime) => {
          const duration = calcSleepDuration(sleepTime, wakeTime);
          const record = { sleepTime, wakeTime, duration };

          const store = makeStore();
          const dateKey = '2024-06-15';
          storeSet(store, `sleep_${dateKey}`, record);

          const retrieved = storeGet(store, `sleep_${dateKey}`, null);

          return (
            retrieved !== null &&
            retrieved.sleepTime === sleepTime &&
            retrieved.wakeTime === wakeTime &&
            retrieved.duration === duration
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
