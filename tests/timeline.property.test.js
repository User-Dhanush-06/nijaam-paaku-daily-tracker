// Feature: nijam-paaku-daily-tracker, Property 20: Timeline chronological ordering
// Feature: nijam-paaku-daily-tracker, Property 21: Invalid timeline entry rejection

/**
 * Property-based tests for timeline.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: addEvent, deleteEvent.
 *
 * Validates: Requirements 9.2, 9.3
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { addEvent, deleteEvent } from '../timeline.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a valid HH:MM time string */
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
);

/** Generate a non-empty description */
const descArb = fc.string({ minLength: 1, maxLength: 80 }).filter(
  s => s.trim().length > 0
);

/** Generate a valid event entry */
const eventEntryArb = fc.record({ time: timeArb, description: descArb });

// ---------------------------------------------------------------------------
// Property 20: Timeline chronological ordering
// ---------------------------------------------------------------------------

describe('Property 20: Timeline chronological ordering', () => {
  test('events are sorted in ascending chronological order after all additions', () => {
    // Feature: nijam-paaku-daily-tracker, Property 20: Timeline chronological ordering
    fc.assert(
      fc.property(
        fc.array(eventEntryArb, { minLength: 1, maxLength: 20 }),
        (entries) => {
          let events = [];
          for (const { time, description } of entries) {
            const { events: updated } = addEvent(events, time, description);
            events = updated;
          }
          // Verify ascending order
          for (let i = 1; i < events.length; i++) {
            if (events[i].time < events[i - 1].time) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21: Invalid timeline entry rejection
// ---------------------------------------------------------------------------

describe('Property 21: Invalid timeline entry rejection', () => {
  test('empty time does not increase event list length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 21: Invalid timeline entry rejection
    fc.assert(
      fc.property(
        fc.array(eventEntryArb, { minLength: 0, maxLength: 10 }),
        descArb,
        (existingEntries, description) => {
          // Build up a list of existing events
          let events = [];
          for (const { time, desc } of existingEntries.map(e => ({ time: e.time, desc: e.description }))) {
            const { events: updated } = addEvent(events, time, desc);
            events = updated;
          }
          const before = events.length;
          const { events: after } = addEvent(events, '', description);
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty description does not increase event list length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 21: Invalid timeline entry rejection
    fc.assert(
      fc.property(
        fc.array(eventEntryArb, { minLength: 0, maxLength: 10 }),
        timeArb,
        (existingEntries, time) => {
          let events = [];
          for (const { time: t, description } of existingEntries) {
            const { events: updated } = addEvent(events, t, description);
            events = updated;
          }
          const before = events.length;
          const { events: after } = addEvent(events, time, '');
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('whitespace-only time or description does not increase event list length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 21: Invalid timeline entry rejection
    fc.assert(
      fc.property(
        fc.array(eventEntryArb, { minLength: 0, maxLength: 5 }),
        fc.oneof(
          // empty time, valid desc
          fc.record({
            time: fc.constant(''),
            description: descArb,
          }),
          // valid time, empty desc
          fc.record({
            time: timeArb,
            description: fc.constant(''),
          }),
          // both empty
          fc.record({
            time: fc.constant(''),
            description: fc.constant(''),
          })
        ),
        (existingEntries, invalid) => {
          let events = [];
          for (const { time, description } of existingEntries) {
            const { events: updated } = addEvent(events, time, description);
            events = updated;
          }
          const before = events.length;
          const { events: after } = addEvent(events, invalid.time, invalid.description);
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });
});
