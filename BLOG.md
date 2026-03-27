# Nijam Paaku: The Daily Tracker That Lives in Your Browser

*A personal productivity and health dashboard — no account, no server, no nonsense.*

---

## The problem with most habit trackers

Most habit-tracking apps ask you to sign up, sync to the cloud, and pay a subscription before you've even logged your first glass of water. They're bloated, they're slow, and they quietly harvest your daily routine data to sell you things.

There's a simpler way.

**Nijam Paaku** ("Know the Truth" in Tamil) is a single HTML file that runs entirely in your browser. No login. No server. No data leaving your device. Just you and your day.

---

## What you can track

### Your tasks
Start the day by dumping everything you need to do into the task list. As you work through them, mark them complete — they move to a separate "done" pile so you can see your progress at a glance. At the end of the day, the dashboard shows you exactly how many you knocked out.

### Water intake
Staying hydrated is one of the simplest things you can do for your health, and one of the easiest to forget. Nijam Paaku gives you three quick-add buttons — 250 ml, 500 ml, 1000 ml — so logging a glass takes one tap. Set your daily goal and watch the progress bar fill up. When you hit it, the app celebrates with you.

### Calories
Log meals with a name and calorie count. The app keeps a running total against your daily goal. No barcode scanning, no food database — just honest numbers you enter yourself. Simple and fast.

### Sleep
Enter when you went to sleep and when you woke up. The app calculates your duration automatically, handling overnight spans correctly (so sleeping at 23:00 and waking at 06:30 gives you 7h 30m, not a negative number). Your sleep duration shows up on the dashboard every morning.

### Screen time
One number. How many hours did you spend on your phone today? Log it honestly. Seeing it written down is often enough to make you think twice tomorrow.

### Mood
One tap. Five options: Happy, Neutral, Sad, Tired, Energetic. That's it. No journaling prompts, no mood wheels. Just a quick emotional check-in that takes two seconds and tells you a lot over time.

### Habits
Five default habits — Exercise, Reading, Meditation, Study, Journaling — with a streak counter for each. The streak resets if you miss a day, which is exactly the right amount of pressure. Consistent small actions compound into real change, and seeing a 14-day streak is genuinely motivating.

### Activity timeline
A chronological log of your day. Add events with a time and a description — "09:00 – Morning run", "14:30 – Deep work session", "20:00 – Read for 30 minutes". At the end of the day you have a clear picture of how you actually spent your time, not how you think you spent it.

### Daily journal
A plain textarea. Write whatever you want. It saves automatically per calendar date, so tomorrow you start fresh. No formatting, no prompts — just space to think.

### Weekly analytics
Bar charts for tasks completed, water intake, and sleep hours across the last 7 days. Built with pure HTML and CSS — no charting library, no canvas. Clean, fast, and honest about your week.

### Achievements
Three badges you can earn:
- **Hydration Master** — meet your water goal 7 days in a row
- **Task Slayer** — complete 10 or more tasks in a single day
- **Early Bird** — sleep before 22:00 and wake before 06:30 for 3 consecutive days

Small rewards for real behaviour. No fake points, no leaderboards.

### Reminders
Set a time and an activity name. The app polls every minute and fires a browser notification when the time matches. Works even when the tab is in the background (with notification permission). A simple nudge to drink water, take a break, or start your evening routine.

---

## How it helps people

### The person who wants to build better habits but hates apps

Most habit apps are overwhelming. Nijam Paaku has no onboarding flow, no tutorial, no premium tier. You open it and start using it. The learning curve is zero.

### The person who's privacy-conscious

Your sleep schedule, your mood, your daily routine — this is sensitive data. Nijam Paaku stores everything in your browser's `localStorage`. It never touches a server. You can verify this by opening the browser's network tab: zero requests after the page loads.

### The student or remote worker

When you're working from home, the line between productive time and wasted time blurs fast. The task list, screen time tracker, and activity timeline together give you an honest audit of your day. The weekly analytics show you whether this week was better than last week.

### The person trying to improve their health

Water, calories, sleep, mood — four of the most impactful health metrics, all in one place. No app-switching, no syncing. Just log it and move on.

### The person who's tried and failed at journaling

The daily journal in Nijam Paaku is intentionally minimal. There's no pressure to write something meaningful. Some days it's a single sentence. Some days it's nothing. The point is that the space is there, it's private, and it resets every day.

---

## The philosophy behind it

Nijam Paaku is built on a few strong opinions:

**1. Your data is yours.** No account means no data breach. No server means no subscription. Your habits live in your browser and nowhere else.

**2. Friction is the enemy of consistency.** Every extra tap, every loading spinner, every "are you sure?" dialog is a reason to give up. Nijam Paaku is fast because it's simple. There's nothing to load.

**3. Honesty over gamification.** The streak counter resets when you miss a day. The screen time field is just a number you type in yourself. The app trusts you to be honest with it, because the only person you're tracking for is you.

**4. No dependencies means no surprises.** The app is a single HTML file, a CSS file, and a handful of JavaScript modules. It will work in five years the same way it works today. No framework updates, no breaking changes, no deprecated APIs.

---

## Try it

Clone the repo, open `index.html`, and start your day.

```
https://github.com/User-Dhanush-06/nijaam-paaku-daily-tracker
```

No install. No account. Just open and go.

---

*Built with vanilla HTML, CSS, and JavaScript. Zero runtime dependencies. All data stored locally in your browser.*
