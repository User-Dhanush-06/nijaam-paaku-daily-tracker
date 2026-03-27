// @vitest-environment jsdom
/**
 * Unit tests for analytics.js – DOM rendering
 * Requirements: 11.1, 11.2, 11.3
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock dependencies before importing analytics
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
  weekKeys: vi.fn(() => [
    '2024-06-09', '2024-06-10', '2024-06-11', '2024-06-12',
    '2024-06-13', '2024-06-14', '2024-06-15',
  ]),
}));

import { init } from '../analytics.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Analytics initial render', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="analytics"></div>';
  });

  test('creates .chart-tasks container after init()', () => {
    init();
    const el = document.querySelector('.chart-tasks');
    expect(el).not.toBeNull();
  });

  test('creates .chart-water container after init()', () => {
    init();
    const el = document.querySelector('.chart-water');
    expect(el).not.toBeNull();
  });

  test('creates .chart-sleep container after init()', () => {
    init();
    const el = document.querySelector('.chart-sleep');
    expect(el).not.toBeNull();
  });

  test('all three chart containers are inside #analytics', () => {
    init();
    const section = document.querySelector('#analytics');
    expect(section.querySelector('.chart-tasks')).not.toBeNull();
    expect(section.querySelector('.chart-water')).not.toBeNull();
    expect(section.querySelector('.chart-sleep')).not.toBeNull();
  });
});
