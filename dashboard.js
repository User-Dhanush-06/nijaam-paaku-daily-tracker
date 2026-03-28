import { get } from './storage.js';
import { on } from './eventBus.js';
import { todayKey } from './dateUtils.js';

const METRICS = [
  {
    metric: 'tasks',
    icon: '✅',
    label: 'Tasks Done',
    getValue: () => {
      const tasks = get('tasks', []);
      const today = todayKey();
      return tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    },
  },
  {
    metric: 'water',
    icon: '💧',
    label: 'Water (ml)',
    getValue: () => {
      const data = get(`water_${todayKey()}`, { total: 0 });
      return data.total ?? 0;
    },
  },
  {
    metric: 'calories',
    icon: '🍽️',
    label: 'Calories',
    getValue: () => {
      const meals = get(`calories_${todayKey()}`, []);
      return meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    },
  },
  {
    metric: 'sleep',
    icon: '😴',
    label: 'Sleep',
    getValue: () => {
      const data = get(`sleep_${todayKey()}`, null);
      if (!data) return '—';
      const h = Math.floor(data.duration / 60);
      const m = data.duration % 60;
      return `${h}h ${m}m`;
    },
  },
  {
    metric: 'screentime',
    icon: '📱',
    label: 'Screen (hrs)',
    getValue: () => {
      const data = get(`screentime_${todayKey()}`, null);
      return data ? `${data.hours}h` : '—';
    },
  },
  {
    metric: 'mood',
    icon: '😊',
    label: 'Mood',
    getValue: () => get(`mood_${todayKey()}`, '—'),
  },
];

// ── Day Score calculation (0–100) ──────────────────────────────────
function _calcDayScore() {
  let score = 0;

  // Water: up to 25 pts — % of goal hit, capped at 100%
  const waterGoal = get('water_goal', 2000);
  const waterData = get(`water_${todayKey()}`, { total: 0 });
  const waterPct = Math.min((waterData.total ?? 0) / waterGoal, 1);
  score += Math.round(waterPct * 25);

  // Tasks: up to 25 pts — 5 pts per task, max 5 tasks
  const tasks = get('tasks', []);
  const today = todayKey();
  const tasksDone = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
  score += Math.min(tasksDone, 5) * 5;

  // Habits: up to 25 pts — % of habits done today
  const habits = get('habits', []);
  if (habits.length > 0) {
    const doneCount = habits.filter(h => h.completions && h.completions.includes(today)).length;
    score += Math.round((doneCount / habits.length) * 25);
  }

  // Sleep: up to 25 pts — 7-9h = full, 6-7h or 9-10h = half
  const sleepData = get(`sleep_${today}`, null);
  if (sleepData && sleepData.duration) {
    const hrs = sleepData.duration / 60;
    if (hrs >= 7 && hrs <= 9) score += 25;
    else if (hrs >= 6 && hrs < 7) score += 13;
    else if (hrs > 9 && hrs <= 10) score += 13;
  }

  return Math.min(score, 100);
}

function _getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function _renderGreeting() {
  const el = document.getElementById('dashboard-greeting');
  if (!el) return;

  const name = get('user_name', '');
  const greeting = `${_getGreeting()}${name ? `, ${name}` : ''} 👋`;
  const score = _calcDayScore();
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  // SVG ring circumference = 2π × r = 2π × 32 ≈ 201
  const circ = 201;
  const offset = circ - (circ * score / 100);
  const scoreColor = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f472b6';
  const scoreMsg = score >= 80 ? 'Outstanding day! Keep it up.' :
                   score >= 60 ? 'Great progress — keep going!' :
                   score >= 40 ? 'Good start — a few more wins today!' :
                   'Every small step counts. You got this!';

  el.innerHTML = `
    <div class="dash-greeting-text">${greeting}</div>
    <div class="dash-date-text">${today}</div>
    <div class="dash-score-row">
      <svg class="dash-score-ring" width="72" height="72" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
        <circle cx="40" cy="40" r="32" fill="none"
          stroke="${scoreColor}" stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${offset}"
          transform="rotate(-90 40 40)"
          style="transition: stroke-dashoffset 0.8s cubic-bezier(.22,.8,.3,1)"/>
        <text x="40" y="45" text-anchor="middle" font-size="15" font-weight="800"
          fill="${scoreColor}" font-family="Syne,sans-serif">${score}</text>
      </svg>
      <div class="dash-score-info">
        <div class="dash-score-num">${score}<span style="font-size:14px;opacity:.4">/100</span></div>
        <div class="dash-score-lbl">Day Score</div>
        <div class="dash-score-msg">${scoreMsg}</div>
      </div>
    </div>
  `;
}

export function init() {
  _renderGreeting();

  const container = document.getElementById('dashboard');
  if (!container) return;
  container.innerHTML = '';

  for (const { metric, icon, label, getValue } of METRICS) {
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.setAttribute('data-metric', metric);

    const iconEl = document.createElement('span');
    iconEl.className = 'metric-icon';
    iconEl.textContent = icon;

    const labelEl = document.createElement('span');
    labelEl.className = 'metric-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'metric-value';
    valueEl.textContent = getValue();

    card.appendChild(iconEl);
    card.appendChild(labelEl);
    card.appendChild(valueEl);
    container.appendChild(card);
  }

  // Refresh greeting score on any tracker update
  on('water:updated',    () => _renderGreeting());
  on('tasks:updated',    () => _renderGreeting());
  on('habits:updated',   () => _renderGreeting());
  on('sleep:updated',    () => _renderGreeting());
}

export function refresh(metric, value) {
  const card = document.querySelector(`[data-metric="${metric}"]`);
  if (!card) return;
  const valueEl = card.querySelector('.metric-value');
  if (valueEl) valueEl.textContent = value;
  _renderGreeting(); // recalculate score too
}

on('tasks:updated',     (value) => refresh('tasks', value));
on('water:updated',     (value) => refresh('water', value));
on('calories:updated',  (value) => refresh('calories', value));
on('sleep:updated',     (value) => refresh('sleep', value));
on('screentime:updated',(value) => refresh('screentime', value));
on('mood:updated',      (value) => refresh('mood', value));
