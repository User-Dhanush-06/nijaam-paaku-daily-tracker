import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions / constants (exported for testing)
// ---------------------------------------------------------------------------

/** The five valid mood options. */
export const MOODS = ['Happy', 'Neutral', 'Sad', 'Tired', 'Energetic'];

/**
 * Get the mood stored for a given date key.
 * @param {{ get: (key: string) => * }} store - object with a get(key) method
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @returns {string|null}
 */
export function getMoodForDay(store, dateKey) {
  const value = store.get(`mood_${dateKey}`);
  if (MOODS.includes(value)) return value;
  return null;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _selectedMood = null;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#mood');
  if (!section) return;

  section.innerHTML = `
    <h2>😊 Mood Tracker</h2>
    <div class="mood-buttons">
      ${MOODS.map(mood => `
        <button
          class="mood-btn${_selectedMood === mood ? ' selected' : ''}"
          data-mood="${mood}"
        >${mood}</button>
      `).join('')}
    </div>
    <p class="mood-display">Today's mood: <strong>${_selectedMood ?? '--'}</strong></p>
  `;

  section.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _selectedMood = btn.dataset.mood;
      _persist();
      _render();
    });
  });
}

function _persist() {
  const key = `mood_${todayKey()}`;
  set(key, _selectedMood);
  emit('mood:updated', _selectedMood);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  const today = todayKey();
  const stored = get(`mood_${today}`, null);
  _selectedMood = MOODS.includes(stored) ? stored : null;
  _render();
}

export function reset() {
  _selectedMood = null;
  _persist();
  _render();
}
