import { init as initTheme } from './theme.js';
import { init as initDashboard } from './dashboard.js';
import { init as initTasks } from './tasks.js';
import { init as initWater } from './water.js';
import { init as initCalories } from './calories.js';
import { init as initSleep } from './sleep.js';
import { init as initScreenTime } from './screenTime.js';
import { init as initMood } from './mood.js';
import { init as initHabits } from './habits.js';
import { init as initTimeline } from './timeline.js';
import { init as initJournal } from './journal.js';
import { init as initAnalytics } from './analytics.js';
import { init as initAchievements } from './achievements.js';
import { init as initReminders } from './reminders.js';
import { on } from './eventBus.js';
import { isAvailable } from './storage.js';

// Show storage warning banner if localStorage is unavailable
if (!isAvailable()) {
  const banner = document.getElementById('storage-warning');
  if (banner) banner.classList.remove('hidden');
}

// Subscribe to storage errors to show the banner
on('storage:error', () => {
  const banner = document.getElementById('storage-warning');
  if (banner) banner.classList.remove('hidden');
});

// Initialise all modules
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
