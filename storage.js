import { emit } from './eventBus.js';

const PREFIX = 'np_';

export let storageAvailable = isAvailable();

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

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    storageAvailable = false;
    _handleError(err);
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (err) {
    _handleError(err);
  }
}

/** Remove every key in localStorage that belongs to this app. */
export function clearAll() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Show a brief toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `np-toast np-toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('np-toast-show'));
  });
  setTimeout(() => {
    toast.classList.remove('np-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function _handleError(err) {
  try { emit('storage:error', err); } catch { /* silent in test environments */ }
}
