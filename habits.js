import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

// ---------------------------------------------------------------------------
// Constants (exported for testing)
// ---------------------------------------------------------------------------

export const DEFAULT_HABITS = ['Exercise', 'Reading', 'Meditation', 'Study', 'Journaling'];

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Calculate streak from completion dates.
 * Streak = consecutive days ending on today or yesterday.
 */
export function calcStreak(completions, today) {
  if (!completions || completions.length === 0) return 0;
  const unique = [...new Set(completions)].sort().reverse();
  const relevant = unique.filter(d => d <= today);
  if (relevant.length === 0) return 0;
  const todayMs = new Date(today).getTime();
  const mostRecentMs = new Date(relevant[0]).getTime();
  const diffDays = Math.round((todayMs - mostRecentMs) / 86400000);
  if (diffDays > 1) return 0;
  let streak = 1;
  for (let i = 1; i < relevant.length; i++) {
    const prev = new Date(relevant[i - 1]).getTime();
    const curr = new Date(relevant[i]).getTime();
    if (Math.round((prev - curr) / 86400000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Toggle today's completion for a habit.
 */
export function toggleHabitCompletion(habit, today) {
  const completions = habit.completions || [];
  const updated = completions.includes(today)
    ? completions.filter(d => d !== today)
    : [...completions, today];
  return { ...habit, completions: updated, streak: calcStreak(updated, today), lastChecked: today };
}

/**
 * Get the last 7 days as YYYY-MM-DD strings, oldest first.
 */
function _lastSevenDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Short day label: Mon, Tue, etc.
 */
function _dayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _habits = [];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function _persist() {
  set('habits', _habits);
  emit('habits:updated', _habits);
}

// ---------------------------------------------------------------------------
// DOM rendering
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#habits');
  if (!section) return;

  const today = todayKey();
  const week = _lastSevenDays();

  section.innerHTML = `
    <h2>✅ Habit Tracker</h2>

    <div class="habits-week-header">
      <span class="habits-col-name"></span>
      ${week.map(d => `
        <span class="habits-col-day${d === today ? ' habits-col-today' : ''}">
          ${_dayLabel(d)}
        </span>
      `).join('')}
      <span class="habits-col-streak">Streak</span>
      <span class="habits-col-action"></span>
    </div>

    <ul class="habits-list">
      ${_habits.map(habit => {
        const doneToday = habit.completions.includes(today);
        return `
          <li class="habit-item${doneToday ? ' habit-done' : ''}" data-id="${habit.id}">
            <span class="habit-name">${habit.name}</span>

            ${week.map(d => {
              const done = habit.completions.includes(d);
              const isToday = d === today;
              return `<span class="habit-dot${done ? ' habit-dot-done' : ''}${isToday ? ' habit-dot-today' : ''}"
                ${isToday ? `data-toggle="${habit.id}" title="Click to toggle today"` : `title="${d}"`}>
                ${done ? '●' : '○'}
              </span>`;
            }).join('')}

            <span class="habit-streak-badge">
              🔥 ${habit.streak}
            </span>

            <button class="habit-toggle-btn${doneToday ? ' done' : ''}" data-id="${habit.id}">
              ${doneToday ? 'Undo' : 'Done'}
            </button>
          </li>
        `;
      }).join('')}
    </ul>

    <div class="habits-footer">
      <p class="habits-hint">💡 Streaks grow automatically when you mark Done each day.</p>
      <button id="habits-reset-all" class="btn-danger-sm">Reset all streaks</button>
    </div>
  `;

  // Done/Undo toggle buttons
  section.querySelectorAll('.habit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      _habits = _habits.map(h => h.id === id ? toggleHabitCompletion(h, today) : h);
      _persist();
      _render();
    });
  });

  // Click on today's dot also toggles
  section.querySelectorAll('[data-toggle]').forEach(dot => {
    dot.addEventListener('click', () => {
      const id = dot.dataset.toggle;
      _habits = _habits.map(h => h.id === id ? toggleHabitCompletion(h, today) : h);
      _persist();
      _render();
    });
  });

  // Reset all streaks
  section.querySelector('#habits-reset-all').addEventListener('click', () => {
    if (confirm('Reset all habit completions and streaks? This cannot be undone.')) {
      _habits = _habits.map(h => ({ ...h, completions: [], streak: 0 }));
      _persist();
      _render();
    }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  const stored = get('habits', null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    _habits = stored;
  } else {
    _habits = DEFAULT_HABITS.map((name, i) => ({
      id: String(i + 1),
      name,
      completions: [],
      streak: 0,
      lastChecked: todayKey(),
    }));
    _persist();
  }
  _render();
}

export function reset() {
  const today = todayKey();
  _habits = _habits.map(h => ({ ...h, streak: calcStreak(h.completions, today), lastChecked: today }));
  _persist();
  _render();
}
