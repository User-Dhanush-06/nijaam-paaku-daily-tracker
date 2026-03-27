/**
 * Format a Date object as 'YYYY-MM-DD' using local time.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return today's date key in 'YYYY-MM-DD' format (local time).
 * @returns {string}
 */
export function todayKey() {
  return formatDate(new Date());
}

/**
 * Return an array of the last 7 date keys (oldest first, today last).
 * @returns {string[]}
 */
export function weekKeys() {
  const keys = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(formatDate(d));
  }
  return keys;
}

/**
 * Calculate the number of minutes between two HH:MM time strings.
 * Handles overnight spans: if wakeTime <= sleepTime, adds 1440 minutes.
 *
 * @param {string} sleepTime  - "HH:MM"
 * @param {string} wakeTime   - "HH:MM"
 * @returns {number} duration in minutes (always positive)
 */
export function minutesBetween(sleepTime, wakeTime) {
  const [sh, sm] = sleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const sleepMinutes = sh * 60 + sm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 1440; // next day
  }
  return wakeMinutes - sleepMinutes;
}
