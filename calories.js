import { get, set } from './storage.js';
import { emit } from './eventBus.js';
import { todayKey } from './dateUtils.js';

const DEFAULT_GOAL = 2000;

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Add a meal to the meal log.
 * Rejects entries with empty name or calories <= 0.
 *
 * @param {Array}  meals    - current meal log
 * @param {string} name     - food item name
 * @param {number} calories - calorie amount
 * @returns {{ meals: Array, added: boolean }}
 */
export function addMeal(meals, name, calories) {
  if (!name || name.trim() === '' || calories <= 0) {
    return { meals, added: false };
  }
  const entry = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    name: name.trim(),
    calories: Number(calories),
  };
  return { meals: [...meals, entry], added: true };
}

/**
 * Sum all meal calories.
 * @param {Array} meals
 * @returns {number}
 */
export function calcCaloriesTotal(meals) {
  return meals.reduce((sum, m) => sum + m.calories, 0);
}

/**
 * Calculate progress bar percentage (0–100, capped).
 * @param {number} total
 * @param {number} goal
 * @returns {number}
 */
export function calcProgress(total, goal) {
  return Math.min((total / goal) * 100, 100);
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _meals = [];
let _goal = DEFAULT_GOAL;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function _render() {
  const section = document.querySelector('#calories');
  if (!section) return;

  const total = calcCaloriesTotal(_meals);
  const pct = calcProgress(total, _goal);

  section.innerHTML = `
    <h2>🍽️ Calorie Tracker</h2>

    <div class="calories-form">
      <input id="calories-name" type="text" placeholder="Food name" />
      <input id="calories-amount" type="number" min="1" placeholder="Calories" />
      <button id="calories-add">Add meal</button>
      <p class="calories-error" style="display:none; color:red;"></p>
    </div>

    <ul class="calories-log">
      ${_meals.map(m => `
        <li data-id="${m.id}">
          ${m.name} – ${m.calories} kcal
          <button class="calories-delete" data-id="${m.id}">✕</button>
        </li>
      `).join('')}
    </ul>

    <p class="calories-total">Total: <strong>${total} kcal</strong></p>

    <div class="progress-bar-container" aria-label="Calorie intake progress">
      <div class="progress-bar-fill" style="width: ${pct}%"></div>
    </div>

    <div class="calories-goal-form">
      <label for="calories-goal-input">Daily goal (kcal):</label>
      <input id="calories-goal-input" type="number" min="1" value="${_goal}" />
      <button id="calories-goal-save">Save goal</button>
    </div>
  `;

  // Add meal
  section.querySelector('#calories-add').addEventListener('click', () => {
    const nameEl = section.querySelector('#calories-name');
    const amountEl = section.querySelector('#calories-amount');
    const errorEl = section.querySelector('.calories-error');
    const name = nameEl.value;
    const calories = Number(amountEl.value);

    const { meals: updated, added } = addMeal(_meals, name, calories);
    if (!added) {
      errorEl.textContent = 'Please enter a valid food name and a positive calorie amount.';
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';
    _meals = updated;
    nameEl.value = '';
    amountEl.value = '';
    _persist();
    _render();
  });

  // Clear error on input
  section.querySelector('#calories-name').addEventListener('input', () => {
    section.querySelector('.calories-error').style.display = 'none';
  });
  section.querySelector('#calories-amount').addEventListener('input', () => {
    section.querySelector('.calories-error').style.display = 'none';
  });

  // Delete meal buttons
  section.querySelectorAll('.calories-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      _meals = _meals.filter(m => m.id !== id);
      _persist();
      _render();
    });
  });

  // Goal save
  section.querySelector('#calories-goal-save').addEventListener('click', () => {
    const val = Number(section.querySelector('#calories-goal-input').value);
    if (val > 0) {
      _goal = val;
      set('calories_goal', _goal);
      _render();
    }
  });
}

function _persist() {
  const key = `calories_${todayKey()}`;
  set(key, _meals);
  emit('calories:updated', calcCaloriesTotal(_meals));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init() {
  _goal = get('calories_goal', DEFAULT_GOAL);
  _meals = get(`calories_${todayKey()}`, []);
  _render();
}

export function reset() {
  _meals = [];
  _persist();
  _render();
}
