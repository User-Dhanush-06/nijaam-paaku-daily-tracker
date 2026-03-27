// Feature: nijam-paaku-daily-tracker, Property 19: Habit streak calculation

/**
 * Property-based tests for habits.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: calcStreak, toggleHabitCompletion.
 *
 * Validates: Requirements 8.2, 8.3, 8.4
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { calcStreak } from '../habits.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a valid YYYY-MM-DD date key */
const dateKeyArb = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
);

/**
 * Add `n` days to a YYYY-MM-DD string.
 */
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Property 19: Habit streak calculation
// ---------------------------------------------------------------------------

describe('Property 19: Habit streak calculation', () => {
  test('streak equals trailing consecutive days ending on or before today', () => {
    // Feature: nijam-paaku-daily-tracker, Property 19: Habit streak calculation
    fc.assert(
      fc.property(
        dateKeyArb,                                    // today
        fc.integer({ min: 0, max: 14 }),               // streak length to build
        fc.array(fc.integer({ min: 2, max: 30 }), { minLength: 0, maxLength: 5 }), // extra gap days
        (today, streakLen, gapDays) => {
          // Build a consecutive run of `streakLen` days ending on today
          const completions = [];
          for (let i = 0; i < streakLen; i++) {
            completions.push(addDays(today, -i));
          }
          // Add some completions with gaps (should not extend streak)
          for (const gap of gapDays) {
            completions.push(addDays(today, -(streakLen + gap)));
          }

          const result = calcStreak(completions, today);
          return result === streakLen;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('streak is 0 when most recent completion was not yesterday or today', () => {
    // Feature: nijam-paaku-daily-tracker, Property 19: Habit streak calculation
    fc.assert(
      fc.property(
        dateKeyArb,                                    // today
        fc.integer({ min: 2, max: 30 }),               // gap (days before today)
        fc.integer({ min: 1, max: 10 }),               // run length before the gap
        (today, gap, runLen) => {
          // Build completions that ended `gap` days ago (not yesterday or today)
          const completions = [];
          for (let i = 0; i < runLen; i++) {
            completions.push(addDays(today, -(gap + i)));
          }
          const result = calcStreak(completions, today);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('streak is 0 for empty completions', () => {
    // Feature: nijam-paaku-daily-tracker, Property 19: Habit streak calculation
    fc.assert(
      fc.property(
        dateKeyArb,
        (today) => calcStreak([], today) === 0
      ),
      { numRuns: 100 }
    );
  });

  test('streak counts only up to today (future completions ignored)', () => {
    // Feature: nijam-paaku-daily-tracker, Property 19: Habit streak calculation
    fc.assert(
      fc.property(
        dateKeyArb,
        fc.integer({ min: 1, max: 10 }),
        (today, futureDays) => {
          // Only future completions — should be 0
          const completions = [];
          for (let i = 1; i <= futureDays; i++) {
            completions.push(addDays(today, i));
          }
          return calcStreak(completions, today) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
