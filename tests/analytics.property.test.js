// Feature: nijam-paaku-daily-tracker, Property 24: Analytics reads correct weekly data

/**
 * Property-based tests for analytics.js pure logic functions.
 * Validates: Requirements 11.5
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { extractWeeklyData, calcBarHeight } from '../analytics.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock store from a plain object map of key → value */
function makeStore(data) {
  return {
    get(key, fallback = null) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback;
    },
  };
}

/** Generate a fixed set of 7 date keys for testing */
function makeWeekKeys(base = '2024-06-01') {
  const keys = [];
  const start = new Date(base);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Property 24: Analytics reads correct weekly data
// ---------------------------------------------------------------------------

describe('Property 24: Analytics reads correct weekly data', () => {
  test('extractWeeklyData returns water values matching stored values for each day', () => {
    // Feature: nijam-paaku-daily-tracker, Property 24: Analytics reads correct weekly data
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 5000 }), { minLength: 7, maxLength: 7 }),
        (waterValues) => {
          const storeData = {};
          keys.forEach((day, i) => {
            storeData[`water_${day}`] = { total: waterValues[i] };
          });
          // tasks key needed to avoid errors
          storeData['tasks'] = [];

          const store = makeStore(storeData);
          const { water } = extractWeeklyData(store, keys);

          return water.every((val, i) => val === waterValues[i]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('extractWeeklyData returns sleep values matching stored durations for each day', () => {
    // Feature: nijam-paaku-daily-tracker, Property 24: Analytics reads correct weekly data
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 720 }), { minLength: 7, maxLength: 7 }),
        (sleepMinutes) => {
          const storeData = {};
          keys.forEach((day, i) => {
            storeData[`sleep_${day}`] = { sleepTime: '22:00', wakeTime: '06:00', duration: sleepMinutes[i] };
          });
          storeData['tasks'] = [];

          const store = makeStore(storeData);
          const { sleep } = extractWeeklyData(store, keys);

          // sleep values are in hours (rounded to 1 decimal)
          return sleep.every((val, i) => {
            const expected = Math.round((sleepMinutes[i] / 60) * 10) / 10;
            return val === expected;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('extractWeeklyData returns arrays of length 7', () => {
    // Feature: nijam-paaku-daily-tracker, Property 24: Analytics reads correct weekly data
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.constant(null), // no meaningful input needed
        () => {
          const store = makeStore({ tasks: [] });
          const { tasks, water, sleep } = extractWeeklyData(store, keys);
          return tasks.length === 7 && water.length === 7 && sleep.length === 7;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// calcBarHeight tests
// ---------------------------------------------------------------------------

describe('calcBarHeight', () => {
  test('returns 0 for zero value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (max) => calcBarHeight(0, max) === 0
      ),
      { numRuns: 100 }
    );
  });

  test('returns 100 when value equals maxValue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (val) => calcBarHeight(val, val) === 100
      ),
      { numRuns: 100 }
    );
  });

  test('returns value between 0 and 100 for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (value, maxValue) => {
          const h = calcBarHeight(value, maxValue);
          return h >= 0 && h <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});
