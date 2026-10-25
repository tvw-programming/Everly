# Android Alarm Scheduling (AlarmManager)

## setExact / setExactAndAllowWhileIdle / setAlarmClock — differences and when to use each

### Takeaway
Use `setAlarmClock()` for user-visible reminders (most reliable, bypasses all power modes), `setExactAndAllowWhileIdle()` for time-critical background alarms that must fire during Doze, and `setExact()` only when timing must be precise but Doze-immunity isn't required.

### Cited Findings
- `setExact()` fires "as nearly as possible to the requested trigger time" but only when battery-saving measures aren't in effect — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setExactAndAllowWhileIdle()` fires at a nearly precise time even when battery-saving measures (Doze, App Standby) are in effect — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setAlarmClock()` fires at a precise time; the system never adjusts delivery and will leave low-power modes (Doze, App Standby) if needed to fire it — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setAlarmClock()` sets `FLAG_WAKE_FROM_IDLE` and `FLAG_STANDALONE` flags on the alarm internally, making it the most powerful and visible option — [Stack Overflow / dev.library.kiwix.org](https://dev.library.kiwix.org/content/stackoverflow_en_nopic_2021-08/questions/36110812/difference-between-setexact-and-setalarmclock)
- `setAlarmClock()` shows an alarm indicator in the system status bar; it is highly visible to users and can significantly affect battery life — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setAlarmClock()` takes an `AlarmClockInfo(triggerAtMillis, showIntent)` and a separate operation `PendingIntent`; this is the only method that surfaces a clock icon in the status bar — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Inexact alarms on Android 12 (API 31+) are delivered within one hour of the trigger time, unless battery-saving restrictions (Doze, battery saver) are active — [Android Developer Docs: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)
- `setWindow()` with a window under 600,000 ms (10 min) is clipped to 600,000 ms on apps targeting Android 12+ — [Android Developer Docs: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)
- Exact alarms are not affected by foreground service launch restrictions (Android 12+) — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- During Doze mode, `setExactAndAllowWhileIdle()` alarms are rate-limited; one Microsoft/Xamarin blog states a cap of approximately once every 9 minutes per app — [Microsoft Xamarin Dev Blog](https://devblogs.microsoft.com/xamarin/?p=28086) (unofficial; not confirmed in current Google docs — treat as approximate)
- Official docs confirm `setExactAndAllowWhileIdle()` invokes an alarm "at a nearly precise time in the future, even if battery-saving measures are in effect" but do not publish a specific rate-limit number — [Android Developer Docs](https://developer.android.com/training/scheduling/alarms)

### Inferences
- For a reminder app, `setAlarmClock()` is the safest choice for user-facing reminders: it bypasses Doze, doesn't require `SCHEDULE_EXACT_ALARM` on pre-API 31 devices (only `USE_EXACT_ALARM` or `SCHEDULE_EXACT_ALARM` on API 31+), and is guaranteed to fire on time.
- `setExactAndAllowWhileIdle()` is the right fallback if `setAlarmClock()` is not appropriate (e.g., silent background tasks) but the alarm must still fire during low-power modes.
- Reserve `setExact()` for alarms that are precise but where the user won't notice a slight delay if the device is in Doze.

### Gaps
- The exact Doze rate-limit number for `setExactAndAllowWhileIdle()` (the "9 minutes per app" figure) is not officially published in current Google docs — found only in third-party sources.


## SCHEDULE_EXACT_ALARM (API 31) vs USE_EXACT_ALARM (API 33)

### Takeaway
`SCHEDULE_EXACT_ALARM` is user-granted and revocable (must check `canScheduleExactAlarms()` at runtime), while `USE_EXACT_ALARM` is a normal install-time permission for calendar/alarm clock apps only; a reminder app should typically declare `SCHEDULE_EXACT_ALARM` and handle potential revocation gracefully.

### Cited Findings
- `SCHEDULE_EXACT_ALARM` was introduced in Android 12 (API 31) and is required to call `setExact()`, `setExactAndAllowWhileIdle()`, and `setAlarmClock()` on apps targeting API 31+; omitting it throws `SecurityException` — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- On Android 12–12L (API 31–32), `SCHEDULE_EXACT_ALARM` is **pre-granted** automatically to newly installed apps — [Esper Blog: Android 13 Exact Alarm API Restrictions](https://www.esper.io/blog/android-13-exact-alarm-api-restrictions)
- On Android 13+ (API 33+), `SCHEDULE_EXACT_ALARM` is **denied by default** for new installs targeting API 33+; existing apps that already held the permission keep it when upgrading — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- `USE_EXACT_ALARM` (introduced in Android 13 / API 33) is a **normal** permission, granted automatically at install, and cannot be revoked by the user — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Google Play policy limits `USE_EXACT_ALARM` to **calendar apps** (showing event notifications) and **alarm clock apps**; other apps publishing it will be rejected — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule); [Esper Blog](https://www.esper.io/blog/android-13-exact-alarm-api-restrictions)
- Apps must call `alarmManager.canScheduleExactAlarms()` before scheduling to verify `SCHEDULE_EXACT_ALARM` is granted; this must be checked even if the manifest declares the permission — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- To request `SCHEDULE_EXACT_ALARM`, launch `Intent(AlarmManager.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)` with the app's package URI; this opens the system "Alarms & reminders" settings page — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- When the permission is granted (or revoked), the system broadcasts `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`; apps must listen for this and reschedule all alarms in the broadcast receiver — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- If `SCHEDULE_EXACT_ALARM` is revoked, **all existing exact alarms for the app are canceled automatically** by the system — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Apps restored from backup onto Android 14 devices have `SCHEDULE_EXACT_ALARM` denied — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- The `setExact()` overload that takes an `OnAlarmListener` does **not** require `SCHEDULE_EXACT_ALARM` — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule); [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- Exemptions: apps on the power allowlist, apps with the platform signature, and privileged apps can always call `setExact()` — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)

### Recommended runtime pattern
```kotlin
val alarmManager = context.getSystemService<AlarmManager>()!!

// In onResume() or before scheduling:
if (alarmManager.canScheduleExactAlarms()) {
    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerMs, pendingIntent)
} else {
    // Show rationale, then:
    startActivity(Intent(AlarmManager.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = Uri.parse("package:${context.packageName}")
    })
    // Fallback:
    alarmManager.setWindow(AlarmManager.RTC_WAKEUP, triggerMs, 600_000L, pendingIntent)
}

// In a BroadcastReceiver for ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED:
if (alarmManager.canScheduleExactAlarms()) {
    // Re-schedule all alarms (same logic as BOOT_COMPLETED)
}
```

### Inferences
- A general reminder app should declare `SCHEDULE_EXACT_ALARM` (not `USE_EXACT_ALARM`, which is Play-policy-restricted) and handle the denied case with a graceful fallback to `setWindow()` with 10+ minute windows.
- Since the permission can be revoked at any time, the app must persist reminder data independently of scheduled alarms and always re-derive alarms from that data.

### Gaps
- No confirmed information on whether Google Play's `USE_EXACT_ALARM` policy enforcement is active as of 2025/2026 (policy enforcement date not found in sources).


## Repeating alarms: why inexact, and correct rescheduling pattern

### Takeaway
`setRepeating()` and `setInexactRepeating()` are both inexact on Android 4.4+ (API 19+); the correct pattern for precise repeating alarms is to use `setExact()` once and reschedule the next occurrence from inside the `BroadcastReceiver`.

### Cited Findings
- Since Android 4.4 (API 19), **all repeating alarms are inexact**; even `setRepeating()` with a custom interval will not fire at the exact specified time — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- The reason is battery efficiency: Android batches alarm wakeups across apps to minimize CPU wakes — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setInexactRepeating()` accepts only predefined interval constants (`INTERVAL_FIFTEEN_MINUTES`, `INTERVAL_HALF_HOUR`, `INTERVAL_HOUR`, `INTERVAL_HALF_DAY`, `INTERVAL_DAY`) — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `setRepeating()` allows custom intervals but is still inexact after API 19 — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- The `Intent.EXTRA_ALARM_COUNT` extra on the alarm broadcast indicates how many accumulated alarm events are included when the device was asleep — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- Recurring alarms missed while the device was asleep fire "as soon as possible" after wake; later alarms return to the original schedule without drifting — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- Setting a second alarm with the **same `PendingIntent`** replaces the original alarm — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Official docs recommend using `WorkManager` or `JobScheduler` for longer work triggered by alarms, rather than starting a service directly from the `BroadcastReceiver` — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)

### Correct rescheduling pattern (from BroadcastReceiver)
```kotlin
class ReminderAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // 1. Do the immediate work (or enqueue WorkManager job)
        triggerReminderNotification(context, intent)

        // 2. Schedule next occurrence
        val reminderId = intent.getLongExtra("reminder_id", -1)
        val nextTriggerMs = computeNextOccurrence(reminderId)  // from persisted data
        if (nextTriggerMs > 0) {
            val alarmManager = context.getSystemService<AlarmManager>()!!
            val nextIntent = createAlarmPendingIntent(context, reminderId)
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, nextTriggerMs, nextIntent)
            } else {
                alarmManager.setWindow(AlarmManager.RTC_WAKEUP, nextTriggerMs, 600_000L, nextIntent)
            }
        }
    }
}
```

### Inferences
- For a reminder app needing precise timing (e.g., fire at exactly 9:00 AM daily), chain `setExact()` calls: each `BroadcastReceiver` fires the alarm, does its work, and schedules the next exact alarm.
- `EXTRA_ALARM_COUNT > 1` means the device was asleep for multiple intervals; the app should handle this (e.g., fire only once, not multiple notifications).
- Using `ELAPSED_REALTIME_WAKEUP` is preferable for fixed intervals because it's not affected by clock changes or timezone shifts; use `RTC_WAKEUP` for time-of-day alarms.

### Gaps
- No official documentation found on the exact maximum delay for inexact repeating alarms (only "may be deferred and delivered some time later" for `set()`).


## BOOT_COMPLETED receiver: restoring alarms after reboot + Android 10+ restrictions

### Takeaway
A `BOOT_COMPLETED` receiver is the standard mechanism to reschedule alarms after reboot; however, Android 8.0+ background start restrictions mean you must use `startForegroundService()` to start services from it, and Android 14/15 restricts which foreground service types can be launched from `BOOT_COMPLETED`.

### Cited Findings
- All alarms are **canceled when the device is turned off and rebooted**; they must be rescheduled in a `BOOT_COMPLETED` receiver — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `RECEIVE_BOOT_COMPLETED` permission is required in the manifest, and it only receives the broadcast after the **user has launched the app at least once** — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- The receiver should be declared `android:enabled="false"` by default and enabled via `PackageManager.setComponentEnabledSetting()` only when the app has active alarms — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Android 8.0 (Oreo) background limits: even though `BOOT_COMPLETED` is a whitelisted implicit broadcast, starting a plain `Service` from the receiver fails because the app is in the background; must use `startForegroundService()` — [CommonsWare Blog](https://commonsware.com/blog/2017/06/12/action_boot_completed-intentservice-android-8p0.html)
- `goAsync()` extends the receiver's ANR window and allows limited background work without starting a service — [CommonsWare Blog](https://commonsware.com/blog/2017/06/12/action_boot_completed-intentservice-android-8p0.html)
- **Android 14 (API 34), targeting API 34+:** Apps cannot start a **microphone** foreground service from `BOOT_COMPLETED` — [Android Developer Docs: Android 15 FGS Types](https://developer.android.com/about/versions/15/changes/foreground-service-types)
- **Android 15 (API 35), targeting API 35+:** Apps cannot start the following foreground service types from `BOOT_COMPLETED`: **camera**, **dataSync**, **mediaPlayback**, **mediaProjection**, **phoneCall** — [Android Developer Docs: Android 15 FGS Types](https://developer.android.com/about/versions/15/changes/foreground-service-types)
- Attempting to start a restricted FGS type from `BOOT_COMPLETED` throws `ForegroundServiceStartNotAllowedException` — [Android Developer Docs: Android 15 FGS Types](https://developer.android.com/about/versions/15/changes/foreground-service-types)
- Android 15 also adds `PendingIntent`-based background launch restrictions by default, relevant to alarm receivers that try to start activities — [Android Developer Docs: Android 15 Behavior Changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- Android 15: if an app enters the **stopped state** (force-stopped), pending intents are canceled and app widgets disabled until the user relaunches the app; the app then receives `ACTION_BOOT_COMPLETED` to re-register pending intents — [Android Developer Docs: Android 15 Behavior Changes (all apps)](https://developer.android.com/about/versions/15/behavior-changes-all)

### Correct BOOT_COMPLETED pattern for a reminder app
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

<receiver
    android:name=".BootReceiver"
    android:enabled="false"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED"/>
    </intent-filter>
</receiver>
```
```kotlin
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Re-read persisted reminders from storage
        val reminders = ReminderRepository(context).getAllActive()
        val alarmManager = context.getSystemService<AlarmManager>()!!
        for (reminder in reminders) {
            scheduleAlarm(context, alarmManager, reminder)
        }
        // Do NOT start mediaPlayback foreground service here on Android 15+
        // Use WorkManager for data restoration instead
    }
}
```

### Inferences
- For a reminder app targeting Android 15, the `BOOT_COMPLETED` receiver should only reschedule `AlarmManager` alarms and optionally enqueue a `WorkManager` task. It must not call `startForegroundService()` with `mediaPlayback` type.
- Apps should also listen for `MY_PACKAGE_REPLACED` to reschedule alarms after app updates, since some Android versions clear alarms on package replacement.
- Reminder data must be stored in a persistent database (not only in memory) so the `BOOT_COMPLETED` receiver can restore all alarms.

### Gaps
- No official documentation on whether `WorkManager` enqueued from `BOOT_COMPLETED` has the same restrictions as foreground services on Android 15 (likely not, as WorkManager uses `JobScheduler` internally and is not a foreground service).
- The exact behavior of OEM-customized Android (Samsung, Xiaomi, etc.) regarding `BOOT_COMPLETED` delivery is not documented officially; these OEMs often add additional restrictions via their proprietary battery-saving features.


## Missed alarm window and powered-off behavior

### Takeaway
Android does not document a specific "missed alarm window" for exact alarms; exact alarms fire as soon as the device is available after the trigger time. Alarms are **not persisted across device power-off** — they are completely lost and must be rescheduled via `BOOT_COMPLETED`.

### Cited Findings
- Alarms survive device **sleep** (screen off / CPU idle), but are **cleared if the device is turned off and rebooted** — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- For **non-wakeup alarm types** (`ELAPSED_REALTIME`, `RTC`): if the device is asleep when the alarm fires, the alarm is delivered the next time the device wakes up (it will not be delivered until the next time the device wakes up) — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- For **wakeup alarm types** (`ELAPSED_REALTIME_WAKEUP`, `RTC_WAKEUP`): the device is woken up to deliver the alarm — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Recurring alarms missed while the device was asleep fire "as soon as possible" on wake; the subsequent alarms return to the original schedule — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- If a repeating alarm's trigger time was in the past when first set, it fires immediately — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `Intent.EXTRA_ALARM_COUNT` carries the count of accumulated missed alarm events in a repeating alarm's intent — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html)
- No official documentation found for a specific "missed alarm window" duration for exact alarms (e.g., "exact alarm is discarded if X minutes late") — confirmed absent from current Google docs and all searched sources
- There are anecdotal reports that `setAlarmClock()` alarms may survive reboots on some OEM devices, but this is **not** an Android platform guarantee — [Android APIs Reference (PCC mirror)](https://spot.pcc.edu/~mgoodman/developer.android.com/reference/android/app/AlarmManager.html) (anecdotal; not platform guarantee)
- For inexact alarms, on Android 12+, the system delivers within one hour of the trigger time (unless battery saving is active) — [Android Developer Docs: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)
- Android 12 introduced a one-hour maximum delivery window for inexact alarms; this is not a "miss" threshold but a maximum delay — [Android Developer Docs: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)

### Inferences
- The practical implication is: **use `RTC_WAKEUP` or `ELAPSED_REALTIME_WAKEUP`** for reminders that must fire (not just the non-wakeup variants). Non-wakeup types will be silently delayed until user activity.
- The app cannot rely on AlarmManager to "catch up" on alarms missed during power-off. On `BOOT_COMPLETED`, the app should check if any reminders are overdue and either fire them immediately or mark them as missed.
- No platform guarantee for a "fire or discard" window on exact alarms; the system will fire an exact alarm as soon as it can after the trigger time unless the device was off.

### Gaps
- No official documentation on a maximum lateness for exact alarm delivery (the "fire or discard after N minutes" behavior). This question was not answerable from available sources.
- No official documentation on `setAlarmClock()` surviving reboots — only anecdotal OEM-specific reports.


## Android 14 and 15 new restrictions on AlarmManager

### Takeaway
Android 14's main change was making `SCHEDULE_EXACT_ALARM` denied by default for new installs targeting API 33+. Android 15 added restrictions on launching foreground service types (including `mediaPlayback`) from `BOOT_COMPLETED`, and introduced `PendingIntent` background activity launch restrictions by default.

### Cited Findings
**Android 14 (API 34):**
- `SCHEDULE_EXACT_ALARM` is no longer pre-granted to most newly installed apps targeting Android 13 (API 33) or higher — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- Apps restored from backup onto Android 14 also have the permission denied — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- Existing apps that already held `SCHEDULE_EXACT_ALARM` keep it when the device upgrades from an earlier version to Android 14 — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- Apps not falling into a special category (calendar, alarm clock) are denied by default and must prompt the user — [Android Developer Docs: Android 14 Changes](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- No changes to the AlarmManager APIs themselves in Android 14; the change is purely in the default permission state — confirmed from search of Android 14 behavior-changes pages

**Android 15 (API 35):**
- `BOOT_COMPLETED` receivers cannot launch **camera, dataSync, mediaPlayback, mediaProjection, phoneCall** foreground service types — [Android Developer Docs: Android 15 FGS Types](https://developer.android.com/about/versions/15/changes/foreground-service-types)
- Attempting it throws `ForegroundServiceStartNotAllowedException` — [Android Developer Docs: Android 15 FGS Types](https://developer.android.com/about/versions/15/changes/foreground-service-types)
- **PendingIntent creators block background activity launches by default** on Android 15 (opt-in required) — [Android Developer Docs: Android 15 Behavior Changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- Apps in the **stopped state** have their pending intents canceled; they receive `ACTION_BOOT_COMPLETED` upon leaving the stopped state to re-register — [Android Developer Docs: Android 15 Behavior Changes (all apps)](https://developer.android.com/about/versions/15/behavior-changes-all)
- No AlarmManager API-level changes were found in Android 15 behavior change documentation — confirmed from reviewing the Android 15 behavior-changes pages

**No Android 15 AlarmManager API changes confirmed:**
- The Android 15 behavior-changes pages (both "all apps" and "targeting 15+") do not list any changes to `AlarmManager` or exact alarm scheduling — [Android Developer Docs: Android 15 Behavior Changes (all apps)](https://developer.android.com/about/versions/15/behavior-changes-all)

### Inferences
- For apps targeting API 33+, the most important change is handling `SCHEDULE_EXACT_ALARM` being denied by default. The app must have a robust graceful degradation path using `setWindow()`.
- The Android 15 `BOOT_COMPLETED` FGS restrictions are highly relevant: a reminder app that uses `mediaPlayback` to play a sound on alarm cannot start from boot this way — it must enqueue a WorkManager task instead, which will play the sound when it runs.

### Gaps
- No confirmed information on Android 15's "background network access restrictions" impact on alarm-triggered WorkManager tasks.
- No confirmation of whether the `PendingIntent` background activity launch blocking in Android 15 also affects `BroadcastReceiver`-delivered alarm intents (vs. activity-starting intents).


## Canceling a pending alarm: the FLAG_NO_CREATE pattern

### Takeaway
To cancel an alarm, retrieve the existing `PendingIntent` using `FLAG_NO_CREATE` (which returns `null` if no matching intent exists), then call `AlarmManager.cancel()` with that intent; this is the safe, idiomatic pattern that avoids creating a spurious intent.

### Cited Findings
- `PendingIntent.FLAG_NO_CREATE` returns `null` instead of creating a new `PendingIntent` if no matching one exists — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- `AlarmManager.cancel()` cancels any alarm associated with the given `PendingIntent` — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- A `PendingIntent` created with `FLAG_ONE_SHOT` **cannot be canceled** — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- On Android 12+ (targeting API 31+), `PendingIntent` must include `FLAG_IMMUTABLE` or `FLAG_MUTABLE` — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Setting a new alarm with the same `PendingIntent` replaces the original (no need to cancel first if replacing) — [Android Developer Docs: Schedule Alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)

### Correct cancel pattern
```kotlin
fun cancelAlarm(context: Context, reminderId: Int) {
    val alarmManager = context.getSystemService<AlarmManager>() ?: return

    val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
        putExtra("reminder_id", reminderId)
    }
    // FLAG_NO_CREATE: returns null if no matching PendingIntent exists
    val pendingIntent = PendingIntent.getBroadcast(
        context,
        reminderId,  // requestCode must match the one used when scheduling
        intent,
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )

    if (pendingIntent != null) {
        alarmManager.cancel(pendingIntent)
        pendingIntent.cancel()  // optional: also remove the PendingIntent itself
    }
}
```

### Inferences
- The `requestCode` parameter must exactly match what was used when creating the alarm's `PendingIntent`; this is the "identity" of the alarm from the system's perspective.
- For a multi-reminder app, use each reminder's unique ID as the `requestCode` so different reminders don't accidentally cancel each other.
- `FLAG_IMMUTABLE` should always be set for alarm `PendingIntent`s in Android 12+ to prevent third-party modifications; this has no impact on cancellation behavior.
- Disabling the `BOOT_COMPLETED` receiver via `PackageManager.setComponentEnabledSetting(...DISABLED...)` when all alarms are canceled prevents unnecessary wakeup at boot.

### Gaps
- No official documentation found on whether `alarmManager.cancel()` + `pendingIntent.cancel()` must both be called, or if one is sufficient. Conventional practice uses both, but the docs only mention `cancel(pendingIntent)` on `AlarmManager`.
