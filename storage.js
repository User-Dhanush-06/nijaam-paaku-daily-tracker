import { emit } from './eventBus.js';

const PREFIX = 'np_';

/** Whether localStorage is available and functional. */
export let storageAvailable = isAvailable();

/**
 * Check if localStorage is available.
 * @returns {boolean}
 */
export function isAvailable() {
  try {
    const testKey = PREFIX + '__test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a value from localStorage.
 * @param {string} key  - without prefix
 * @param {*} fallback  - returned when key is missing or on error
 * @returns {*}
 */
export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    _handleError(err);
    return fallback;
  }
}

/**
 * Write a value to localStorage.
 * @param {string} key  - without prefix
 * @param {*} value     - will be JSON-serialised
 */
export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    storageAvailable = false;
    _handleError(err);
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key  - without prefix
 */
export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (err) {
    _handleError(err);
  }
}

function _handleError(err) {
  try {
    emit('storage:error', err);
  } catch {
    // eventBus itself may not be available in all test environments
  }
}
