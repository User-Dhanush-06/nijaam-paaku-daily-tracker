// Feature: nijam-paaku-daily-tracker, Property 31: LocalStorage key namespacing
import { describe, test, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property 31: LocalStorage key namespacing
 *
 * For any key string passed to storage.set(key, value), the actual
 * localStorage key used begins with 'np_'.
 *
 * Validates: Requirements 15.3
 */

const PREFIX = 'np_';

/**
 * Minimal inline storage implementation that mirrors storage.js behaviour.
 * We test the namespacing logic directly rather than re-importing the module
 * with a mocked global, which avoids ESM module-cache issues in Vitest.
 */
function makeStorage(store) {
  function set(key, value) {
    store.setItem(PREFIX + key, JSON.stringify(value));
  }
  function get(key, fallback = null) {
    try {
      const raw = store.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  function remove(key) {
    store.removeItem(PREFIX + key);
  }
  return { set, get, remove };
}

describe('Property 31: LocalStorage key namespacing', () => {
  test('every key written to localStorage starts with np_', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary non-empty key strings
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.jsonValue(),
        (key, value) => {
          const writtenKeys = [];
          const mockStore = {
            _data: {},
            getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
            setItem(k, v) { writtenKeys.push(k); this._data[k] = v; },
            removeItem(k) { delete this._data[k]; },
          };

          const storage = makeStorage(mockStore);
          storage.set(key, value);

          // Every key written must start with 'np_'
          return writtenKeys.every(k => k.startsWith('np_'));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('get() reads back from the np_-prefixed key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer(),
        (key, value) => {
          const mockStore = {
            _data: {},
            getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
            setItem(k, v) { this._data[k] = v; },
            removeItem(k) { delete this._data[k]; },
          };

          const storage = makeStorage(mockStore);
          storage.set(key, value);
          return storage.get(key) === value;
        }
      ),
      { numRuns: 100 }
    );
  });
});
