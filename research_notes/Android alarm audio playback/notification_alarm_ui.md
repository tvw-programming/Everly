# Android Alarm Notification UI Patterns (API 31–35)

Scope: Android 12–15 (API 31–35), personal APK installed via sideload (not Play Store).

---

## USE_FULL_SCREEN_INTENT in Android 14 (API 34)

### Takeaway
Android 14 turned USE_FULL_SCREEN_INTENT into a special app access permission that is auto-revoked by the Google Play Store for apps without calling or alarm functionality; sideloaded APKs declaring the permission in their manifest are likely granted it by default at install without a runtime dialog.

### Cited Findings
- Before Android 14, any app could declare `USE_FULL_SCREEN_INTENT` in the manifest and receive it automatically at install. Starting with apps targeting API 34, the permission is restricted to apps that provide calling and alarm functionality. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14)
- The Google Play Store revokes the default `USE_FULL_SCREEN_INTENT` permission at install for apps that do not provide calling or alarm functionality. The stated deadline for Play enforcement was May 31, 2024. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14)
- Apps installed before a device updates to Android 14 keep the permission enabled. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14)
- On Android 14, the default state at install is still "enabled" — it is the Play Store install mechanism (not the OS) that revokes it for non-alarm apps. Third-party app stores (and presumably direct APK installs) must set the initial FSI grant state themselves via `PackageInstaller.SessionParams`, using DEFAULT, DENIED, or GRANTED states. — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- OEMs must define which apps qualify for FSI permissions. — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- Apps can check at runtime via `NotificationManager.canUseFullScreenIntent()`. If permission is missing, they can direct users to `Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` (the "Special App Access → Use full screen intents" screen). There is no system-prompted runtime dialog — the user must navigate there manually. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14); [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- Users can toggle this permission on and off at any time in settings. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14)
- On Android 13 and lower, USE_FULL_SCREEN_INTENT is enabled by default for all apps that declare it in their manifest, with no restrictions. — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)

### Inferences
- A sideloaded APK that declares `USE_FULL_SCREEN_INTENT` and is installed on Android 14 is likely granted the permission at install time, because the Play Store revocation mechanism does not apply. The OS default is ENABLED; only the Play Store installer actively revokes it. The app should still call `canUseFullScreenIntent()` defensively to confirm.
- For a personal alarm APK installed via ADB or file manager, no runtime permission dialog will appear. The permission is simply granted (or not) by the install mechanism; checking `canUseFullScreenIntent()` on first run is the right pattern.

### Gaps
- No official source directly confirms the behavior of a direct APK sideload (not through any store) on Android 14 — the AOSP docs address third-party stores via `SessionParams` but not manual installs. Real-device testing is required to confirm.

---

## Full-Screen Intent Activity vs. HUD-Style Notification

### Takeaway
A full-screen intent is the Android-recommended pattern for alarm UIs: on a locked/off screen it launches an activity directly; on an unlocked screen the system automatically falls back to a heads-up notification. For a personal APK, the full-screen intent approach is strongly preferred over a standalone heads-up notification.

### Cited Findings
- **Full-screen intent behavior by device state:** When the permission is **granted**: on an unlocked screen, a persistent heads-up notification with action buttons (pill buttons) appears; on a locked screen, a dimmed screen, or with AOD, the FSI activity launches directly. When the permission is **denied**: a heads-up notification appears for 60 seconds only; on a locked screen, it appears listed first (but does not take over the screen). — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- The system may show a heads-up notification instead of launching the full-screen intent when the user is actively using the device. From Android 13 (TIRAMISU), the system UI displays a heads-up notification instead of launching the intent while the device is in use, with emphasized action buttons. — [Ditch the notification and show an activity on your Android lock screen – dev.to](https://dev.to/victorbrndls/how-to-show-an-activity-on-lock-screen-instead-of-a-notification-34dk)
- The notification must be posted to a channel with `NotificationManager.IMPORTANCE_HIGH` or higher for the full-screen intent to be eligible to launch. — [Android time-sensitive notifications – developer.android.com](https://developer.android.com/develop/ui/views/notifications/time-sensitive)
- For time-sensitive ongoing notifications (active alarm, phone call), Android recommends associating the notification with a foreground service using `startForeground(notificationId, notification)`. — [Android time-sensitive notifications – developer.android.com](https://developer.android.com/develop/ui/views/notifications/time-sensitive)
- Apps targeting Android 10 (API 29)+ must declare `USE_FULL_SCREEN_INTENT` in the manifest to use `setFullScreenIntent()`. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)
- A pure heads-up notification (without FSI) is NOT a reliable alarm UI pattern on its own: without the FSI permission, the notification only persists for 60 seconds, and it does not wake or take over the screen. — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- OEM settings can block full-screen intents on some devices even when the permission is granted. This is a known real-world issue. — [FSI blog – proandroiddev.com](https://proandroiddev.com/full-screen-intent-fsi-notifications-in-android-14-15-what-changed-why-its-breaking-and-e5e862a75936)

### Inferences
- The recommended pattern for a personal alarm APK is: declare `USE_FULL_SCREEN_INTENT`, post the notification with a full-screen intent and a channel of `IMPORTANCE_HIGH`. The system handles the UI decision (activity vs. heads-up) automatically based on device state. There is no need to duplicate this with a separate heads-up notification flow.
- Since the sideloaded APK will likely have the permission granted, the FSI approach offers the best reliability across locked/unlocked/screen-off states.

### Gaps
- No official guidance from Google specifically addressing the "personal APK" scenario.
- OEM variability (Samsung, MIUI, etc.) is documented anecdotally but not comprehensively quantified.

---

## Notification Action Buttons (Stop / Snooze / Done)

### Takeaway
Action buttons use `addAction()` with a `PendingIntent`. For actions that should work in the background (Stop, Snooze), a `PendingIntent.getBroadcast()` pointing to a `BroadcastReceiver` is the correct and recommended pattern. Use `FLAG_IMMUTABLE` on Android 12+.

### Cited Findings
- A notification can have **up to three** action buttons. They must not duplicate the tap action. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification#Actions)
- The official Android recommendation for action buttons that should perform background work (like snoozeing an alarm) without interrupting the running app: use `addAction()` with a `PendingIntent` pointing to a `BroadcastReceiver`. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification#Actions)
- Canonical implementation:
  ```kotlin
  val snoozeIntent = Intent(context, MyBroadcastReceiver::class.java).apply {
      action = ACTION_SNOOZE
      putExtra(EXTRA_NOTIFICATION_ID, 0)
  }
  val snoozePendingIntent: PendingIntent =
      PendingIntent.getBroadcast(context, 0, snoozeIntent, PendingIntent.FLAG_IMMUTABLE)
  builder.addAction(R.drawable.snooze, getString(R.string.snooze), snoozePendingIntent)
  ```
  — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification#Actions)
- On Android 12 (API 31) and higher, apps must specify `FLAG_IMMUTABLE` or `FLAG_MUTABLE` when creating a `PendingIntent`, or creation throws an `IllegalArgumentException`. Use `FLAG_IMMUTABLE` for all alarm action buttons (Stop/Snooze/Done). `FLAG_MUTABLE` is only needed when the system must modify the intent, as with direct-reply text input. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification#Actions)
- **Pitfall on Android 10+:** Starting an Activity directly from a notification action button's `PendingIntent.getActivity()` when the app is in the background can silently fail, because background activity launches are restricted starting Android 10 (API 29). The solution is to use `PendingIntent.getBroadcast()` for the action, then start the activity from the BroadcastReceiver (which runs in the foreground context of the OS). — [ProAndroidDev – notification with alarm manager](https://proandroiddev.com/everything-you-need-to-know-about-adding-notifications-with-alarm-manager-in-android-cb94a92b3235)
- On Android 10 (API 29) and later, the platform can generate action buttons automatically if the app provides none. Apps can opt out with `setAllowSystemGeneratedContextualActions(false)`. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification#Actions)
- Each action button `PendingIntent` needs a unique request code if multiple actions are registered for the same BroadcastReceiver, otherwise earlier `PendingIntent` entries are overwritten. — [ProAndroidDev – notification with alarm manager](https://proandroiddev.com/everything-you-need-to-know-about-adding-notifications-with-alarm-manager-in-android-cb94a92b3235)

### Inferences
- For Stop/Snooze/Done on an alarm notification: use `PendingIntent.getBroadcast()` → `BroadcastReceiver` for each action. The receiver handles the logic (cancel alarm audio, reschedule, etc.) and can then navigate to the alarm screen or cancel the notification. This is more reliable than `PendingIntent.getActivity()` from an action button in all Android versions.
- The BroadcastReceiver must be registered in the manifest (not dynamically) to receive the PendingIntent when the app process is dead.

### Gaps
- No source confirmed the exact behavior of `PendingIntent.getActivity()` from a notification action button on Android 12–14 (whether the background activity launch restriction applies to notification action intents specifically or only to foreground activity launches).

---

## "Tap Notification → Open Active Alarm Screen" Pattern (App Killed)

### Takeaway
Use `setContentIntent()` with `PendingIntent.getActivity()` pointing to the alarm screen activity with `FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK`. The OS recreates the app process when the PendingIntent fires, so this works reliably even when the app is killed. For the full-screen intent path, the FSI `PendingIntent` also uses `getActivity()` and is recreated the same way.

### Cited Findings
- The canonical pattern for a notification tap that opens an activity, even after process death:
  ```kotlin
  val intent = Intent(context, AlertDetails::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
  }
  val pendingIntent: PendingIntent =
      PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
  builder.setContentIntent(pendingIntent)
  builder.setAutoCancel(true)
  ```
  — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)
- `FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TASK`: used when the notification-response activity is dedicated (i.e., not part of the normal app back stack). This starts the activity in a new task, clearing any existing task, so the user gets a clean alarm screen. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)
- The OS recreates the app process to deliver a PendingIntent even after the user swiped away the app. The process comes back from scratch (calls `onCreate()`), and any saved state in the Bundle is used to restore UI. — [Qt forum – notification of android app being resumed in a new process after closure](https://forum.qt.io/topic/142447/notification-of-android-app-being-resumed-in-a-new-process-after-closure-by-user)
- When an alarm set with `AlarmManager.setExactAndAllowWhileIdle()` fires, the OS recreates the process to deliver the PendingIntent, regardless of whether the app was swiped away or killed by the system (not by Force Stop). — [ALARM PERSISTENCE DIRECTIVE – gitea.anomalistdesign.com](https://gitea.anomalistdesign.com/trent_larson/daily-notification-plugin/src/branch/master/doc/platform/android/ALARM_PERSISTENCE_DIRECTIVE.md)
- **Force Stop is different:** A user Force Stop removes all pending alarms and blocks broadcast receivers. A user swipe-away (normal close) does NOT prevent alarms from firing. — [ALARM PERSISTENCE DIRECTIVE – gitea.anomalistdesign.com](https://gitea.anomalistdesign.com/trent_larson/daily-notification-plugin/src/branch/master/doc/platform/android/ALARM_PERSISTENCE_DIRECTIVE.md)
- **Android 15 note:** PendingIntent creators block background activity launches by default for apps targeting API 35. For notification content intents, the `PendingIntent` is the "sender" with user interaction context, so this restriction should not apply to notification taps; it applies to PendingIntents fired programmatically from background code. — [Android 15 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-15)
- The full-screen intent also uses `PendingIntent.getActivity()` and is subject to the same OS process-recreation behavior. The FSI fires from the notification channel, which provides user-interaction context that exempts it from background activity launch restrictions. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)

### Inferences
- Combining `setContentIntent()` for tap-to-open with `setFullScreenIntent()` for lock-screen takeover covers both scenarios in one notification. The activity started by either intent benefits from the OS recreating the process, so there is no need to keep the app alive.
- The alarm-screen activity must be designed to function as a standalone entry point (not relying on preceding app state), because it may launch into a freshly created process.

### Gaps
- The exact behavior of `setContentIntent` taps on Android 15 when `PendingIntent` creator blocks background activity launches has not been officially clarified for notification-originated PendingIntents specifically.

---

## setOngoing, setCategory(ALARM), setPriority(MAX)

### Takeaway
`setOngoing(true)` makes the notification non-dismissable; `setCategory(CATEGORY_ALARM)` signals alarm semantics to the system (affects DND policy); `setPriority(PRIORITY_MAX)` / `PRIORITY_HIGH` is only meaningful on Android 7.1 and below — on Android 8.0+, channel importance governs notification intrusiveness. Use `IMPORTANCE_HIGH` on the `NotificationChannel`.

### Cited Findings
- **`setOngoing(true)`:** Makes the notification non-dismissable by the user. The application or service must cancel it explicitly. On Android 13 (API 33) and above, foreground service notifications became user-dismissable by default (even with `setOngoing(true)`) — the user can swipe them away. However, the service itself is not stopped by the swipe; only the notification is removed from the shade. — [Foreground services – developer.android.com](https://developer.android.com/guide/components/foreground-services)
- **`setCategory(CATEGORY_ALARM)`:** Signals to the system that this is an alarm notification. The Android `ZenPolicy` API governs whether alarms play sounds and visually appear during Do Not Disturb (DND). When the user's DND policy disallows alarms, the alarm audio stream is muted during DND. `CATEGORY_ALARM` is what connects the notification to the alarm stream rule in `ZenPolicy`. — [ZenPolicy – developer.android.com](https://developer.android.com/reference/kotlin/android/service/notification/ZenPolicy)
- **`setPriority(PRIORITY_MAX)` / `PRIORITY_HIGH`:** On Android 8.0 (API 26) and later, priority is superseded by channel importance. The channel's `IMPORTANCE_HIGH` setting is what causes heads-up behavior on modern Android. The `setPriority` value is only used on Android 7.1 (API 25) and below. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)
- `NotificationCompat.PRIORITY_MAX` is the maximum priority for pre-Oreo compatibility, roughly equivalent to `IMPORTANCE_HIGH` on a channel. — [NotificationCompat.Builder – developer.android.com](https://developer.android.com/reference/android/support/v4/app/NotificationCompat.Builder)
- **`setCategory(CATEGORY_MESSAGE)` example from official docs:** The official Android notification guide uses `CATEGORY_MESSAGE` as an example of metadata that can override Do Not Disturb (for contacts-prioritized DND mode). The same mechanism applies to `CATEGORY_ALARM` under the alarm policy. — [Build a notification – developer.android.com](https://developer.android.com/develop/ui/views/notifications/build-notification)
- **`NotificationChannel.setBypassDnd(true)`:** A channel can request DND bypass. This requires the user to grant notification policy access (`ACCESS_NOTIFICATION_POLICY` permission + user granting the special permission), and is ultimately user-controlled. Not a reliable auto-grant. — [ZenPolicy – developer.android.com](https://developer.android.com/reference/kotlin/android/service/notification/ZenPolicy)
- On Android 13 and higher, foreground service notifications can be dismissed by the user by default (swiping is allowed). An app cannot override this on API 33+, even with `setOngoing(true)`. — [Foreground services – developer.android.com](https://developer.android.com/guide/components/foreground-services)

### Inferences
- The recommended combination for an active alarm notification on Android 12–15:
  - Channel: `IMPORTANCE_HIGH` (required for heads-up / FSI eligibility)
  - `setCategory(NotificationCompat.CATEGORY_ALARM)` — connects to alarm DND stream
  - `setPriority(NotificationCompat.PRIORITY_MAX)` — for Android ≤ 7.1 compatibility
  - `setOngoing(true)` — prevents casual dismissal on Android < 13; accepted but swipeable on Android 13+
  - `setFullScreenIntent(pendingIntent, true)` — enables lock-screen takeover
- On Android 13+, if the alarm notification must not be dismissable, associate it with a foreground service (`startForeground(id, notification)`). The foreground service notification has a sticky behavior the user cannot override (unlike a plain ongoing notification).

### Gaps
- No official source confirmed the exact interaction between `setOngoing(true)` and `CATEGORY_ALARM` on Android 13+ for non-foreground-service notifications. Real-device testing is recommended.

---

## Android 15 Notification and FSI Changes

### Takeaway
Android 15 does not introduce new restrictions specific to alarm/FSI notifications. The meaningful changes are: apps targeting API 35 can no longer modify global DND state directly; PendingIntents created by apps block background activity launches by default; and OTP/screenshare notification content redaction applies to all apps. Full-screen intent permission rules from Android 14 carry forward unchanged.

### Cited Findings
- **Do Not Disturb:** Apps targeting Android 15 (API 35) can no longer call `setInterruptionFilter` or `setNotificationPolicy` to change the global DND state. They must contribute an `AutomaticZenRule` instead. — [Android 15 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-15)
- **PendingIntent background activity launch blocking:** For apps targeting API 35, `PendingIntent` creators block background activity launches by default. This is primarily a security measure to prevent apps from accidentally allowing background activity launches via PendingIntents. — [Android 15 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-15)
- **OTP notification redaction:** Android 15 redacts OTP content from `NotificationListenerService` for untrusted apps and from screen share. — [Android 15 Behavior Changes: All Apps – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-all)
- **Compact heads-up notifications:** Android 15 beta code included a smaller heads-up notification layout (hiding text/images until expanded). This was a beta feature; production status is uncertain. — [Android Authority – compact heads-up notifications](https://androidauthority.com/android-15-compact-heads-up-notifications-3468061)
- **No new alarm-specific changes:** The Android 15 behavior-changes pages reviewed contain no new restrictions or requirements specific to alarm apps, full-screen intents, or `USE_FULL_SCREEN_INTENT` beyond what was introduced in Android 14. — [Android 15 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-15); [Android 15 Behavior Changes: All Apps – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-all)
- **SYSTEM_ALERT_WINDOW + foreground service:** Apps targeting Android 15 that hold `SYSTEM_ALERT_WINDOW` can no longer start a foreground service from the background unless a visible overlay window is present. This edge case affects alarm apps that use overlay windows. — [Android 15 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/15/behavior-changes-15)

### Inferences
- For an alarm app targeting API 34 (not 35), none of the Android 15 targeting changes apply. The DND `AutomaticZenRule` requirement only kicks in when targeting API 35.
- The PendingIntent background activity launch blocking (API 35) should not affect notification taps or FSI launches, since those originate from user interaction with the notification shade (which provides a user-interaction context token), but this has not been explicitly confirmed in official docs.

### Gaps
- No official confirmation whether compact heads-up notifications shipped in the Android 15 final release or remained experimental.
- No Android 16 changes have been reviewed (out of scope).

---

## Sideloaded APK: Permissions Without Runtime Prompts

### Takeaway
For a personal APK installed via sideload (ADB or file manager, not Play Store), `USE_FULL_SCREEN_INTENT` declared in the manifest is likely granted at install without any runtime dialog on Android 14. Other alarm-relevant permissions (`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`) still require runtime prompts or user-settable special permissions on API 33+.

### Cited Findings
- **`USE_FULL_SCREEN_INTENT`:** On Android 14, the OS default at install is ENABLED. The Google Play Store is what revokes it for non-alarm apps. Sideloaded installs bypass the Play Store revocation step. Third-party stores use `PackageInstaller.SessionParams` to set the initial FSI grant state; a raw APK install presumably receives the OS default (ENABLED). — [Full-screen intent limits – source.android.com](https://source.android.com/docs/core/permissions/fsi-limits)
- **`POST_NOTIFICATIONS` (Android 13+, API 33):** This is a runtime permission requiring explicit user approval via the system dialog. Declaring it in the manifest alone is not sufficient; the app must call `requestPermissions()` and handle the result. No special sideload behavior applies. — [Android time-sensitive notifications – developer.android.com](https://developer.android.com/develop/ui/views/notifications/time-sensitive)
- **`SCHEDULE_EXACT_ALARM` (Android 12+, API 31):** This is a special app access permission. On Android 12, it is granted by default at install. On Android 13+, apps must check `AlarmManager.canScheduleExactAlarms()` and request the permission via `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` if needed. — No direct source found; based on well-established Android developer documentation pattern.
- **Normal/dangerous permissions:** Regular manifest permissions (e.g., `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`) are granted at install time without prompts, regardless of install source. — [Android permissions overview – developer.android.com](https://developer.android.com/guide/topics/permissions/overview)
- **Play Store policy vs. OS policy:** The Play Store's revocation of `USE_FULL_SCREEN_INTENT` for non-alarm apps is a store-level enforcement, not an OS-level enforcement. The OS itself does not differentiate app categories; only the installer can reclassify the initial grant. — [Android 14 Behavior Changes – developer.android.com](https://developer.android.com/about/versions/14/behavior-changes-14)

### Inferences
- For a personal alarm APK sideloaded on Android 14+:
  - `USE_FULL_SCREEN_INTENT`: Declare in manifest → likely auto-granted. Call `canUseFullScreenIntent()` on first run and guide user to settings if denied.
  - `POST_NOTIFICATIONS`: Must request at runtime via the standard permission dialog.
  - `SCHEDULE_EXACT_ALARM`: May need runtime check and user redirect to Special App Access.
  - `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `VIBRATE`, `USE_EXACT_ALARM`: All install-time grants, no prompts.

### Gaps
- No source directly tested a sideloaded APK install on a stock Android 14 device and confirmed the `USE_FULL_SCREEN_INTENT` initial grant state. This should be verified on a real device.
- `USE_EXACT_ALARM` (vs `SCHEDULE_EXACT_ALARM`) behavior for sideloaded apps on API 33–35 not confirmed in search results.
