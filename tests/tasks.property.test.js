// Feature: nijam-paaku-daily-tracker, Property 4: Empty task rejection
// Feature: nijam-paaku-daily-tracker, Property 5: Task completion moves between lists
// Feature: nijam-paaku-daily-tracker, Property 6: Task deletion removes from all lists
// Feature: nijam-paaku-daily-tracker, Property 7: Task list persistence round-trip

/**
 * Property-based tests for tasks.js pure logic functions.
 *
 * Tests run in Node (no DOM). All logic is tested via the exported pure
 * functions: addTask, completeTask, deleteTask.
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.6
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { addTask, completeTask, deleteTask } from '../tasks.js';

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
// Arbitraries
// ---------------------------------------------------------------------------

/** A valid task (non-empty description, not completed) */
const validTaskArb = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
  completed: fc.constant(false),
  createdAt: fc.constant(new Date().toISOString()),
  completedAt: fc.constant(null),
});

/** A non-empty array of valid tasks with unique ids */
const taskListArb = fc.array(validTaskArb, { minLength: 1, maxLength: 10 })
  .map(tasks => {
    // Ensure unique ids
    const seen = new Set();
    return tasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  })
  .filter(tasks => tasks.length > 0);

/** Strings composed entirely of whitespace (including empty string) */
const whitespaceStringArb = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
);

// ---------------------------------------------------------------------------
// Property 4: Empty task rejection
// ---------------------------------------------------------------------------

describe('Property 4: Empty task rejection', () => {
  test('whitespace-only descriptions do not increase task list length', () => {
    // Feature: nijam-paaku-daily-tracker, Property 4: Empty task rejection
    fc.assert(
      fc.property(
        fc.array(validTaskArb, { minLength: 0, maxLength: 10 }),
        whitespaceStringArb,
        (tasks, description) => {
          const before = tasks.length;
          const { tasks: after } = addTask(tasks, description);
          return after.length === before;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Task completion moves between lists
// ---------------------------------------------------------------------------

describe('Property 5: Task completion moves between lists', () => {
  test('completing a pending task moves it to completed and removes from pending', () => {
    // Feature: nijam-paaku-daily-tracker, Property 5: Task completion moves between lists
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        (tasks, indexSeed) => {
          const pendingTasks = tasks.filter(t => !t.completed);
          if (pendingTasks.length === 0) return true; // nothing to complete

          const target = pendingTasks[indexSeed % pendingTasks.length];
          const updated = completeTask(tasks, target.id);

          const newPending = updated.filter(t => !t.completed);
          const newCompleted = updated.filter(t => t.completed);

          const inPending = newPending.some(t => t.id === target.id);
          const inCompleted = newCompleted.some(t => t.id === target.id);

          return !inPending && inCompleted;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('completing a task sets completedAt to an ISO string', () => {
    // Feature: nijam-paaku-daily-tracker, Property 5: Task completion moves between lists
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        (tasks, indexSeed) => {
          const pendingTasks = tasks.filter(t => !t.completed);
          if (pendingTasks.length === 0) return true;

          const target = pendingTasks[indexSeed % pendingTasks.length];
          const updated = completeTask(tasks, target.id);
          const completedTask = updated.find(t => t.id === target.id);

          return (
            completedTask !== undefined &&
            typeof completedTask.completedAt === 'string' &&
            completedTask.completedAt.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Task deletion removes from all lists
// ---------------------------------------------------------------------------

describe('Property 6: Task deletion removes from all lists', () => {
  test('deleting a task removes it from both pending and completed lists', () => {
    // Feature: nijam-paaku-daily-tracker, Property 6: Task deletion removes from all lists
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        fc.boolean(), // whether to complete the task first
        (tasks, indexSeed, shouldComplete) => {
          let workingTasks = tasks;
          const target = tasks[indexSeed % tasks.length];

          // Optionally complete the task first
          if (shouldComplete) {
            workingTasks = completeTask(workingTasks, target.id);
          }

          const afterDelete = deleteTask(workingTasks, target.id);

          const inPending = afterDelete.filter(t => !t.completed).some(t => t.id === target.id);
          const inCompleted = afterDelete.filter(t => t.completed).some(t => t.id === target.id);

          return !inPending && !inCompleted;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('deleting a task reduces list length by exactly one', () => {
    // Feature: nijam-paaku-daily-tracker, Property 6: Task deletion removes from all lists
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        (tasks, indexSeed) => {
          const target = tasks[indexSeed % tasks.length];
          const afterDelete = deleteTask(tasks, target.id);
          return afterDelete.length === tasks.length - 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Task list persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 7: Task list persistence round-trip', () => {
  test('storage equals in-memory array after add operations', () => {
    // Feature: nijam-paaku-daily-tracker, Property 7: Task list persistence round-trip
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ),
        (descriptions) => {
          const store = makeStore();
          let tasks = [];

          for (const desc of descriptions) {
            const { tasks: updated } = addTask(tasks, desc);
            tasks = updated;
            // Simulate persistence
            storeSet(store, 'tasks', tasks);
            // Verify round-trip
            const stored = storeGet(store, 'tasks', []);
            if (JSON.stringify(stored) !== JSON.stringify(tasks)) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('storage equals in-memory array after complete operations', () => {
    // Feature: nijam-paaku-daily-tracker, Property 7: Task list persistence round-trip
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        (tasks, indexSeed) => {
          const store = makeStore();
          const target = tasks[indexSeed % tasks.length];

          const updated = completeTask(tasks, target.id);
          storeSet(store, 'tasks', updated);

          const stored = storeGet(store, 'tasks', []);
          return JSON.stringify(stored) === JSON.stringify(updated);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('storage equals in-memory array after delete operations', () => {
    // Feature: nijam-paaku-daily-tracker, Property 7: Task list persistence round-trip
    fc.assert(
      fc.property(
        taskListArb,
        fc.nat(),
        (tasks, indexSeed) => {
          const store = makeStore();
          const target = tasks[indexSeed % tasks.length];

          const updated = deleteTask(tasks, target.id);
          storeSet(store, 'tasks', updated);

          const stored = storeGet(store, 'tasks', []);
          return JSON.stringify(stored) === JSON.stringify(updated);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('storage equals in-memory array after mixed add/complete/delete sequence', () => {
    // Feature: nijam-paaku-daily-tracker, Property 7: Task list persistence round-trip
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({ op: fc.constant('add'), value: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0) }),
            fc.record({ op: fc.constant('complete'), value: fc.nat() }),
            fc.record({ op: fc.constant('delete'), value: fc.nat() })
          ),
          { minLength: 1, maxLength: 15 }
        ),
        (operations) => {
          const store = makeStore();
          let tasks = [];

          for (const op of operations) {
            if (op.op === 'add') {
              const { tasks: updated } = addTask(tasks, op.value);
              tasks = updated;
            } else if (op.op === 'complete') {
              const pending = tasks.filter(t => !t.completed);
              if (pending.length > 0) {
                const target = pending[op.value % pending.length];
                tasks = completeTask(tasks, target.id);
              }
            } else if (op.op === 'delete') {
              if (tasks.length > 0) {
                const target = tasks[op.value % tasks.length];
                tasks = deleteTask(tasks, target.id);
              }
            }

            // Persist and verify round-trip after each operation
            storeSet(store, 'tasks', tasks);
            const stored = storeGet(store, 'tasks', []);
            if (JSON.stringify(stored) !== JSON.stringify(tasks)) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
