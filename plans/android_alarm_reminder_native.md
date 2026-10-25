# Personal Android Alarm Reminder App — Implementation Plan

**Status:** Plan only (not implemented)  
**Delivery model:** Sideloaded APK (no Play Store)  
**UI:** React Native / Expo custom native build  
**Critical path:** Android AlarmManager → BroadcastReceiver → Foreground Service (mediaPlayback) → ongoing notification actions

---

## 0. Requirement analysis — verdict

| Ask | Feasible? | Constraint |
| --- | --- | --- |
| Full-song / looping local audio at alarm time | Yes | Must run in a **foreground service**, not JS timer |
| Works when UI closed / process killed (normal) | Yes | Exact alarms + reboot reschedule |
| Works after Force Stop | **No guarantee** | Android policy; communicate clearly |
| Override all DND / OEM battery killers | **No** | Reliability screen + OEM deep links |
| Spotify / YouTube streams | Out of scope | Local / bundled only |
| Sideload avoids Play FGS policy | Partially | Sideload skips Play review, **not** OS FGS / alarm APIs |

**Gap vs current Everly:** `expo-notifications` DATE triggers + in-process `expo-av` cannot reliably start full music when the JS process is dead. This plan adds a **native Android alarm/playback module** and an Expo **dev client / prebuild** APK pipeline.

---

## 1. Goals and non-goals

### Goals
1. Daily / weekly / optional one-time reminders with **12h AM/PM** time UI.
2. Bundled tone, system default alarm URI, **copied local music**, or Silent + vibration.
3. At fire time: FGS plays audio (once or loop until max duration), vibration optional.
4. Notification actions: **Stop / Snooze / Mark Done**; tap → active-alarm screen.
5. 100% local persistence; offline; no account/backend required for core alarms.
6. Reboot restores schedules; missed-occurrence policy without multi-fire spam.
7. Conflict queue: never two music tracks at once.

### Non-goals (v1)
- iOS parity for exact alarm music.
- Streaming services.
- Guaranteed fire after Force Stop or while powered off.
- Always-on background media service waiting for next alarm.

---

## 2. Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│ React Native (Expo Router UI)                               │
│  Home · Add/Edit · Active Alarm · Reliability · History     │
│  lib/reminders/*  AsyncStorage / SQLite metadata            │
└──────────────────────────┬──────────────────────────────────┘
                           │ TurboModule / Expo Module bridge
┌──────────────────────────▼──────────────────────────────────┐
│ Android native (Kotlin)                                     │
│  AlarmScheduler  — AlarmManager.setExactAndAllowWhileIdle   │
│  AlarmReceiver   — receives PendingIntent                   │
│  AlarmPlaybackService — FGS type mediaPlayback              │
│  AlarmNotification — ongoing + actions                      │
│  BootReceiver — reschedule only (no media start)            │
│  AudioStore — copy URI → app files dir                      │
└─────────────────────────────────────────────────────────────┘
```

### Why this shape
- Alarms survive process death; JS timers do not.  
- FGS may be started from an exact-alarm callback for a **user-requested** action (with correct permissions / type).  
- Boot receiver **reschedules** only — do not start mediaPlayback FGS from boot on modern Android.

---

## 3. Data model (extend / fork Everly reminders)

```ts
type AlarmReminder = {
  id: string;
  title: string;
  description?: string;
  category: 'personal' | 'social' | 'professional' | 'financial';
  timeHour12: number;          // 1–12
  timeMinute: number;          // 0–59
  period: 'AM' | 'PM';
  startDate: string;           // YYYY-MM-DD local
  endDate?: string | null;
  frequency: 'once' | 'daily' | 'weekly';
  weekdays: number[];          // 0=Sun … 6=Sat; required if weekly
  enabled: boolean;

  audio: {
    source: 'default_alarm' | 'bundled' | 'local_file' | 'silent';
    bundledKey?: string;
    displayName: string;
    /** App-managed absolute path after copy */
    managedPath?: string;
    /** Original content URI (debug only) */
    sourceUri?: string;
    durationMs?: number;
    missingFallbackUsed?: boolean;
  };

  playback: {
    mode: 'once' | 'loop_until_stopped';
    maxRingMinutes: 1 | 5 | 10 | 30;
    gradualVolume: boolean;
    gradualSeconds?: number;   // e.g. 15–60
    useAlarmStream: true;      // STREAM_ALARM
  };

  vibration: {
    enabled: boolean;
    patternId: 'default' | 'pulse' | 'double';
  };

  snoozeMinutes: 5 | 10 | 15 | 30;

  /** Native bookkeeping */
  native: {
    nextFireAtEpochMs: number | null;
    pendingIntentRequestCode: number;
    lastAlarmId?: string;
  };
};

type AlarmOccurrence = {
  id: string;
  reminderId: string;
  scheduledAt: string;
  state: 'scheduled' | 'triggered' | 'snoozed' | 'completed' | 'dismissed' | 'timed_out' | 'missed';
  acknowledgedAt?: string;
};
```

**Storage:** SQLite (`expo-sqlite` or Watermelon) preferred for occurrences/history; AsyncStorage acceptable for v0 config only. Persist managed audio under `context.filesDir/alarms/`.

---

## 4. Native module API (JS ↔ Android)

Proposed Expo Module `EverlyAlarm` (Kotlin):

| Method | Purpose |
| --- | --- |
| `requestPermissions()` | POST_NOTIFICATIONS, schedule exact alarm intent |
| `canScheduleExactAlarms(): boolean` | Gate UI warning |
| `schedule(reminderJson): { nextFireAt }` | Cancel old PI → setExactAndAllowWhileIdle |
| `cancel(reminderId)` | Cancel PendingIntent |
| `rescheduleAll()` | Boot / app open reconcile |
| `importAudio(contentUri): { managedPath, displayName, durationMs }` | Copy + validate |
| `preview(pathOrBundledKey)` / `stopPreview()` | Short MediaPlayer preview |
| `testFire(reminderId)` | Near-term exact alarm (~5–10s) for QA |
| `getReliabilityStatus(): ReliabilityStatus` | Permissions + battery + last test |
| `openExactAlarmSettings()` / `openBatteryOptimizationSettings()` | Settings intents |
| Events: `onAlarmTriggered`, `onAlarmStopped`, `onQueueChanged` | Bridge to RN |

Manifest essentials (illustrative):

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<!-- READ_MEDIA_AUDIO or SAF only; prefer SAF + copy -->

<service
  android:name=".alarm.AlarmPlaybackService"
  android:exported="false"
  android:foregroundServiceType="mediaPlayback" />

<receiver android:name=".alarm.AlarmReceiver" android:exported="false" />
<receiver android:name=".alarm.BootReceiver" android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.BOOT_COMPLETED" />
  </intent-filter>
</receiver>
```

Use `AlarmClock` info extras where useful so the system may surface alarm UX; still own FGS playback.

---

## 5. Alarm fire sequence (must-pass)

1. `AlarmReceiver.onReceive` loads reminder id from intent extras (SharedPreferences/SQLite).  
2. If another FGS is already playing → **enqueue** occurrence; update notification badge count; return.  
3. Else `context.startForegroundService(AlarmPlaybackService)`.  
4. Service within seconds: `startForeground(notifId, ongoingNotification)` with Stop/Snooze/Done.  
5. Acquire brief wake lock only as needed; play via `AudioAttributes.USAGE_ALARM`.  
6. Apply vibration pattern if enabled.  
7. Loop or once; enforce `maxRingMinutes` timer.  
8. On Stop / Snooze / Done / timeout: stop players, cancel vibe, stopForeground, stopSelf.  
9. Scheduler writes occurrence state; computes **next** fire; `setExactAndAllowWhileIdle` for that single next occurrence (do **not** rely on inexact repeating alarms).

---

## 6. UI screens (RN)

| Screen | Responsibilities |
| --- | --- |
| **Home** | Prominent Add; cards (title, category, 12h time, repeat, next occurrence, audio name, sound/vibe icons, enable switch); Edit / Test / Delete; sort by next fire; disabled at bottom |
| **Add/Edit** | All form fields + live summary sentence; 12h picker with visible AM/PM; weekday multi-select; audio picker + preview; max duration; snooze; gradual volume |
| **Active Alarm** | Large Stop / Snooze; title/desc; optional queue count; opened from notification tap (not required for alarm to function) |
| **Reliability** | Notification, exact alarm, battery opt, OEM notes, audio health, last test result + deep links |
| **History / Missed** | Missed in last N minutes; dismiss; no auto multi-play |
| **Export/Import** | JSON backup of configs (+ note that audio files may need re-pick if not packaged) |

Reuse Everly `PhoneShell` / themes where helpful; this product track can live as `app/(alarms)/` routes or a focused fork package.

### Form summary example
> Every Monday, Wednesday, and Friday at 08:30 AM · Morning Music · Repeat for up to 5 minutes · Vibration on

---

## 7. Scheduling rules

1. Convert 12h + AM/PM → local `LocalDateTime` (careful: 12 AM = 00:00, 12 PM = 12:00).  
2. If datetime ≤ now → advance to next eligible day (daily +1 day; weekly next matching weekday).  
3. Honor `startDate` / `endDate`; if past end → disable and clear native alarm.  
4. On edit/disable/delete: **cancel** previous `PendingIntent` before any new schedule.  
5. On TZ / time change: listen `ACTION_TIME_CHANGED` / `TIMEZONE_CHANGED` → `rescheduleAll()`.  
6. If `canScheduleExactAlarms() == false`: show blocking warning; fall back messaging (inexact is **not** acceptable for music alarms — push user to grant access).

---

## 8. Audio & vibration policy

| Topic | Decision |
| --- | --- |
| Volume stream | `STREAM_ALARM` / `USAGE_ALARM` |
| Alarm volume 0 | Warn on save + on Test |
| Preview | Separate short-lived player; stop previous on new selection |
| Import | SAF picker → copy to app storage → validate decode |
| Missing file | Bundled fallback + `missingFallbackUsed` flag + UI warning |
| Interruption (call) | Pause; resume only if still within max ring window; else timeout |
| FGS notification sound | Silent channel (sound comes from MediaPlayer) |
| Vibration | Independent of audio; stop with alarm end |
| Loop | `loop_until_stopped` capped by max minutes |

---

## 9. Conflicts & queue

- Single `AlarmPlaybackService` instance; `ConcurrentLinkedQueue` of pending occurrence ids.  
- Notification subtitle: `+N waiting`.  
- After Stop/Done/Timeout of current → optionally auto-start next if still within eligibility window (e.g. triggered < 5 min ago); else mark missed/queued-expired.  
- Snooze of A must not cancel B.

---

## 10. Missed & reboot policy

| Event | Behavior |
| --- | --- |
| Boot | `BootReceiver` → `rescheduleAll()` only |
| App open | Reconcile: any `scheduled` with `fireAt < now - grace` → `missed`; schedule next; optional banner “missed in last 30 min” |
| Power off during fire | No playback; mark missed after next boot/open |
| Force stop | Document as unsupported; on next open reschedule |

---

## 11. Permissions & Reliability screen

Checklist UI:

1. Notifications — required Android 13+.  
2. Alarms & reminders (exact) — required.  
3. Battery optimization exemption — strongly recommended.  
4. OEM autostart / background (Xiaomi, Oppo, Vivo, Samsung) — link to known settings where possible; else show copy.  
5. Audio files — scan managed paths.  
6. Last successful test alarm timestamp.

---

## 12. Expo / build pipeline

| Step | Action |
| --- | --- |
| 1 | `npx expo prebuild -p android` (or continuous native directory) |
| 2 | Add Kotlin module under `modules/everly-alarm` (Expo Modules API) |
| 3 | Configure `app.json` / `app.config` plugins for permissions + FGS type |
| 4 | EAS Build **preview/APK** profile (`buildType: apk`) for sideload |
| 5 | Disable depending on Expo Go for alarm QA — **dev client / release APK only** |

Web / Expo Go remain useful for form UX only; mark alarm features `Platform.OS === 'android' && nativeModuleAvailable`.

---

## 13. Implementation phases

### Phase A — Foundations (data + UI shell)
- Extend types with Financial category + alarm fields.  
- Home cards + Add/Edit with 12h DateTimePicker (`display: 'spinner'` / custom AM/PM).  
- Local persistence + summary preview.  
- Reliability screen stubs (permission APIs).  
**Exit:** Forms save/load; no native fire yet.

### Phase B — Native scheduler + silent fire
- Expo module: schedule/cancel/rescheduleAll/boot.  
- Receiver logs + RN event; notification without music first.  
**Exit:** Exact alarm fires with notification when app killed (smoke test).

### Phase C — FGS playback
- `AlarmPlaybackService` + MediaPlayer/ExoPlayer, vibration, max duration, Stop/Snooze/Done.  
- Active alarm screen deep link.  
**Exit:** Full song loops until Stop or max duration from lock screen.

### Phase D — Audio library
- SAF import, copy, preview, fallback, silent mode.  
**Exit:** Acceptance criteria 3, 10.

### Phase E — Queue, history, missed, export
- Conflict queue, occurrence history, missed banner, JSON export/import.  
**Exit:** Criteria 8, 9, 11.

### Phase F — Device hardening
- Overnight idle, battery saver, OEM checklist, volume-0 warnings, call interruption.  
**Exit:** Criteria 12–13 on physical APK.

---

## 14. Mapping to current Everly repo

| Existing | Reuse / replace |
| --- | --- |
| `lib/types.ts` ReminderTask | Extend or parallel `AlarmReminder` (add `financial`) |
| `lib/notifications.ts` expo-notifications | **Replace** Android path with EverlyAlarm module; keep iOS/web soft path |
| `lib/audio.ts` expo-av | Preview only; alarm playback = native |
| `assets/sounds/*` | Bundled defaults |
| Companion / Ideas / Manifest | Unchanged adjacent tabs; alarms can remain Home-primary |
| Expo Go | Insufficient for final acceptance |

Recommended package path: `modules/everly-alarm/` + `app/alarms/` routes + `plans/android_alarm_reminder_native.md` (this file).

---

## 15. Acceptance criteria → test plan

| # | Criterion | Test |
| --- | --- | --- |
| 1 | Create via Home + 12h picker | Manual form QA |
| 2 | Daily/weekly next occurrence | Unit tests on schedule pure functions + device |
| 3 | Local file preview + alarm play | SAF import → Test Alarm |
| 4 | Background / locked | Schedule +1 min, leave app, lock |
| 5 | Notif actions without Home | Stop/Snooze/Done from shade |
| 6 | Max duration | Loop 1-min max |
| 7 | Vibration stops | Toggle on; Stop |
| 8 | Edit/delete no orphans | `adb shell dumpsys alarm` before/after |
| 9 | Reboot restore | Reboot; confirm next PI |
| 10 | Missing audio fallback | Delete managed file; trigger |
| 11 | No dual tracks | Two near alarms; queue |
| 12 | Permission messaging | Deny exact alarm; UI warns |
| 13 | Overnight APK | Install release APK; idle 8h |

---

## 16. Risks

| Risk | Mitigation |
| --- | --- |
| OEM kills FGS / blocks autostart | Reliability screen + OEM guides |
| Exact alarm permission denied | Block save of enabled alarms until granted |
| Large music files / storage | Cap import size; copy compress optional |
| ExoPlayer vs MediaPlayer | Start MediaPlayer; migrate if format issues |
| Notification action process death | Actions handled in `BroadcastReceiver` / service, not only JS |
| Expo config drift | Config plugin owns manifest merges |

---

## 17. Commit / delivery note

When implementation starts, prefer:

```
feat(alarms): native Android exact-alarm scheduler and foreground music playback service
```

This plan file is the source of truth until Phase A begins.
