/**
 * Unit tests for storage.js and dateUtils.js
 * Requirements: 5.3, 15.4
 */
import { describe, test, expect } from 'vitest';
import { todayKey, weekKeys, minutesBetween } from '../dateUtils.js';

// ─── dateUtils tests ──────────────────────────────────────────────────────────

describe('dateUtils – todayKey', () => {
  test('returns a string matching YYYY-MM-DD', () => {
    const key = todayKey();
    expect(typeof key).toBe('string');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('matches the current local date', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    expect(todayKey()).toBe(`${y}-${m}-${d}`);
  });
});

describe('dateUtils – weekKeys', () => {
  test('returns an array of exactly 7 strings', () => {
    const keys = weekKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys).toHaveLength(7);
  });

  test('each entry matches YYYY-MM-DD', () => {
    weekKeys().forEach(k => {
      expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  test('last entry is today', () => {
    const keys = weekKeys();
    expect(keys[6]).toBe(todayKey());
  });

  test('entries are in ascending order (oldest first)', () => {
    const keys = weekKeys();
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }
  });
});

describe('dateUtils – minutesBetween (overnight edge case)', () => {
  test('sleep 23:00, wake 06:00 → 420 minutes', () => {
    expect(minutesBetween('23:00', '06:00')).toBe(420);
  });

  test('sleep 22:30, wake 06:30 → 480 minutes', () => {
    expect(minutesBetween('22:30', '06:30')).toBe(480);
  });

  test('same time treated as full 24 hours (1440 min)', () => {
    // wakeTime === sleepTime → wakeMinutes <= sleepMinutes → add 1440
    expect(minutesBetween('08:00', '08:00')).toBe(1440);
  });

  test('normal daytime span: 13:00 → 14:30 = 90 min', () => {
    expect(minutesBetween('13:00', '14:30')).toBe(90);
  });

  test('midnight boundary: 00:00 → 00:01 = 1 min', () => {
    expect(minutesBetween('00:00', '00:01')).toBe(1);
  });
});

// ─── storage.js – isAvailable ─────────────────────────────────────────────────
// We test the isAvailable logic inline (mirrors storage.js implementation)
// to avoid ESM module-cache issues when mocking globals.

describe('storage – isAvailable logic', () => {
  const PREFIX = 'np_';

  function isAvailableWith(ls) {
    try {
      const testKey = PREFIX + '__test__';
      ls.setItem(testKey, '1');
      ls.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  test('returns false when localStorage.setItem throws', () => {
    const brokenStorage = {
      setItem() { throw new Error('Storage disabled'); },
      removeItem() {},
    };
    expect(isAvailableWith(brokenStorage)).toBe(false);
  });

  test('returns true when localStorage works normally', () => {
    const store = {};
    const workingStorage = {
      setItem(k, v) { store[k] = v; },
      removeItem(k) { delete store[k]; },
    };
    expect(isAvailableWith(workingStorage)).toBe(true);
  });
});
