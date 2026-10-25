# Android Foreground Services for Alarm Audio Playback (API 31–35)

## Foreground Service Types for Alarm Audio Playback

### Takeaway
There is no dedicated "alarm" foreground service type. Alarm apps that play full-length music should use `systemExempted` (if they hold an exact-alarm permission) or `mediaPlayback` as a fallback; `shortService` (3-minute cap) is unsuitable for full-length audio.

### Cited Findings
- There is no `alarm` foreground service type. The full list of 14 types is: `camera`, `connectedDevice`, `dataSync`, `health`, `location`, `mediaPlayback`, `mediaProcessing`, `mediaProjection`, `microphone`, `phoneCall`, `remoteMessaging`, `shortService`, `specialUse`, `systemExempted`. — [Foreground service types | Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
- `mediaPlayback` type purpose: "Continue audio or video playback from the background." Required permission: `FOREGROUND_SERVICE_MEDIA_PLAYBACK`. No runtime prerequisites. — [Foreground service types | Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
- `systemExempted` type is specifically eligible for: "Apps holding `SCHEDULE_EXACT_ALARM` or `USE_EXACT_ALARM` permission that use a foreground service to continue alarms in the background, including haptics-only alarms." Required permission: `FOREGROUND_SERVICE_SYSTEM_EXEMPTED`. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- `shortService` runs for approximately 3 minutes only. It does not support sticky behavior and cannot start other foreground services — wholly unsuitable for full-length alarm audio. — [Foreground service types | Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
- The `systemExempted` type was introduced in Android 14 (API 34). An app that does not meet any eligibility criterion gets `ForegroundServiceTypeNotAllowedException` at runtime. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)

### Inferences
- An alarm clock app holding `USE_EXACT_ALARM` or `SCHEDULE_EXACT_ALARM` should prefer `systemExempted` over `mediaPlayback`, because `systemExempted` is semantically correct for alarm continuation, is not restricted from `BOOT_COMPLETED` on Android 15, and Android's documentation specifically calls out this use case.
- For an app that does not hold an exact-alarm permission, `mediaPlayback` is the closest correct type for playing audio from the background, though it is restricted from `BOOT_COMPLETED` on Android 15+.

### Gaps
- The documentation does not state whether an alarm app can combine `systemExempted | mediaPlayback` types. Combining types is possible via bitwise OR, but the eligibility check for `systemExempted` would still apply.

---

## Android Manifest Permissions and `<service>` Declarations

### Takeaway
Apps targeting Android 14 (API 34)+ must declare `android:foregroundServiceType` in the manifest and request the matching normal permission; omitting either causes a runtime exception when `startForeground()` is called.

### Cited Findings
- Apps targeting Android 14 (API 34) or higher **must** declare `android:foregroundServiceType` on every `<service>` element. If no type is declared, `startForeground()` throws `MissingForegroundServiceTypeException`. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- `FOREGROUND_SERVICE` is a baseline normal permission still required for all foreground services at all API levels. — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)
- For `mediaPlayback`: declare `FOREGROUND_SERVICE_MEDIA_PLAYBACK` in addition to `FOREGROUND_SERVICE`. — [Foreground service types | Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
- For `systemExempted`: declare `FOREGROUND_SERVICE_SYSTEM_EXEMPTED` in addition to `FOREGROUND_SERVICE`. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- All type-specific permissions are normal permissions granted at install time; users cannot revoke them individually. Calling `startForeground()` without the matching permission throws `SecurityException`. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- The notification passed to `startForeground()` must use priority `PRIORITY_LOW` or higher; a lower priority causes the system to show a warning in the notification drawer. — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)
- Apps targeting Android 14+ must also declare their foreground service types in Play Console under **Policy > App content**. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)

**Minimal correct manifest for a `mediaPlayback` alarm service:**
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<service
    android:name=".AlarmPlaybackService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />
```

**Minimal correct manifest for a `systemExempted` alarm service (recommended for alarm clock apps):**
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SYSTEM_EXEMPTED" />

<service
    android:name=".AlarmService"
    android:foregroundServiceType="systemExempted"
    android:exported="false" />
```

**Inside the service, call `ServiceCompat.startForeground()` (androidx-core 1.12+):**
```kotlin
ServiceCompat.startForeground(
    this,
    NOTIFICATION_ID, // must not be 0
    notification,
    ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED  // or FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
)
```

### Inferences
- On Android 13 (API 33) and below, `foregroundServiceType` is optional (though still advisable); the permission declarations for specific types are enforced only from API 34 onwards.

### Gaps
- No official documentation covers whether a `<service>` element can combine `systemExempted|mediaPlayback` via a pipe-separated list in the manifest; combining types in `startForeground()` via bitwise OR is documented, but the manifest form is not explicitly confirmed for `systemExempted`.

---

## Android 14 Restrictions on Starting FGS from Background / BroadcastReceiver

### Takeaway
Android 12 introduced the core background FGS start restriction. Android 14 added mandatory service-type declarations but did NOT restrict exact-alarm receivers from starting foreground services. Android 15 added new per-type `BOOT_COMPLETED` restrictions.

### Cited Findings
- **Android 12 (API 31):** Apps targeting API 31+ cannot start a foreground service while running in the background, except for exempted cases. Violation throws `ForegroundServiceStartNotAllowedException`. — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)
- **Exemptions from background start restriction include (Android 12+):**
  - The app receives a `BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, or `MY_PACKAGE_REPLACED` broadcast in a receiver.
  - The app invokes an **exact alarm** to complete a user-requested action.
  - The app is transitioning from a user-visible state (e.g., an Activity is in the foreground).
  - High-priority FCM message, user interaction with bubble/notification/widget, geofencing, NFC, input method, battery optimizations disabled.
  — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)
- **Exact alarm exemption confirmed:** "Android considers exact alarms to be critical, time-sensitive interruptions. For this reason, exact alarms aren't affected by foreground service launch restrictions." — [Schedule alarms | Android Developers](https://developer.android.com/develop/background-work/services/alarms)
- **Android 14 (API 34):** Added mandatory foreground service types. No new restrictions on starting FGS from exact-alarm receivers. Added `microphone` type restriction from `BOOT_COMPLETED` receivers. — [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- **Android 15 (API 35):** `BOOT_COMPLETED` receivers cannot launch foreground services of types: `dataSync`, `camera`, `mediaPlayback`, `phoneCall`, `mediaProjection`, `microphone`. Attempting to do so throws `ForegroundServiceStartNotAllowedException`. `systemExempted` is NOT in this restricted list. — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- **Android 15 new timeouts:** `dataSync` and `mediaProcessing` types have a 6-hour daily limit. After the limit, starting another service of that type throws `ForegroundServiceStartNotAllowedException`. — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- **While-in-use permission restriction (Android 14+):** Even with a valid exemption, starting a foreground service of type `camera`, `location`, `microphone`, or `health` from the background throws `SecurityException` if the app does not currently hold the runtime permission. Does not apply to `mediaPlayback` or `systemExempted`. — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)

### Inferences
- The Android 14 mandatory-type change is the main breaking change for alarm apps targeting API 34: they must add `foregroundServiceType` to the manifest and declare the matching permission, or `startForeground()` will throw at runtime.
- `systemExempted` is not mentioned in the Android 15 `BOOT_COMPLETED` restriction list, suggesting alarm apps using this type can still start from a boot receiver on Android 15+.

### Gaps
- No official source explicitly confirms that `systemExempted` is exempt from the Android 15 `BOOT_COMPLETED` restrictions; the Android 15 docs list the restricted types and `systemExempted` is not among them, which implies it is allowed, but the documentation does not state this affirmatively.

---

## Correct Pattern to Start a FGS from a BroadcastReceiver (Android 12–15)

### Takeaway
An exact alarm receiver is explicitly exempt from background FGS start restrictions on all Android versions through 15; wrap `startForegroundService()` in a try/catch for `ForegroundServiceStartNotAllowedException` and call `startForeground()` promptly inside the service.

### Cited Findings
- The correct two-step start sequence: (1) call `context.startForegroundService(intent)` from the BroadcastReceiver; (2) call `ServiceCompat.startForeground()` inside `Service.onStartCommand()`. — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)
- When the service is started with `startForegroundService()`, it must call `startForeground()` within a short window (comparable to the ANR interval) or the system will stop it. — [Background Work in Android Applications | TechYourChance](https://www.techyourchance.com/background-work-in-android-applications/)
- Passing a foreground service type to `startForeground()` that is not declared in the manifest throws `IllegalArgumentException`. — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)
- Official catch pattern for API 31+:
  ```kotlin
  try {
      ContextCompat.startForegroundService(context, intent)
  } catch (e: ForegroundServiceStartNotAllowedException) {
      // App not in valid state to start FGS; defer or notify user
  }
  ```
  — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)
- The crash can also occur inside the service's `startForeground()` call itself (not just the outer `startForegroundService()` call); catching only the outer call may miss this. A community report describes catching the exception inside the service as well. — [GitHub issue: Crash: ForegroundServiceStartNotAllowedException](https://github.com/hexmasternl/pillsner/issues/88)
- For `BOOT_COMPLETED` receivers: explicitly listed as an exemption for starting a foreground service from the background (on Android 12+). However, on Android 15+ certain types (`mediaPlayback` among them) are now blocked. — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start); [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- For an exact alarm receiver: the system treats exact alarm broadcasts as time-sensitive interruptions exempt from background start restrictions. A `startForegroundService()` call from within an exact alarm `BroadcastReceiver.onReceive()` is allowed. — [Schedule alarms | Android Developers](https://developer.android.com/develop/background-work/services/alarms); [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)

**Recommended pattern for an alarm app's `BroadcastReceiver.onReceive()`:**
```kotlin
override fun onReceive(context: Context, intent: Intent) {
    val serviceIntent = Intent(context, AlarmService::class.java).apply {
        putExtra("alarm_id", intent.getIntExtra("alarm_id", -1))
    }
    try {
        ContextCompat.startForegroundService(context, serviceIntent)
    } catch (e: Exception) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            e is ForegroundServiceStartNotAllowedException) {
            // Fallback: schedule a deferred notification or WorkManager task
        }
    }
}
```

### Inferences
- Full-screen intent alarms (the classic "alarm screen appears while device is locked") require both an ongoing foreground service and a `USE_FULL_SCREEN_INTENT` notification. On Android 14, only calling and alarm apps can hold `USE_FULL_SCREEN_INTENT` by default; others require the user to grant it via `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT`. — [Full-Screen Intent (FSI) Notifications in Android 14 & 15 | ProAndroidDev (access blocked, inferred from search snippets)](https://proandroiddev.com/full-screen-intent-fsi-notifications-in-android-14-15-what-changed-why-its-breaking-and-e5e862a75936)

### Gaps
- The documentation does not specify the exact window (in milliseconds) between `startForegroundService()` and the required `startForeground()` call; it is commonly stated as 5 seconds but this is not confirmed in the official pages reviewed.

---

## BOOT_COMPLETED and Starting a `mediaPlayback` Foreground Service on Android 14+

### Takeaway
On Android 14, `BOOT_COMPLETED` receivers are exempt from the general background FGS start restriction (and `mediaPlayback` is allowed); on Android 15+, `mediaPlayback` is explicitly blocked from `BOOT_COMPLETED` receivers. Alarm apps using `systemExempted` are not restricted.

### Cited Findings
- **Android 14 (API 34):** BOOT_COMPLETED receivers are listed as an exemption from background FGS start restrictions. Only the `microphone` type was restricted from BOOT_COMPLETED in Android 14. — [Restrictions on starting a foreground service from the background | Android Developers](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start); [Foreground service types are required | Android 14 | Android Developers](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- **Android 15 (API 35):** `BOOT_COMPLETED` receivers are explicitly blocked from launching `mediaPlayback`, `dataSync`, `camera`, `phoneCall`, `mediaProjection`, and `microphone` foreground service types. Violation throws `ForegroundServiceStartNotAllowedException`. — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- **`systemExempted` is NOT in the Android 15 BOOT_COMPLETED blocked list.** An alarm app using `systemExempted` should be able to start from `BOOT_COMPLETED` on Android 15+. — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- **BOOT_COMPLETED for rescheduling alarms (correct pattern):** Alarm apps should use the BOOT_COMPLETED receiver to reschedule exact alarms (calling AlarmManager again), NOT to start a foreground service for audio playback. The alarm itself will fire from AlarmManager later and that BroadcastReceiver will start the playback service. — [Schedule alarms | Android Developers](https://developer.android.com/develop/background-work/services/alarms)
- Testing BOOT_COMPLETED restrictions without rebooting (Android 15 device):
  ```bash
  adb shell am compat enable FGS_BOOT_COMPLETED_RESTRICTIONS your-package-name
  adb shell am broadcast -a android.intent.action.BOOT_COMPLETED your-package-name
  ```
  — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- `RECEIVE_BOOT_COMPLETED` permission is required to receive the BOOT_COMPLETED broadcast. The broadcast is only received after the user has launched the app at least once (due to stopped-state restrictions). — [Schedule alarms | Android Developers](https://developer.android.com/develop/background-work/services/alarms)

### Inferences
- The correct architecture separates concerns: BOOT_COMPLETED receiver reschedules alarms only (no FGS); the alarm's own BroadcastReceiver (fired by exact AlarmManager) starts the `systemExempted` foreground service to play audio. This avoids all BOOT_COMPLETED FGS restrictions.

### Gaps
- No official source explicitly states that `systemExempted` is permitted from BOOT_COMPLETED on Android 15. The inference is based on its absence from the restriction list.

---

## Role of NotificationManager for the Ongoing FGS Notification

### Takeaway
The notification ID passed to `startForeground()` shares the same namespace as `NotificationManager.notify()`; the foreground service manages its own notification posting, and `NotificationManager.notify()` with the same ID is the correct way to update it after the service is running.

### Cited Findings
- The ID passed to `startForeground()` is "the identifier for this notification as per `NotificationManager.notify`; must not be 0." — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch); [what is the role of NotificationManager | GuruBase.io (secondary source)](https://gurubase.io/g/android/role-of-notificationmanager-in-android-notifications)
- Calling `startForeground()` posts the notification automatically; there is no need to also call `NotificationManager.notify()` to initially display it. — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)
- To **update** the foreground notification (e.g., update a "snooze" button or elapsed time), call `notificationManager.notify(SAME_ID, updatedNotification)` with the same ID used in `startForeground()`. — [what is the role of NotificationManager | GuruBase.io (secondary source)](https://gurubase.io/g/android/role-of-notificationmanager-in-android-notifications)
- An AOSP commit shows the framework cancels the old foreground notification when a service switches to a different notification ID; if other foreground services share the ID, the cancel is skipped. — [AOSP commit | android.googlesource.com](https://android.googlesource.com/platform/frameworks/base/+/0ba4c71%5E!/)
- `RemoteServiceException: Bad notification for startForeground` on Android 8+ typically indicates the notification's channel ID does not match a registered `NotificationChannel`. The channel must be created with `NotificationManager.createNotificationChannel()` before posting. — [android.app.RemoteServiceException: Bad notification for startForeground | windows-hexerror.linestarve.com](https://windows-hexerror.linestarve.com/q/so60529974-androidappremoteserviceexception-bad-notification-for-startforeground)
- Notification priority must be `PRIORITY_LOW` or higher (`NotificationCompat.PRIORITY_LOW` or `NotificationCompat.PRIORITY_DEFAULT`). — [Launch a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/launch)

### Inferences
- For an alarm, the notification should include action buttons (e.g., "Dismiss", "Snooze") as `PendingIntent` actions on the `NotificationCompat.Builder`. The service can update the notification via `NotificationManager.notify()` to reflect state changes (e.g., countdown, snooze).

### Gaps
- No official source covers whether `NotificationManager.cancel(SAME_ID)` can be used independently to remove the foreground notification, or whether `stopForeground(STOP_FOREGROUND_REMOVE)` must be used. The service docs say stopping the service removes its notification, and `stopForeground(STOP_FOREGROUND_REMOVE)` removes it while keeping the service running.

---

## Stopping the Foreground Service and Releasing MediaPlayer Resources

### Takeaway
The service should stop itself by calling `stopSelf()` (which removes the ongoing notification); MediaPlayer must be stopped, released, and nulled in `onDestroy()` to avoid resource leaks.

### Cited Findings
- To stop a foreground service completely: call `stopSelf()` from inside the service or `stopService()` from outside. This removes the ongoing notification. — [Stop a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/stop-fgs)
- To demote a service from foreground (keep running but remove notification): call `stopForeground(Service.STOP_FOREGROUND_REMOVE)`. With `STOP_FOREGROUND_DETACH`, the notification remains visible but is no longer tied to the service lifecycle. — [Stop a foreground service | Android Developers](https://developer.android.com/develop/background-work/services/fgs/stop-fgs)
- The system calls `Service.onTimeout(int, int)` when a time-limited type (`shortService`, `dataSync`, `mediaProcessing`) exceeds its quota, giving a brief window to call `stopSelf()`. `systemExempted` and `mediaPlayback` do not have this timeout mechanism documented. — [Behavior changes: Apps targeting Android 15 | Android Developers](https://developer.android.com/about/versions/15/behavior-changes-15)
- For `shortService` specifically: if the service does not stop after `onTimeout()`, an ANR follows with a message referencing `FOREGROUND_SERVICE_TYPE_SHORT_SERVICE`. — [Foreground service types | Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)
- **MediaPlayer overlap bug pattern:** When a second alarm starts before the first is dismissed, the foreground service may replace its MediaPlayer reference without stopping the previous instance. The fix is to always call `mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null` before assigning a new instance. — [GitHub issue: fix(android): release playback when alarms overlap | warm_alarm](https://github.com/AndrewDongminYoo/warm_alarm/issues/71)
- `stopSelf()` ordering: A VLC Android commit notes that `stopSelf()` can destroy the service before `startForeground()` returns in some edge cases, causing a `RemoteException`. Their mitigation was to use `stopService()` instead of `stopSelf()` in that specific flow. (Secondary source; verify if this applies to your pattern.) — [android mailing list (secondary source)](https://mailman.videolan.org/pipermail/android/2020-January/017676.html)

**Recommended service stop pattern for an alarm:**
```kotlin
// Call this when the alarm is dismissed or max duration is reached
private fun stopAlarm() {
    mediaPlayer?.let { player ->
        if (player.isPlaying) player.stop()
        player.release()
    }
    mediaPlayer = null
    stopForeground(Service.STOP_FOREGROUND_REMOVE) // removes notification
    stopSelf()
}

override fun onDestroy() {
    super.onDestroy()
    // Safety net: release if stopAlarm() was not called
    mediaPlayer?.let { player ->
        if (player.isPlaying) player.stop()
        player.release()
    }
    mediaPlayer = null
}
```

### Inferences
- For a max ringing duration, a `Handler.postDelayed()` or a scheduled `AlarmManager` callback inside the service can call `stopAlarm()` after the desired timeout (e.g., 5 minutes), preventing the phone from ringing indefinitely if the user doesn't respond.
- The foreground service notification should include a "Dismiss" action whose PendingIntent sends a `stopSelf()` command to the service (e.g., via a separate intent action handled in `onStartCommand()`).

### Gaps
- The official Android documentation does not provide a canonical MediaPlayer lifecycle pattern for foreground services. The patterns described above are inferred from the Android MediaPlayer state machine documentation and community best practices.
- No official guidance on AudioTrack-based alarm playback from a foreground service was found; the patterns described apply to MediaPlayer.
