import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Add an event to the list in chronological order.
 * Rejects empty time or empty description.
 *
 * @param {TimelineEvent[]} events
 * @param {string} time - 'HH:MM'
 * @param {string} description
 * @returns {{ events: TimelineEvent[], added: boolean }}
 */
export function addEvent(events, time, description) {
  if (!time || time.trim() === '' || !description || description.trim() === '') {
    return { events, added: false };
  }
  const newEvent = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    time: time.trim(),
    description: description.trim(),
  };
  const updated = [...events, newEvent].sort((a, b) =>
    a.time < b.time ? -1 : a.time > b.time ? 1 : 0
  );
  return { events: updated, added: true };
}

/**
 * Delete an event by id.
 *
 * @param {TimelineEvent[]} events
 * @param {string} id
 * @returns {TimelineEvent[]}
 */
export function deleteEvent(events, id) {
  return events.filter(e => e.id !== id);
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _events = [];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function _storageKey() {
  return `timeline_${todayKey()}`;
}

function _persist() {
  set(_storageKey(), _events);
  emit('timeline:updated', _events);
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#timeline');
  if (!section) return;

  section.innerHTML = `
    <h2>📅 Activity Timeline</h2>
    <form class="timeline-form">
      <input type="time" class="timeline-time" required />
      <input type="text" class="timeline-desc" placeholder="Description" />
      <button type="submit">Add Event</button>
      <span class="timeline-error" style="color:red"></span>
    </form>
    <ul class="timeline-list">
      ${_events.map(ev => `
        <li class="timeline-item" data-id="${ev.id}">
          <span class="timeline-time-label">${ev.time}</span>
          <span class="timeline-description">${ev.description}</span>
          <button class="timeline-delete-btn" data-id="${ev.id}">Delete</button>
        </li>
      `).join('')}
    </ul>
  `;

  const form = section.querySelector('.timeline-form');
  const errorEl = section.querySelector('.timeline-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const timeInput = section.querySelector('.timeline-time');
    const descInput = section.querySelector('.timeline-desc');
    const time = timeInput ? timeInput.value : '';
    const description = descInput ? descInput.value : '';

    const { events: updated, added } = addEvent(_events, time, description);
    if (!added) {
      if (errorEl) errorEl.textContent = 'Time and description are required.';
      return;
    }
    if (errorEl) errorEl.textContent = '';
    if (timeInput) timeInput.value = '';
    if (descInput) descInput.value = '';
    _events = updated;
    _persist();
    _render();
  });

  section.querySelectorAll('.timeline-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _events = deleteEvent(_events, btn.dataset.id);
      _persist();
      _render();
    });
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _events = get(_storageKey(), []);
  _render();
}

export function reset() {
  _events = [];
  _persist();
  _render();
}
