# Nijam Paaku – Daily Life Tracker

> **"Nijam Paaku"** means *"Know the Truth"* in Tamil — a reminder to stay honest with yourself about your daily habits.

A zero-dependency, single-page web app that helps you track every dimension of your day — all in the browser, with no backend, no account, and no data leaving your device.

---

## What it does

Nijam Paaku brings 13 life-tracking modules into one clean dashboard:

| Module | What it tracks |
|---|---|
| 📋 **Tasks** | Daily to-do list with pending / completed separation |
| 💧 **Water Intake** | ml logged per day with a goal progress bar |
| 🍽️ **Calories** | Meal log with daily calorie total and goal |
| 😴 **Sleep** | Sleep & wake times with automatic duration calculation |
| 📱 **Screen Time** | Daily phone usage in hours |
| 😊 **Mood** | One-tap mood selection (Happy, Neutral, Sad, Tired, Energetic) |
| ✅ **Habits** | 5 default habits with consecutive-day streak tracking |
| 📅 **Activity Timeline** | Chronological log of your day's events |
| 📓 **Daily Journal** | Free-text notes saved per calendar date |
| 📊 **Weekly Analytics** | 7-day bar charts for tasks, water, and sleep |
| 🏆 **Achievements** | Badges for consistent healthy behaviour |
| 🔔 **Reminders** | Time-based browser notifications for any activity |
| 🌙 **Dark Mode** | Persistent light / dark theme toggle |

---

## Getting started

No build step required. Just open `index.html` in any modern browser.

```bash
# Clone the repo
git clone https://github.com/User-Dhanush-06/nijaam-paaku-daily-tracker.git
cd nijaam-paaku-daily-tracker

# Open in browser (macOS)
open "Nijam Paaku/index.html"

# Open in browser (Windows)
start "Nijam Paaku/index.html"
```

That's it. No `npm install` needed to run the app.

---

## Running the tests

The test suite uses [Vitest](https://vitest.dev/) and [fast-check](https://github.com/dubzzz/fast-check) for property-based testing.

```bash
cd "Nijam Paaku"
npm install
npm test
```

---

## Architecture

```
index.html          ← single HTML shell
styles.css          ← CSS custom properties, responsive grid, dark theme
app.js              ← entry point — imports and inits all modules
storage.js          ← localStorage wrapper (np_ prefix, error-safe)
eventBus.js         ← tiny pub/sub for cross-module communication
dateUtils.js        ← todayKey, weekKeys, minutesBetween
dashboard.js        ← aggregates all metric summary cards
theme.js            ← dark/light mode persistence
tasks.js            ← task management
water.js            ← water intake tracker
calories.js         ← calorie tracker
sleep.js            ← sleep duration calculator
screenTime.js       ← screen time logger
mood.js             ← mood selector
habits.js           ← habit streak tracker
timeline.js         ← activity timeline
journal.js          ← daily journal
analytics.js        ← weekly bar charts (pure CSS/HTML, no libraries)
achievements.js     ← gamification badges
reminders.js        ← time-based notification reminders
```

**Key design decisions:**
- Zero external runtime dependencies — no frameworks, no charting libraries
- All data stored in `localStorage` under `np_` prefixed keys
- Modules communicate via a lightweight event bus (`eventBus.js`)
- Graceful degradation when `localStorage` is unavailable

---

## Data & privacy

All your data lives exclusively in your browser's `localStorage`. Nothing is sent to any server. Clearing your browser data will clear the app data.

---

## License

MIT
