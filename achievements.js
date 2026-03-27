import { get, set } from './storage.js';
import { emit, on } from './eventBus.js';
import { weekKeys, todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Check if water goal was met for 7 consecutive days.
 * @param {{ get: (key: string, fallback: any) => any }} store
 * @param {string[]} keys - 7 'YYYY-MM-DD' strings
 * @param {number} goal - daily water goal in ml
 * @returns {boolean}
 */
export function checkHydrationMaster(store, keys, goal) {
  if (keys.length < 7) return false;
  return keys.every(day => {
    const data = store.get(`water_${day}`, { total: 0 });
    return (data.total ?? 0) >= goal;
  });
}

/**
 * Check if 10+ tasks were completed today.
 * @param {Task[]} tasks
 * @param {string} today - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export function checkTaskSlayer(tasks, today) {
  const count = tasks.filter(
    t => t.completed && t.completedAt && t.completedAt.startsWith(today)
  ).length;
  return count >= 10;
}

/**
 * Check if sleep before 22:00 and wake before 06:30 for 3 consecutive days.
 * @param {{ get: (key: string, fallback: any) => any }} store
 * @param {string[]} keys - at least 3 'YYYY-MM-DD' strings
 * @returns {boolean}
 */
export function checkEarlyBird(store, keys) {
  if (keys.length < 3) return false;
  // Check last 3 days
  const last3 = keys.slice(-3);
  return last3.every(day => {
    const data = store.get(`sleep_${day}`, null);
    if (!data) return false;
    const { sleepTime, wakeTime } = data;
    if (!sleepTime || !wakeTime) return false;
    // sleep before 22:00
    const [sh, sm] = sleepTime.split(':').map(Number);
    const sleepMins = sh * 60 + sm;
    if (sleepMins >= 22 * 60) return false;
    // wake before 06:30
    const [wh, wm] = wakeTime.split(':').map(Number);
    const wakeMins = wh * 60 + wm;
    if (wakeMins >= 6 * 60 + 30) return false;
    return true;
  });
}

/**
 * Check if an achievement is already unlocked.
 * @param {AchievementRecord[]} achievements
 * @param {string} id
 * @returns {boolean}
 */
export function isUnlocked(achievements, id) {
  return achievements.some(a => a.id === id);
}

/**
 * Add an achievement to the list (idempotent).
 * @param {AchievementRecord[]} achievements
 * @param {string} id
 * @returns {AchievementRecord[]}
 */
export function unlockAchievement(achievements, id) {
  if (isUnlocked(achievements, id)) return achievements;
  return [...achievements, { id, unlockedAt: new Date().toISOString() }];
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let _achievements = [];

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function _showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Unlock logic
// ---------------------------------------------------------------------------

function _checkAndUnlock() {
  const storeAdapter = { get: (key, fallback) => get(key, fallback) };
  const keys = weekKeys();
  const today = todayKey();
  const waterGoal = get('water_goal', 2000);
  const tasks = get('tasks', []);

  const checks = [
    {
      id: 'hydration_master',
      label: '🏆 Hydration Master unlocked!',
      condition: () => checkHydrationMaster(storeAdapter, keys, waterGoal),
    },
    {
      id: 'task_slayer',
      label: '🏆 Task Slayer unlocked!',
      condition: () => checkTaskSlayer(tasks, today),
    },
    {
      id: 'early_bird',
      label: '🏆 Early Bird unlocked!',
      condition: () => checkEarlyBird(storeAdapter, keys),
    },
  ];

  let changed = false;
  checks.forEach(({ id, label, condition }) => {
    if (!isUnlocked(_achievements, id) && condition()) {
      _achievements = unlockAchievement(_achievements, id);
      _showToast(label);
      emit('achievement:unlocked', id);
      changed = true;
    }
  });

  if (changed) {
    set('achievements', _achievements);
    _render();
  }
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#achievements');
  if (!section) return;

  const list = section.querySelector('.achievements-list');
  if (!list) return;

  list.innerHTML = '';
  _achievements.forEach(a => {
    const li = document.createElement('li');
    li.className = 'achievement-item';
    li.dataset.id = a.id;
    li.textContent = `🏅 ${a.id.replace(/_/g, ' ')} — unlocked ${new Date(a.unlockedAt).toLocaleDateString()}`;
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _achievements = get('achievements', []);

  const section = document.querySelector('#achievements');
  if (section && !section.querySelector('.achievements-list')) {
    const ul = document.createElement('ul');
    ul.className = 'achievements-list';
    section.appendChild(ul);
  }

  _render();

  // Subscribe to tracker events to check achievements
  on('water:updated', _checkAndUnlock);
  on('tasks:updated', _checkAndUnlock);
  on('sleep:updated', _checkAndUnlock);
}
