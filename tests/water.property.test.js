// Feature: nijam-paaku-daily-tracker, Property 8: Water quick-add increment
// Feature: nijam-paaku-daily-tracker, Property 9: Progress bar percentage calculation
// Feature: nijam-paaku-daily-tracker, Property 10: Water goal persistence round-trip
// Feature: nijam-paaku-daily-tracker, Property 11: Water goal completion indicator

/**
 * Property-based tests for water.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: addWater, calcProgress, isGoalMet.
 *
 * Validates: Requirements 3.2, 3.3, 3.5, 3.6
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { addWater, calcProgress, isGoalMet } from '../water.js';

// ---------------------------------------------------------------------------
// Inline storage mock (mirrors storage.js without localStorage dependency)
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

// ---------------------------------------------------------------------------
// Property 8: Water quick-add increment
// ---------------------------------------------------------------------------

describe('Property 8: Water quick-add increment', () => {
  test('addWater returns total + amount for any quick-add value', () => {
    // Feature: nijam-paaku-daily-tracker, Property 8: Water quick-add increment
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),   // current total
        fc.constantFrom(250, 500, 1000),        // quick-add amount
        (total, amount) => {
          return addWater(total, amount) === total + amount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Progress bar percentage calculation (water)
// ---------------------------------------------------------------------------

describe('Property 9: Progress bar percentage calculation (water)', () => {
  test('calcProgress equals Math.min((current/goal)*100, 100) for any inputs', () => {
    // Feature: nijam-paaku-daily-tracker, Property 9: Progress bar percentage calculation
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),   // current value
        fc.integer({ min: 1, max: 100000 }),   // positive goal
        (current, goal) => {
          const expected = Math.min((current / goal) * 100, 100);
          return calcProgress(current, goal) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Water goal persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 10: Water goal persistence round-trip', () => {
  test('saving a goal to a mock store and reading it back returns the same value', () => {
    // Feature: nijam-paaku-daily-tracker, Property 10: Water goal persistence round-trip
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),   // goal value
        (goal) => {
          const store = makeStore();
          storeSet(store, 'water_goal', goal);
          const retrieved = storeGet(store, 'water_goal', null);
          return retrieved === goal;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Water goal completion indicator
// ---------------------------------------------------------------------------

describe('Property 11: Water goal completion indicator', () => {
  test('isGoalMet is true iff total >= goal', () => {
    // Feature: nijam-paaku-daily-tracker, Property 11: Water goal completion indicator
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),   // total
        fc.integer({ min: 1, max: 100000 }),   // goal
        (total, goal) => {
          return isGoalMet(total, goal) === (total >= goal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
