// Feature: nijam-paaku-daily-tracker, Property 16: Screen time validation

/**
 * Property-based tests for screenTime.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * function: validateScreenTime.
 *
 * Validates: Requirements 6.2, 6.3
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { validateScreenTime } from '../screenTime.js';

// ---------------------------------------------------------------------------
// Property 16: Screen time validation
// ---------------------------------------------------------------------------

describe('Property 16: Screen time validation', () => {
  test('validateScreenTime returns valid:true iff 0 <= value <= 24', () => {
    // Feature: nijam-paaku-daily-tracker, Property 16: Screen time validation
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100, noNaN: true }),
        (value) => {
          const result = validateScreenTime(value);
          const expected = value >= 0 && value <= 24;
          return result.valid === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('validateScreenTime returns valid:false for non-numeric strings', () => {
    // Feature: nijam-paaku-daily-tracker, Property 16: Screen time validation
    fc.assert(
      fc.property(
        fc.string().filter(s => isNaN(Number(s)) && s.trim() !== ''),
        (value) => {
          const result = validateScreenTime(value);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
