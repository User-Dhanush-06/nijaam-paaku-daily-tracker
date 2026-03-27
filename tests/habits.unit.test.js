// @vitest-environment jsdom
/**
 * Unit tests for habits.js – DOM rendering
 * Requirements: 8.1
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock storage, eventBus, and dateUtils before importing habits
// ---------------------------------------------------------------------------

vi.mock('../storage.js', () => ({
  get: vi.fn((_key, fallback = null) => fallback),
  set: vi.fn(),
}));

vi.mock('../eventBus.js', () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('../dateUtils.js', () => ({
  todayKey: vi.fn(() => '2024-06-15'),
}));

import { init, DEFAULT_HABITS } from '../habits.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Habit Tracker initial render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="habits"></div>';
  });

  test('renders exactly 5 default habit items when no stored data exists', () => {
    init();
    const items = document.querySelectorAll('.habit-item');
    expect(items.length).toBe(5);
  });

  test('renders all five default habit names', () => {
    init();
    const names = Array.from(document.querySelectorAll('.habit-name')).map(
      el => el.textContent.trim()
    );
    expect(names).toEqual(DEFAULT_HABITS);
  });

  test('each habit item has a toggle button', () => {
    init();
    const buttons = document.querySelectorAll('.habit-toggle-btn');
    expect(buttons.length).toBe(5);
  });
});
