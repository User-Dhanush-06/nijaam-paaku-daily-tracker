import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

const DEFAULT_GOAL = 2000;

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

export function addWater(total, amount) {
  return total + amount;
}

export function calcProgress(total, goal) {
  return Math.min((total / goal) * 100, 100);
}

export function isGoalMet(total, goal) {
  return total >= goal;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _total = 0;
let _goal = DEFAULT_GOAL;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#water');
  if (!section) return;

  const pct = calcProgress(_total, _goal);
  const met = isGoalMet(_total, _goal);
  const pctDisplay = Math.round(pct);

  section.innerHTML = `
    <h2>💧 Water Intake</h2>

    <div class="water-stats-row">
      <div class="water-stat-block">
        <span class="water-stat-value">${_total}</span>
        <span class="water-stat-label">ml today</span>
      </div>
      <div class="water-stat-block">
        <span class="water-stat-value">${_goal}</span>
        <span class="water-stat-label">ml goal</span>
      </div>
      <div class="water-stat-block">
        <span class="water-stat-value water-pct${met ? ' met' : ''}">${pctDisplay}%</span>
        <span class="water-stat-label">progress</span>
      </div>
    </div>

    <div class="progress-bar-container" aria-label="Water intake progress" aria-valuenow="${pctDisplay}" aria-valuemax="100">
      <div class="progress-bar-fill water-progress-fill" style="width: ${pct}%"></div>
    </div>

    ${met ? '<p class="water-goal-completion">🎉 Daily goal reached!</p>' : ''}

    <div class="water-quick-add">
      <button data-amount="250">+250 ml</button>
      <button data-amount="500">+500 ml</button>
      <button data-amount="1000">+1000 ml</button>
    </div>

    <div class="water-actions-row">
      <button id="water-reset-today" class="btn-secondary-sm">🔄 Reset today</button>
    </div>

    <details class="water-goal-details">
      <summary class="water-goal-summary">⚙️ Change daily goal</summary>
      <div class="water-goal-form">
        <label for="water-goal-input">Daily goal (ml):</label>
        <div class="water-goal-input-row">
          <input id="water-goal-input" type="number" min="1" value="${_goal}" />
          <button id="water-goal-save">Save</button>
          <button id="water-goal-reset" class="btn-danger-sm">Reset goal</button>
        </div>
      </div>
    </details>
  `;

  // Quick-add buttons
  section.querySelectorAll('.water-quick-add button').forEach(btn => {
    btn.addEventListener('click', () => {
      _total = addWater(_total, Number(btn.dataset.amount));
      _persist();
      _render();
    });
  });

  // Reset today's count
  section.querySelector('#water-reset-today').addEventListener('click', () => {
    if (confirm('Reset today\'s water count to 0?')) {
      _total = 0;
      _persist();
      _render();
    }
  });

  // Save goal
  section.querySelector('#water-goal-save').addEventListener('click', () => {
    const val = Number(section.querySelector('#water-goal-input').value);
    if (val > 0) {
      _goal = val;
      set('water_goal', _goal);
      _render();
    }
  });

  // Reset goal to default
  section.querySelector('#water-goal-reset').addEventListener('click', () => {
    if (confirm(`Reset goal back to ${DEFAULT_GOAL} ml?`)) {
      _goal = DEFAULT_GOAL;
      set('water_goal', _goal);
      _render();
    }
  });
}

function _persist() {
  set(`water_${todayKey()}`, { total: _total });
  emit('water:updated', _total);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _goal = get('water_goal', DEFAULT_GOAL);
  const data = get(`water_${todayKey()}`, { total: 0 });
  _total = data.total ?? 0;
  _render();
}

export function reset() {
  _total = 0;
  _persist();
  _render();
}
