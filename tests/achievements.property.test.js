// Feature: nijam-paaku-daily-tracker, Property 25: Hydration Master achievement unlock
// Feature: nijam-paaku-daily-tracker, Property 26: Task Slayer achievement unlock
// Feature: nijam-paaku-daily-tracker, Property 27: Early Bird achievement unlock
// Feature: nijam-paaku-daily-tracker, Property 28: Achievement persistence round-trip

/**
 * Property-based tests for achievements.js pure logic functions.
 * Validates: Requirements 12.1, 12.2, 12.3, 12.6
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import {
  checkHydrationMaster,
  checkTaskSlayer,
  checkEarlyBird,
  isUnlocked,
  unlockAchievement,
} from '../achievements.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(data) {
  return {
    get(key, fallback = null) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : fallback;
    },
  };
}

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
// Property 25: Hydration Master achievement unlock
// ---------------------------------------------------------------------------

describe('Property 25: Hydration Master achievement unlock', () => {
  test('checkHydrationMaster returns true when water >= goal for all 7 days', () => {
    // Feature: nijam-paaku-daily-tracker, Property 25: Hydration Master achievement unlock
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5000 }),   // goal
        fc.integer({ min: 0, max: 5000 }),   // extra above goal
        (goal, extra) => {
          const storeData = {};
          keys.forEach(day => {
            storeData[`water_${day}`] = { total: goal + extra };
          });
          const store = makeStore(storeData);
          return checkHydrationMaster(store, keys, goal) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkHydrationMaster returns false when any day is below goal', () => {
    // Feature: nijam-paaku-daily-tracker, Property 25: Hydration Master achievement unlock
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5000 }),   // goal (min 2 so goal-1 >= 1)
        fc.integer({ min: 0, max: 6 }),      // which day is below goal
        (goal, belowDayIndex) => {
          const storeData = {};
          keys.forEach((day, i) => {
            storeData[`water_${day}`] = { total: i === belowDayIndex ? goal - 1 : goal };
          });
          const store = makeStore(storeData);
          return checkHydrationMaster(store, keys, goal) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 26: Task Slayer achievement unlock
// ---------------------------------------------------------------------------

describe('Property 26: Task Slayer achievement unlock', () => {
  test('checkTaskSlayer returns true when 10+ tasks completed today', () => {
    // Feature: nijam-paaku-daily-tracker, Property 26: Task Slayer achievement unlock
    const today = '2024-06-15';

    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }),   // number of completed tasks today
        (count) => {
          const tasks = Array.from({ length: count }, (_, i) => ({
            id: String(i),
            description: `Task ${i}`,
            completed: true,
            completedAt: `${today}T10:00:00.000Z`,
          }));
          return checkTaskSlayer(tasks, today) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkTaskSlayer returns false when fewer than 10 tasks completed today', () => {
    // Feature: nijam-paaku-daily-tracker, Property 26: Task Slayer achievement unlock
    const today = '2024-06-15';

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }),   // fewer than 10
        (count) => {
          const tasks = Array.from({ length: count }, (_, i) => ({
            id: String(i),
            description: `Task ${i}`,
            completed: true,
            completedAt: `${today}T10:00:00.000Z`,
          }));
          return checkTaskSlayer(tasks, today) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 27: Early Bird achievement unlock
// ---------------------------------------------------------------------------

describe('Property 27: Early Bird achievement unlock', () => {
  test('checkEarlyBird returns true when sleep < 22:00 and wake < 06:30 for last 3 days', () => {
    // Feature: nijam-paaku-daily-tracker, Property 27: Early Bird achievement unlock
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        // sleep hour: 18–21 (before 22:00)
        fc.integer({ min: 18, max: 21 }),
        fc.integer({ min: 0, max: 59 }),
        // wake hour: 4–6, minute: 0–29 (before 06:30)
        fc.integer({ min: 4, max: 5 }),
        fc.integer({ min: 0, max: 59 }),
        (sh, sm, wh, wm) => {
          const sleepTime = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
          const wakeTime = `${String(wh).padStart(2, '0')}:${String(wm).padStart(2, '0')}`;
          const storeData = {};
          // Set last 3 days with qualifying sleep/wake
          keys.slice(-3).forEach(day => {
            storeData[`sleep_${day}`] = { sleepTime, wakeTime, duration: 480 };
          });
          const store = makeStore(storeData);
          return checkEarlyBird(store, keys) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('checkEarlyBird returns false when sleep >= 22:00 for any of last 3 days', () => {
    // Feature: nijam-paaku-daily-tracker, Property 27: Early Bird achievement unlock
    const keys = makeWeekKeys();

    fc.assert(
      fc.property(
        fc.integer({ min: 22, max: 23 }),   // sleep hour >= 22
        fc.integer({ min: 0, max: 59 }),
        (sh, sm) => {
          const sleepTime = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
          const storeData = {};
          keys.slice(-3).forEach(day => {
            storeData[`sleep_${day}`] = { sleepTime, wakeTime: '05:00', duration: 420 };
          });
          const store = makeStore(storeData);
          return checkEarlyBird(store, keys) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 28: Achievement persistence round-trip
// ---------------------------------------------------------------------------

describe('Property 28: Achievement persistence round-trip', () => {
  test('unlockAchievement adds an entry with the given id', () => {
    // Feature: nijam-paaku-daily-tracker, Property 28: Achievement persistence round-trip
    fc.assert(
      fc.property(
        fc.constantFrom('hydration_master', 'task_slayer', 'early_bird'),
        (id) => {
          const updated = unlockAchievement([], id);
          return updated.some(a => a.id === id);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('isUnlocked returns true after unlocking', () => {
    // Feature: nijam-paaku-daily-tracker, Property 28: Achievement persistence round-trip
    fc.assert(
      fc.property(
        fc.constantFrom('hydration_master', 'task_slayer', 'early_bird'),
        (id) => {
          const achievements = unlockAchievement([], id);
          return isUnlocked(achievements, id) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unlockAchievement is idempotent – does not duplicate entries', () => {
    // Feature: nijam-paaku-daily-tracker, Property 28: Achievement persistence round-trip
    fc.assert(
      fc.property(
        fc.constantFrom('hydration_master', 'task_slayer', 'early_bird'),
        (id) => {
          let achievements = unlockAchievement([], id);
          achievements = unlockAchievement(achievements, id);
          return achievements.filter(a => a.id === id).length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mock store round-trip: stored achievements contain the unlocked id', () => {
    // Feature: nijam-paaku-daily-tracker, Property 28: Achievement persistence round-trip
    const PREFIX = 'np_';

    function makeRawStore() {
      const data = {};
      return {
        setItem: (k, v) => { data[k] = v; },
        getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
      };
    }

    fc.assert(
      fc.property(
        fc.constantFrom('hydration_master', 'task_slayer', 'early_bird'),
        (id) => {
          const store = makeRawStore();
          const achievements = unlockAchievement([], id);
          store.setItem(PREFIX + 'achievements', JSON.stringify(achievements));
          const raw = store.getItem(PREFIX + 'achievements');
          const parsed = JSON.parse(raw);
          return parsed.some(a => a.id === id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
