// @vitest-environment jsdom
/**
 * Unit tests for dashboard.js – initial render
 * Requirements: 1.1
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock storage and eventBus before importing dashboard
// ---------------------------------------------------------------------------

vi.mock('../storage.js', () => ({
  get: vi.fn((_key, fallback = null) => fallback),
}));

vi.mock('../eventBus.js', () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('../dateUtils.js', () => ({
  todayKey: vi.fn(() => '2024-06-15'),
}));

import { init } from '../dashboard.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dashboard initial render', () => {
  beforeEach(() => {
    // Set up a fresh #dashboard container in the DOM
    document.body.innerHTML = '<div id="dashboard"></div>';
  });

  test('renders exactly six summary cards', () => {
    init();
    const cards = document.querySelectorAll('[data-metric]');
    expect(cards.length).toBe(6);
  });

  test('all six data-metric attributes are present', () => {
    init();
    const expected = ['tasks', 'water', 'calories', 'sleep', 'screentime', 'mood'];
    for (const metric of expected) {
      const card = document.querySelector(`[data-metric="${metric}"]`);
      expect(card, `card for metric "${metric}" should exist`).not.toBeNull();
    }
  });

  test('each card has .metric-icon, .metric-label, and .metric-value', () => {
    init();
    const cards = document.querySelectorAll('[data-metric]');
    for (const card of cards) {
      expect(card.querySelector('.metric-icon'), `${card.dataset.metric} missing .metric-icon`).not.toBeNull();
      expect(card.querySelector('.metric-label'), `${card.dataset.metric} missing .metric-label`).not.toBeNull();
      expect(card.querySelector('.metric-value'), `${card.dataset.metric} missing .metric-value`).not.toBeNull();
    }
  });
});
