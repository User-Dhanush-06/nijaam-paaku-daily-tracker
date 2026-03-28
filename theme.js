import * as storage from './storage.js';

const STORAGE_KEY = 'theme';

export function init() {
  // Apply stored theme on load (default = dark for our liquid glass design)
  const stored = storage.get(STORAGE_KEY, 'dark');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Wire BOTH toggle buttons (desktop sidebar + mobile header)
  document.querySelectorAll('.theme-toggle, #dark-mode-toggle, #dark-mode-toggle-desktop').forEach(btn => {
    btn.addEventListener('click', _toggle);
  });

  _updateIcons();
}

function _toggle() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  storage.set(STORAGE_KEY, isDark ? 'dark' : 'light');
  _updateIcons();
}

function _updateIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('.theme-toggle, #dark-mode-toggle, #dark-mode-toggle-desktop').forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  });
}

export function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
