import { init as initTheme }        from './theme.js';
import { init as initDashboard }    from './dashboard.js';
import { init as initTasks }        from './tasks.js';
import { init as initWater }        from './water.js';
import { init as initCalories }     from './calories.js';
import { init as initSleep }        from './sleep.js';
import { init as initScreenTime }   from './screenTime.js';
import { init as initMood }         from './mood.js';
import { init as initHabits }       from './habits.js';
import { init as initTimeline }     from './timeline.js';
import { init as initJournal }      from './journal.js';
import { init as initAnalytics }    from './analytics.js';
import { init as initAchievements } from './achievements.js';
import { init as initReminders }    from './reminders.js';
import { on }                       from './eventBus.js';
import { isAvailable, clearAll, showToast, get, set } from './storage.js';
import { exportData }               from './export.js';

// ── Storage warning banner ─────────────────────────────────────────
if (!isAvailable()) {
  const banner = document.getElementById('storage-warning');
  if (banner) banner.classList.remove('hidden');
}
on('storage:error', () => {
  const banner = document.getElementById('storage-warning');
  if (banner) banner.classList.remove('hidden');
});

// ── Onboarding ────────────────────────────────────────────────────
const onboardingDone = get('onboarding_done', false);
if (!onboardingDone) {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.classList.remove('hidden');

  const btn  = document.getElementById('onboarding-btn');
  const input = document.getElementById('onboarding-name');
  if (btn && input) {
    btn.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) set('user_name', name);
      set('onboarding_done', true);
      overlay.classList.add('hidden');
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  }
}

// ── Export buttons (desktop + mobile) ────────────────────────────
['export-btn', 'export-btn-mobile'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', exportData);
});

// ── Clear all data buttons ────────────────────────────────────────
['clear-data-btn', 'clear-data-btn-mobile'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', () => {
    if (confirm('⚠️ This will permanently delete ALL your tracker data. Are you sure?')) {
      clearAll();
      showToast('🗑️ All data cleared — reloading…', 'info');
      setTimeout(() => location.reload(), 1200);
    }
  });
});

// ── Init all modules ──────────────────────────────────────────────
initTheme();
initDashboard();
initTasks();
initWater();
initCalories();
initSleep();
initScreenTime();
initMood();
initHabits();
initTimeline();
initJournal();
initAnalytics();
initAchievements();
initReminders();
