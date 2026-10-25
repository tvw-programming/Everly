# Personal Android Alarm Reminder — Simple Plan

**Goal:** Sideloaded APK that rings local music on time, with Stop / Snooze / Done.  
**Rule:** All screens stay in React Native so you can change UI anytime. Native Kotlin is a thin helper only.

---

## Do you need Kotlin?

| What you want | Expo / JS alone? | Need Kotlin? |
| --- | --- | --- |
| UI (forms, cards, theme) | Yes | No |
| “Push” / alert when app is open | `expo-notifications` is fine | No |
| Fire **on time** when app is closed / phone asleep | Unreliable with JS timers | **Yes — AlarmManager** |
| Play **full song / loop** in background | Unreliable with JS-only audio | **Yes — short foreground service** |
| Stop / Snooze / Done on the notification | Better as native actions | Small amount of Kotlin |

So: **Kotlin is not for building the UI.**  
It is only for “wake up and play music,” which Android will not trust a JS timer to do.

If you only need a short beep when the app might be open, you could skip Kotlin — that does **not** meet your music + closed-app requirement.

---

## Simple architecture

```
React Native screens (you edit these freely)
   Home · Add/Edit · Active alarm · Settings
        │
        │  few calls: schedule / cancel / test
        ▼
Thin Android module (write once, rarely touch)
   AlarmManager → play music in foreground service → notification buttons
```

- Reminder data, categories, 12h time, lists → **React Native + AsyncStorage** (same style as today).
- Scheduling + playback → **one small native module**.

No extra backend, no Play Store, no always-running service waiting for the next alarm.

---

## What we build (keep it small)

### In React Native (easy UI updates)
1. Home: reminder cards, enable switch, Add / Edit / Delete / Test.
2. Add/Edit form: title, category, 12h AM/PM time, daily or weekly days, audio pick, vibrate on/off, snooze minutes, max ring time, enabled.
3. Active alarm screen: big Stop / Snooze (optional; notification actions must work without it).
4. One “Permissions” screen: notification + exact alarm + battery tip (simple checklist).

### In Kotlin (thin, stable)
1. `schedule(reminder)` / `cancel(id)` — exact alarm for the **next** fire only.
2. On fire → start short **foreground service** → play chosen file (or bundled fallback).
3. Notification: Stop, Snooze, Done.
4. On boot → reschedule from saved reminders (no music at boot).

That’s the native surface area. No queue microservice, no export system required for v1.

---

## Cut from the old overbuilt plan

| Removed / deferred | Why |
| --- | --- |
| Phases C–F as separate epics | One native slice covers play + actions |
| Conflict queue sophistication | If a second alarm fires while one plays: stop first or ignore second until Stop (pick one simple rule) |
| Gradual volume, many vibe presets | Optional later |
| JSON export/import | Later |
| OEM deep-link encyclopedia | One Settings button + short note |
| Missed-alarm analytics | On open: show “missed” list, don’t auto-play old ones |

---

## Two phases only

### Phase 1 — UI (RN only)
- Reminder model + Home + Add/Edit (12h picker).
- Save locally.
- Wire “Test” to a stub that later calls native.
- You can restyle everything here without touching Kotlin.

**Done when:** you like the screens and can create/edit/disable reminders.

### Phase 2 — Native alarm + music (small Kotlin module)
- Exact alarm + FGS playback + Stop/Snooze/Done.
- Copy picked local file into app storage (so moves don’t break alarms).
- Boot reschedule.
- Build **APK** (Expo prebuild / EAS). Not Expo Go.

**Done when:** phone locked, app closed, music still rings; notification buttons work.

Ship after Phase 2. Improve UI anytime in RN.

---

## Simple conflict rule (v1)

**Only one song at a time.**  
If another reminder fires while playing: show it in the notification text as “also due,” and start it only after Stop/Done — or skip until next scheduled day. No fancy queue engine.

---

## Permissions (minimal)

Ask for:
1. Notifications  
2. Exact alarms (Alarms & reminders)  
3. Suggest ignoring battery optimization (one link)

Show a clear message if exact alarms are off — don’t silently fail.

---

## Acceptance (short)

1. Create reminder with 12h time.  
2. Daily / weekly next time is correct.  
3. Local or bundled audio plays at fire time with phone locked.  
4. Stop / Snooze / Done work from notification.  
5. Edit/delete cancels old alarm.  
6. After reboot, future alarms return.  
7. Verified on your phone with installed APK.

---

## Next step

Start **Phase 1** (RN UI only). Add the Kotlin module only when the screens feel right.
