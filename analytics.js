import { get } from './storage.js';
import { weekKeys } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Extract weekly data for tasks, water, and sleep from a store-like object.
 * @param {{ get: (key: string, fallback: any) => any }} store
 * @param {string[]} keys - array of 7 'YYYY-MM-DD' strings
 * @returns {{ tasks: number[], water: number[], sleep: number[] }}
 */
export function extractWeeklyData(store, keys) {
  const tasks = keys.map(day => {
    const stored = store.get('tasks', []);
    // Count tasks completed on this specific day
    return stored.filter(
      t => t.completed && t.completedAt && t.completedAt.startsWith(day)
    ).length;
  });

  const water = keys.map(day => {
    const data = store.get(`water_${day}`, { total: 0 });
    return data.total ?? 0;
  });

  const sleep = keys.map(day => {
    const data = store.get(`sleep_${day}`, null);
    if (!data) return 0;
    return Math.round((data.duration ?? 0) / 60 * 10) / 10; // hours, 1 decimal
  });

  return { tasks, water, sleep };
}

/**
 * Calculate bar height as a percentage (0–100).
 * @param {number} value
 * @param {number} maxValue
 * @returns {number}
 */
export function calcBarHeight(value, maxValue) {
  if (!maxValue || maxValue <= 0) return 0;
  return Math.min((value / maxValue) * 100, 100);
}

// ---------------------------------------------------------------------------
// DOM rendering helpers
// ---------------------------------------------------------------------------

function _buildChart(container, values, label) {
  container.innerHTML = '';
  const title = document.createElement('p');
  title.className = 'chart-title';
  title.textContent = label;
  container.appendChild(title);

  const bars = document.createElement('div');
  bars.className = 'chart-bars';

  const maxVal = Math.max(...values, 1);

  values.forEach((val, i) => {
    const col = document.createElement('div');
    col.className = 'chart-col';

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${calcBarHeight(val, maxVal)}%`;
    bar.title = `Day ${i + 1}: ${val}`;

    const valLabel = document.createElement('span');
    valLabel.className = 'chart-val';
    valLabel.textContent = val;

    col.appendChild(bar);
    col.appendChild(valLabel);
    bars.appendChild(col);
  });

  container.appendChild(bars);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function renderCharts() {
  const section = document.querySelector('#analytics');
  if (!section) return;

  const keys = weekKeys();

  // Build a store adapter using the real storage module
  const storeAdapter = {
    get: (key, fallback) => get(key, fallback),
  };

  const { tasks, water, sleep } = extractWeeklyData(storeAdapter, keys);

  const taskContainer = section.querySelector('.chart-tasks');
  const waterContainer = section.querySelector('.chart-water');
  const sleepContainer = section.querySelector('.chart-sleep');

  if (taskContainer) _buildChart(taskContainer, tasks, 'Tasks Completed');
  if (waterContainer) _buildChart(waterContainer, water, 'Water Intake (ml)');
  if (sleepContainer) _buildChart(sleepContainer, sleep, 'Sleep (hours)');

  // Habit streaks
  const streakContainer = section.querySelector('.analytics-streaks');
  if (streakContainer) {
    const habits = get('habits', []);
    streakContainer.innerHTML = '<strong>Habit Streaks</strong>';
    habits.forEach(h => {
      const p = document.createElement('p');
      p.textContent = `${h.name}: 🔥 ${h.streak} day streak`;
      streakContainer.appendChild(p);
    });
  }
}

export function init() {
  const section = document.querySelector('#analytics');
  if (!section) return;

  // Ensure chart containers exist
  if (!section.querySelector('.chart-tasks')) {
    const div = document.createElement('div');
    div.className = 'chart-tasks';
    section.appendChild(div);
  }
  if (!section.querySelector('.chart-water')) {
    const div = document.createElement('div');
    div.className = 'chart-water';
    section.appendChild(div);
  }
  if (!section.querySelector('.chart-sleep')) {
    const div = document.createElement('div');
    div.className = 'chart-sleep';
    section.appendChild(div);
  }
  if (!section.querySelector('.analytics-streaks')) {
    const div = document.createElement('div');
    div.className = 'analytics-streaks';
    section.appendChild(div);
  }

  renderCharts();
}
