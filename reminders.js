import { get, set } from './storage.js';
import { emit } from './eventBus.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Add a reminder. Rejects empty activity or time.
 * @param {Reminder[]} reminders
 * @param {string} activity
 * @param {string} time - "HH:MM"
 * @returns {{ reminders: Reminder[], added: boolean }}
 */
export function addReminder(reminders, activity, time) {
  if (!activity || activity.trim() === '') return { reminders, added: false };
  if (!time || time.trim() === '') return { reminders, added: false };

  const reminder = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    activity: activity.trim(),
    time: time.trim(),
  };
  return { reminders: [...reminders, reminder], added: true };
}

/**
 * Delete a reminder by id.
 * @param {Reminder[]} reminders
 * @param {string} id
 * @returns {Reminder[]}
 */
export function deleteReminder(reminders, id) {
  return reminders.filter(r => r.id !== id);
}

/**
 * Find reminders whose time matches the current time string.
 * @param {Reminder[]} reminders
 * @param {string} currentTime - "HH:MM"
 * @returns {Reminder[]}
 */
export function findDueReminders(reminders, currentTime) {
  return reminders.filter(r => r.time === currentTime);
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let _reminders = [];
let _intervalId = null;

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function _showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'reminder-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 5000);
}

// ---------------------------------------------------------------------------
// Reminder check (polling)
// ---------------------------------------------------------------------------

export function checkReminders() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  const due = findDueReminders(_reminders, currentTime);
  due.forEach(r => {
    // Try browser Notification API first
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Nijam Paaku Reminder', { body: r.activity });
    } else {
      _showToast(`⏰ Reminder: ${r.activity}`);
    }
    emit('reminder:triggered', r);
  });
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function _persist() {
  set('reminders', _reminders);
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#reminders');
  if (!section) return;

  const list = section.querySelector('.reminders-list');
  if (!list) return;

  list.innerHTML = '';
  _reminders.forEach(r => {
    const li = document.createElement('li');
    li.className = 'reminder-item';
    li.dataset.id = r.id;

    const info = document.createElement('span');
    info.textContent = `${r.time} – ${r.activity}`;
    li.appendChild(info);

    const delBtn = document.createElement('button');
    delBtn.className = 'reminder-delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      _reminders = deleteReminder(_reminders, r.id);
      _persist();
      _render();
    });
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Form handler
// ---------------------------------------------------------------------------

function _handleAdd(e) {
  e.preventDefault();
  const section = document.querySelector('#reminders');
  if (!section) return;

  const activityInput = section.querySelector('.reminder-activity-input');
  const timeInput = section.querySelector('.reminder-time-input');
  const errorEl = section.querySelector('.reminder-error');

  const activity = activityInput ? activityInput.value : '';
  const time = timeInput ? timeInput.value : '';

  const { reminders: updated, added } = addReminder(_reminders, activity, time);

  if (!added) {
    if (errorEl) errorEl.textContent = 'Activity and time are required.';
    return;
  }

  if (errorEl) errorEl.textContent = '';
  if (activityInput) activityInput.value = '';
  if (timeInput) timeInput.value = '';

  _reminders = updated;
  _persist();
  _render();

  // Request notification permission on first save
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _reminders = get('reminders', []);

  const section = document.querySelector('#reminders');
  if (section) {
    // Ensure required DOM structure
    if (!section.querySelector('.reminder-form')) {
      const form = document.createElement('form');
      form.className = 'reminder-form';

      const activityLabel = document.createElement('label');
      activityLabel.textContent = 'Activity:';
      const activityInput = document.createElement('input');
      activityInput.type = 'text';
      activityInput.className = 'reminder-activity-input';
      activityInput.placeholder = 'e.g. Drink water';

      const timeLabel = document.createElement('label');
      timeLabel.textContent = 'Time:';
      const timeInput = document.createElement('input');
      timeInput.type = 'time';
      timeInput.className = 'reminder-time-input';

      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = 'Add Reminder';

      const errorEl = document.createElement('p');
      errorEl.className = 'reminder-error';

      form.appendChild(activityLabel);
      form.appendChild(activityInput);
      form.appendChild(timeLabel);
      form.appendChild(timeInput);
      form.appendChild(submitBtn);
      form.appendChild(errorEl);
      section.appendChild(form);
    }

    if (!section.querySelector('.reminders-list')) {
      const ul = document.createElement('ul');
      ul.className = 'reminders-list';
      section.appendChild(ul);
    }

    const form = section.querySelector('.reminder-form');
    if (form) form.addEventListener('submit', _handleAdd);

    // Clear error on input
    const activityInput = section.querySelector('.reminder-activity-input');
    const errorEl = section.querySelector('.reminder-error');
    if (activityInput && errorEl) {
      activityInput.addEventListener('input', () => { errorEl.textContent = ''; });
    }
  }

  _render();

  // Start polling every 60 seconds
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = setInterval(checkReminders, 60000);
}
