import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Calculate sleep duration in minutes.
 * Handles overnight: if wakeTime <= sleepTime, adds 1440 (next day).
 * @param {string} sleepTime - "HH:MM"
 * @param {string} wakeTime  - "HH:MM"
 * @returns {number} duration in minutes
 */
export function calcSleepDuration(sleepTime, wakeTime) {
  const [sh, sm] = sleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const sleepMinutes = sh * 60 + sm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 1440; // next day
  }
  return wakeMinutes - sleepMinutes;
}

/**
 * Format minutes as "Xh Ym" string.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _sleepTime = '';
let _wakeTime = '';
let _duration = 0;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#sleep');
  if (!section) return;

  const durationText = _duration > 0 ? formatDuration(_duration) : '--';

  section.innerHTML = `
    <h2>😴 Sleep Tracker</h2>
    <div class="sleep-form">
      <label for="sleep-time-input">Sleep time:</label>
      <input id="sleep-time-input" type="time" value="${_sleepTime}" />
      <label for="wake-time-input">Wake time:</label>
      <input id="wake-time-input" type="time" value="${_wakeTime}" />
      <button id="sleep-submit">Save</button>
    </div>
    <p class="sleep-duration">Duration: <strong>${durationText}</strong></p>
  `;

  section.querySelector('#sleep-submit').addEventListener('click', () => {
    const sleepInput = section.querySelector('#sleep-time-input').value;
    const wakeInput = section.querySelector('#wake-time-input').value;
    if (!sleepInput || !wakeInput) return;
    _sleepTime = sleepInput;
    _wakeTime = wakeInput;
    _duration = calcSleepDuration(_sleepTime, _wakeTime);
    _persist();
    _render();
  });
}

function _persist() {
  const key = `sleep_${todayKey()}`;
  set(key, { sleepTime: _sleepTime, wakeTime: _wakeTime, duration: _duration });
  emit('sleep:updated', formatDuration(_duration));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  const data = get(`sleep_${todayKey()}`, null);
  if (data) {
    _sleepTime = data.sleepTime ?? '';
    _wakeTime = data.wakeTime ?? '';
    _duration = data.duration ?? 0;
  } else {
    _sleepTime = '';
    _wakeTime = '';
    _duration = 0;
  }
  _render();
}

export function reset() {
  _sleepTime = '';
  _wakeTime = '';
  _duration = 0;
  _persist();
  _render();
}
