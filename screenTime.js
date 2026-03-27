import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Validate a screen time value.
 * Valid iff numeric and 0 <= value <= 24.
 * @param {*} value
 * @returns {{ valid: boolean, hours: number }}
 */
export function validateScreenTime(value) {
  const num = Number(value);
  if (value === '' || value === null || value === undefined || isNaN(num)) {
    return { valid: false, hours: 0 };
  }
  if (num < 0 || num > 24) {
    return { valid: false, hours: num };
  }
  return { valid: true, hours: num };
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _hours = null;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#screenTime');
  if (!section) return;

  const displayValue = _hours !== null ? `${_hours}h` : '--';

  section.innerHTML = `
    <h2>📱 Screen Time</h2>
    <div class="screentime-form">
      <label for="screentime-input">Hours today (0–24):</label>
      <input id="screentime-input" type="number" min="0" max="24" step="0.5" />
      <button id="screentime-submit">Save</button>
      <p class="screentime-error" style="display:none; color:red;"></p>
    </div>
    <p class="screentime-display">Screen time: <strong>${displayValue}</strong></p>
  `;

  const input = section.querySelector('#screentime-input');
  const errorEl = section.querySelector('.screentime-error');

  // Clear error on input
  input.addEventListener('input', () => {
    errorEl.style.display = 'none';
  });

  section.querySelector('#screentime-submit').addEventListener('click', () => {
    const result = validateScreenTime(input.value);
    if (!result.valid) {
      errorEl.textContent = 'Please enter a number between 0 and 24.';
      errorEl.style.display = 'block';
      return;
    }
    _hours = result.hours;
    _persist();
    _render();
  });
}

function _persist() {
  const key = `screentime_${todayKey()}`;
  set(key, { hours: _hours });
  emit('screentime:updated', _hours);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  const data = get(`screentime_${todayKey()}`, null);
  _hours = data ? (data.hours ?? null) : null;
  _render();
}

export function reset() {
  _hours = null;
  _persist();
  _render();
}
