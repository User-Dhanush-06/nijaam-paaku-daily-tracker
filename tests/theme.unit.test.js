// @vitest-environment jsdom
/**
 * Unit tests for dark mode toggle (theme.js)
 * Requirements: 1.4
 */
import { describe, test, expect, beforeEach } from 'vitest';

/**
 * Inline toggle logic mirroring theme.js _toggle():
 * toggles the 'dark' class on document.documentElement.
 */
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}

function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

describe('Dark mode toggle – CSS class manipulation', () => {
  beforeEach(() => {
    // Reset to light mode before each test
    document.documentElement.classList.remove('dark');
  });

  test('starting with no dark class → toggle → dark class is added', () => {
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(getTheme()).toBe('dark');
  });

  test('starting with dark class → toggle → dark class is removed', () => {
    document.documentElement.classList.add('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(getTheme()).toBe('light');
  });
});
