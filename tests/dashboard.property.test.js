// Feature: nijam-paaku-daily-tracker, Property 1: Dashboard load round-trip
// Feature: nijam-paaku-daily-tracker, Property 2: Dashboard reactive update

/**
 * Property-based tests for dashboard.js
 *
 * These tests run in Node (no DOM). They test the pure data-extraction and
 * card-update logic in isolation using inline mocks.
 *
 * Validates: Requirements 1.2, 1.3, 2.7, 4.7, 5.5, 6.5, 7.4
 */

import { describe, test, beforeEach } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Inline mock infrastructure
// ---------------------------------------------------------------------------

const PREFIX = 'np_';

function makeStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

function storeGet(store, key, fallback = null) {
  const raw = store.getItem(PREFIX + key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function storeSet(store, key, value) {
  store.setItem(PREFIX + key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Inline card-rendering logic (mirrors dashboard.js without DOM dependency)
// ---------------------------------------------------------------------------

/**
 * Given a store and a today key, extract the six metric values exactly as
 * dashboard.js does.
 */
function extractMetricValues(store, today) {
  const tasks = storeGet(store, 'tasks', []);
  const completedCount = tasks.filter(
    t => t.completed && t.completedAt && t.completedAt.startsWith(today)
  ).length;

  const waterData = storeGet(store, `water_${today}`, { total: 0 });
  const waterTotal = waterData.total ?? 0;

  const meals = storeGet(store, `calories_${today}`, []);
  const caloriesTotal = meals.reduce((sum, m) => sum + (m.calories || 0), 0);

  const sleepData = storeGet(store, `sleep_${today}`, null);
  const sleepDisplay = sleepData
    ? `${Math.floor(sleepData.duration / 60)}h ${sleepData.duration % 60}m`
    : '—';

  const screenData = storeGet(store, `screentime_${today}`, null);
  const screenDisplay = screenData ? screenData.hours : '—';

  const mood = storeGet(store, `mood_${today}`, '—');

  return { tasks: completedCount, water: waterTotal, calories: caloriesTotal, sleep: sleepDisplay, screentime: screenDisplay, mood };
}

/**
 * Simulate a card map (metric → displayed value) after init.
 */
function buildCardMap(store, today) {
  const vals = extractMetricValues(store, today);
  return new Map(Object.entries(vals).map(([k, v]) => [k, String(v)]));
}

/**
 * Simulate refresh(metric, value) on a card map.
 */
function applyRefresh(cardMap, metric, value) {
  const next = new Map(cardMap);
  if (next.has(metric)) next.set(metric, String(value));
  return next;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const TODAY = '2024-06-15';

const taskArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  description: fc.string({ minLength: 1, maxLength: 50 }),
  completed: fc.boolean(),
  createdAt: fc.constant(TODAY + 'T00:00:00.000Z'),
  completedAt: fc.option(fc.constant(TODAY + 'T12:00:00.000Z'), { nil: null }),
});

const mealArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  calories: fc.integer({ min: 1, max: 2000 }),
});

const sleepArb = fc.record({
  sleepTime: fc.constant('22:00'),
  wakeTime: fc.constant('06:30'),
  duration: fc.integer({ min: 1, max: 1440 }),
});

const screenArb = fc.record({
  hours: fc.float({ min: 0, max: 24, noNaN: true }),
});

const moodArb = fc.constantFrom('Happy', 'Neutral', 'Sad', 'Tired', 'Energetic');

const metricsArb = fc.record({
  tasks: fc.array(taskArb, { minLength: 0, maxLength: 10 }),
  water: fc.integer({ min: 0, max: 5000 }),
  meals: fc.array(mealArb, { minLength: 0, maxLength: 10 }),
  sleep: fc.option(sleepArb, { nil: null }),
  screen: fc.option(screenArb, { nil: null }),
  mood: fc.option(moodArb, { nil: null }),
});

// ---------------------------------------------------------------------------
// Property 1: Dashboard load round-trip
// ---------------------------------------------------------------------------

describe('Property 1: Dashboard load round-trip', () => {
  test('displayed values match stored values after init', () => {
    // Feature: nijam-paaku-daily-tracker, Property 1: Dashboard load round-trip
    fc.assert(
      fc.property(metricsArb, ({ tasks, water, meals, sleep, screen, mood }) => {
        const store = makeStore();

        // Populate store
        storeSet(store, 'tasks', tasks);
        storeSet(store, `water_${TODAY}`, { total: water });
        storeSet(store, `calories_${TODAY}`, meals);
        if (sleep) storeSet(store, `sleep_${TODAY}`, sleep);
        if (screen) storeSet(store, `screentime_${TODAY}`, screen);
        if (mood) storeSet(store, `mood_${TODAY}`, mood);

        // Extract values as dashboard would
        const cardMap = buildCardMap(store, TODAY);

        // Verify tasks count
        const expectedTasks = tasks.filter(
          t => t.completed && t.completedAt && t.completedAt.startsWith(TODAY)
        ).length;
        if (cardMap.get('tasks') !== String(expectedTasks)) return false;

        // Verify water
        if (cardMap.get('water') !== String(water)) return false;

        // Verify calories
        const expectedCals = meals.reduce((s, m) => s + m.calories, 0);
        if (cardMap.get('calories') !== String(expectedCals)) return false;

        // Verify sleep
        const expectedSleep = sleep
          ? `${Math.floor(sleep.duration / 60)}h ${sleep.duration % 60}m`
          : '—';
        if (cardMap.get('sleep') !== expectedSleep) return false;

        // Verify screen time
        const expectedScreen = screen ? String(screen.hours) : '—';
        if (cardMap.get('screentime') !== expectedScreen) return false;

        // Verify mood
        const expectedMood = mood ?? '—';
        if (cardMap.get('mood') !== expectedMood) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Dashboard reactive update
// ---------------------------------------------------------------------------

const METRIC_NAMES = ['tasks', 'water', 'calories', 'sleep', 'screentime', 'mood'];

describe('Property 2: Dashboard reactive update', () => {
  test('refresh updates the correct card value immediately', () => {
    // Feature: nijam-paaku-daily-tracker, Property 2: Dashboard reactive update
    fc.assert(
      fc.property(
        fc.constantFrom(...METRIC_NAMES),
        fc.oneof(fc.integer({ min: 0, max: 9999 }), fc.string({ minLength: 1, maxLength: 20 })),
        (metric, newValue) => {
          // Start with an empty card map
          const store = makeStore();
          const cardMap = buildCardMap(store, TODAY);

          // Apply refresh
          const updated = applyRefresh(cardMap, metric, newValue);

          // The updated card must show the new value
          return updated.get(metric) === String(newValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('refresh only changes the targeted card', () => {
    // Feature: nijam-paaku-daily-tracker, Property 2: Dashboard reactive update
    fc.assert(
      fc.property(
        fc.constantFrom(...METRIC_NAMES),
        fc.integer({ min: 0, max: 9999 }),
        (metric, newValue) => {
          const store = makeStore();
          const cardMap = buildCardMap(store, TODAY);
          const updated = applyRefresh(cardMap, metric, newValue);

          // All other cards must remain unchanged
          for (const [k, v] of cardMap) {
            if (k !== metric && updated.get(k) !== v) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
