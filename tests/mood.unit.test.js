// @vitest-environment jsdom
/**
 * Unit tests for mood.js – DOM rendering
 * Requirements: 7.1
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock storage and eventBus before importing mood
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

import { init } from '../mood.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Mood Tracker initial render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="mood"></div>';
  });

  test('renders exactly 5 mood option buttons', () => {
    init();
    const buttons = document.querySelectorAll('.mood-btn');
    expect(buttons.length).toBe(5);
  });

  test('renders all five mood labels', () => {
    init();
    const labels = Array.from(document.querySelectorAll('.mood-btn')).map(
      btn => btn.dataset.mood
    );
    expect(labels).toEqual(['Happy', 'Neutral', 'Sad', 'Tired', 'Energetic']);
  });
});
