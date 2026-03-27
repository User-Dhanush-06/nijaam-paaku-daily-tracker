import * as storage from './storage.js';

const STORAGE_KEY = 'theme';

/**
 * Initialise theme: apply stored preference and wire up the toggle button.
 */
export function init() {
  const stored = storage.get(STORAGE_KEY, 'light');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  }

  const btn = document.getElementById('dark-mode-toggle');
  if (btn) {
    btn.addEventListener('click', _toggle);
  }
}

/**
 * Toggle dark/light theme, persist to storage.
 */
function _toggle() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  storage.set(STORAGE_KEY, isDark ? 'dark' : 'light');
}

/**
 * Returns the current theme string based on the <html> class.
 * @returns {'light'|'dark'}
 */
export function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
