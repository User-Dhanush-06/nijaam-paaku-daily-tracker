import { get } from './storage.js';
import { on } from './eventBus.js';
import { todayKey } from './dateUtils.js';

const METRICS = [
  {
    metric: 'tasks',
    icon: '✅',
    label: 'Tasks Completed',
    getValue: () => {
      const tasks = get('tasks', []);
      const today = todayKey();
      return tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    },
  },
  {
    metric: 'water',
    icon: '💧',
    label: 'Water Intake (ml)',
    getValue: () => {
      const data = get(`water_${todayKey()}`, { total: 0 });
      return data.total ?? 0;
    },
  },
  {
    metric: 'calories',
    icon: '🍽️',
    label: 'Calories Consumed',
    getValue: () => {
      const meals = get(`calories_${todayKey()}`, []);
      return meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    },
  },
  {
    metric: 'sleep',
    icon: '😴',
    label: 'Sleep Duration',
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
    label: 'Screen Time (hrs)',
    getValue: () => {
      const data = get(`screentime_${todayKey()}`, null);
      return data ? data.hours : '—';
    },
  },
  {
    metric: 'mood',
    icon: '😊',
    label: 'Mood',
    getValue: () => {
      return get(`mood_${todayKey()}`, '—');
    },
  },
];

export function init() {
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
}

export function refresh(metric, value) {
  const card = document.querySelector(`[data-metric="${metric}"]`);
  if (!card) return;
  const valueEl = card.querySelector('.metric-value');
  if (valueEl) valueEl.textContent = value;
}

// Subscribe to tracker events
on('tasks:updated', (value) => refresh('tasks', value));
on('water:updated', (value) => refresh('water', value));
on('calories:updated', (value) => refresh('calories', value));
on('sleep:updated', (value) => refresh('sleep', value));
on('screentime:updated', (value) => refresh('screentime', value));
on('mood:updated', (value) => refresh('mood', value));
