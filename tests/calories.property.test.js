// Feature: nijam-paaku-daily-tracker, Property 12: Invalid meal entry rejection
// Feature: nijam-paaku-daily-tracker, Property 13: Valid meal entry addition
// Feature: nijam-paaku-daily-tracker, Property 9: Progress bar percentage calculation

/**
 * Property-based tests for calories.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: addMeal, calcCaloriesTotal, calcProgress.
 *
 * Validates: Requirements 4.2, 4.3, 4.4
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { addMeal, calcCaloriesTotal, calcProgress } from '../calories.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A valid meal entry already in the log */
const mealEntryArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  calories: fc.integer({ min: 1, max: 5000 }),
});

const mealListArb = fc.array(mealEntryArb, { minLength: 0, maxLength: 20 });

/** Strings that are empty or whitespace-only */
const emptyOrWhitespaceArb = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 20 })
);

// ---------------------------------------------------------------------------
// Property 12: Invalid meal entry rejection
// ---------------------------------------------------------------------------

describe('Property 12: Invalid meal entry rejection', () => {
  test('empty name does not increase meal log length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 12: Invalid meal entry rejection
    fc.assert(
      fc.property(
        mealListArb,
        emptyOrWhitespaceArb,
        fc.integer({ min: 1, max: 5000 }),   // positive calories (name is the invalid part)
        (meals, emptyName, calories) => {
          const before = meals.length;
          const { meals: after } = addMeal(meals, emptyName, calories);
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('calories <= 0 does not increase meal log length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 12: Invalid meal entry rejection
    fc.assert(
      fc.property(
        mealListArb,
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.oneof(
          fc.constant(0),
          fc.integer({ min: -10000, max: -1 })
        ),
        (meals, name, invalidCalories) => {
          const before = meals.length;
          const { meals: after } = addMeal(meals, name, invalidCalories);
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Valid meal entry addition
// ---------------------------------------------------------------------------

describe('Property 13: Valid meal entry addition', () => {
  test('valid meal increases log length by 1 and total by the calorie value', () => {
    // Feature: nijam-paaku-daily-tracker, Property 13: Valid meal entry addition
    fc.assert(
      fc.property(
        mealListArb,
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.integer({ min: 1, max: 5000 }),
        (meals, name, calories) => {
          const beforeLength = meals.length;
          const beforeTotal = calcCaloriesTotal(meals);

          const { meals: after, added } = addMeal(meals, name, calories);

          if (!added) return false; // should have been added

          const afterLength = after.length;
          const afterTotal = calcCaloriesTotal(after);

          return (
            afterLength === beforeLength + 1 &&
            afterTotal === beforeTotal + calories
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9 (calories): Progress bar percentage calculation
// ---------------------------------------------------------------------------

describe('Property 9 (calories): Progress bar percentage calculation', () => {
  test('calcProgress equals Math.min((total/goal)*100, 100) for any inputs', () => {
    // Feature: nijam-paaku-daily-tracker, Property 9: Progress bar percentage calculation
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),   // total
        fc.integer({ min: 1, max: 100000 }),   // positive goal
        (total, goal) => {
          const expected = Math.min((total / goal) * 100, 100);
          return calcProgress(total, goal) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
