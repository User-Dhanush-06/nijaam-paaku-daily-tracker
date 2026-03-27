import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Get the journal entry for a given date key from a store object.
 *
 * @param {{ get: (key: string) => * }} store
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {string}
 */
export function getJournalEntry(store, dateKey) {
  const value = store.get(`journal_${dateKey}`);
  if (typeof value === 'string') return value;
  return '';
}

/**
 * Save a journal entry for a given date key to a store object.
 *
 * @param {{ set: (key: string, value: *) => void }} store
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @param {string} text
 */
export function saveJournalEntry(store, dateKey, text) {
  store.set(`journal_${dateKey}`, text);
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _text = '';

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function _storageKey() {
  return `journal_${todayKey()}`;
}

function _persist() {
  set(_storageKey(), _text);
  emit('journal:updated', _text);
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#journal');
  if (!section) return;

  section.innerHTML = `
    <h2>📓 Daily Journal</h2>
    <textarea class="journal-textarea" rows="8" placeholder="Write your thoughts for today...">${_text}</textarea>
    <button class="journal-save-btn">Save</button>
  `;

  const textarea = section.querySelector('.journal-textarea');
  const saveBtn = section.querySelector('.journal-save-btn');

  saveBtn.addEventListener('click', () => {
    _text = textarea ? textarea.value : '';
    _persist();
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _text = get(_storageKey(), '');
  if (typeof _text !== 'string') _text = '';
  _render();
}

export function reset() {
  _text = '';
  _persist();
  _render();
}
