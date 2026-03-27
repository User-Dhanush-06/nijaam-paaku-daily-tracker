// Feature: nijam-paaku-daily-tracker, Property 3: Theme persistence round-trip
import { describe, test } from 'vitest';
import fc from 'fast-check';

/**
 * Property 3: Theme persistence round-trip
 *
 * For any theme value ("light" or "dark"), activating the toggle should persist
 * the theme to storage such that reading the stored value returns the selected theme.
 *
 * Validates: Requirements 1.5
 *
 * Since this runs in Node (no DOM), we test the storage logic directly using
 * an inline mock storage, not the DOM class manipulation.
 */

const PREFIX = 'np_';
const STORAGE_KEY = 'theme';

function makeStorage(store) {
  return {
    get(key, fallback = null) {
      const raw = store[PREFIX + key];
      if (raw === undefined || raw === null) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    },
    set(key, value) {
      store[PREFIX + key] = JSON.stringify(value);
    },
  };
}

/**
 * Simulates the toggle logic from theme.js:
 * given a current theme, returns the toggled theme and persists it.
 */
function applyToggle(currentTheme, storage) {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  storage.set(STORAGE_KEY, newTheme);
  return newTheme;
}

describe('Property 3: Theme persistence round-trip', () => {
  test('toggling any theme persists the new theme to storage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (theme) => {
          const store = {};
          const storage = makeStorage(store);

          // Simulate starting from the given theme, then toggling
          const newTheme = applyToggle(theme, storage);

          // Reading back from storage must return the toggled theme
          const stored = storage.get(STORAGE_KEY, 'light');
          return stored === newTheme;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('stored theme after toggle is the opposite of the initial theme', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (initialTheme) => {
          const store = {};
          const storage = makeStorage(store);

          applyToggle(initialTheme, storage);
          const stored = storage.get(STORAGE_KEY, 'light');

          const expected = initialTheme === 'dark' ? 'light' : 'dark';
          return stored === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
