# React Native / Expo Bare-Workflow: Native Android Alarm + Audio Integration

## Key Question 1: Recommended Android alarm scheduling package (2025)

### Takeaway
No single package dominates in 2025. Notifee (by Invertase) was the most capable option through December 2024, but it has been archived. Its community fork `react-native-notify-kit` and — for Expo projects — `expo-notifications` are now the recommended paths. Truly native exact-alarm scheduling likely requires writing a thin custom native module.

### Cited Findings
- **Notifee (@notifee/react-native):** Last official release was v9.1.8 on 2024-12-20, which fixed a bug causing Android headless tasks to be invoked twice. — [Notifee Release Notes](https://docs.page/invertase/notifee/react-native/release-notes)
- **Notifee archival (unverified):** Secondary sources claim Invertase archived the original repository on April 7, 2026. The last release is described as v9.1.8 from December 2024. Cannot confirm from the official Invertase page, so treat as secondhand. — [awesome.ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fmarcocrupi%2Freact-native-notify-kit); [Snyk Advisor](https://snyk.io/advisor/npm-package/@notifee/react-native)
- **Community fork — react-native-notify-kit:** Maintained by Marco Crupi; keeps Notifee's API surface, targets React Native 0.73+, adds New Architecture support, FCM mode, and an Expo config plugin. Notifee's own archived README reportedly points to this fork and to expo-notifications. — [react-native-notify-kit docs](https://docs.page/marcocrupi/react-native-notify-kit/react-native/overview)
- **react-native-alarm-manager (baekgol):** 42 stars on GitHub, compiled against Android SDK Platform 29, no mention of `SCHEDULE_EXACT_ALARM`, and setup requires manual `AndroidManifest.xml` and `MainActivity.java` edits. No documented last release date. Very low community adoption. — [GitHub: baekgol/react-native-alarm-manager](https://github.com/baekgol/react-native-alarm-manager)
- **react-native-alarm-module (jd1378):** README explicitly says "NO LONGER GETTING UPDATES, Do not use." Also notes alarms do not survive device reboots. — [GitHub: jd1378/react-native-alarm-module](https://github.com/jd1378/react-native-alarm-module)
- **react-native-alarm-notification (BalancAir):** Older, Android-only, requires manual manifest edits, no iOS support. — [GitHub: BalancAir/react-native-alarm-notification](https://github.com/BalancAir/react-native-alarm-notification)
- **expo-alarm-module:** Community package (not official Expo SDK) for the Expo bare workflow. Android-only. Tested on RN 0.64–0.73 — compatibility with RN 0.76+ / SDK 51+ is unverified. Requires manual `AndroidManifest.xml` entries for exact alarm, boot-completed, foreground service, and wake-lock permissions even with the config plugin. — [npm: expo-alarm-module](https://npmjs.com/package/expo-alarm-module)
- **expo-notifications:** Official Expo package. Supports scheduled (trigger-based) notifications and restores them after reboot (requires RECEIVE_BOOT_COMPLETED). Default channel may truncate long alarm audio; does not set `USAGE_ALARM` audio attribute by default. — [npm: expo-notifications](https://npmjs.com/package/expo-notifications)
- **SCHEDULE_EXACT_ALARM permission change:** Android 12 (API 31) introduced this permission; it was auto-granted at install. Android 13 (API 33+) does NOT pre-grant it on fresh installs. Apps must check `canScheduleExactAlarms()` at runtime since users can revoke it. Alternatively, `USE_EXACT_ALARM` may be declared for apps with genuine alarm/clock/calendar use cases. — [Android Developer Docs: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)

### Inferences
- For a personal Expo bare-workflow alarm app targeting 2025, the most viable path is: **notifee/react-native-notify-kit** for scheduling and notification display, plus a custom thin Kotlin/Java `BroadcastReceiver` registered with `AlarmManager.setExactAndAllowWhileIdle` for reliable wakeups.
- expo-notifications is a simpler integration but will require custom native channel code to achieve true USAGE_ALARM audio behavior.

### Gaps
- GitHub star count and last-commit date for `react-native-alarm-manager` could not be precisely confirmed from the fetched page.
- Whether `react-native-notify-kit` supports `SCHEDULE_EXACT_ALARM` permission management could not be confirmed; the docs page was not fully fetched.
- No React Native package with >1 k stars and active 2025 maintenance was found that covers all of: exact alarm scheduling + full-screen intent + custom audio channel.

---

## Key Question 2: Expo bare workflow vs. managed — config plugin patterns for AndroidManifest

### Takeaway
Expo bare workflow gives full access to the `android/` folder; config plugins (run via `npx expo prebuild`) are the idiomatic way to add permissions, services, and receivers to `AndroidManifest.xml` without hand-editing generated files. The managed workflow cannot run arbitrary native alarm code without EAS.

### Cited Findings
- **Bare vs. managed difference:** In the managed workflow, Expo manages the native build entirely; there is no `android/` or `ios/` folder to edit. In the bare workflow, `npx expo prebuild` generates the native project and config plugins apply their changes to it, after which the developer owns and can edit the native files. — [Expo Docs: Config Plugin and Native Module Tutorial](https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/)
- **`withAndroidManifest` mod:** Expo's config plugins provide `withAndroidManifest` to read and modify `AndroidManifest.xml` during prebuild. `AndroidConfig` helpers can add metadata, permissions, services, and receivers. — [Expo Docs: Config Plugin Mods](https://docs.expo.dev/config-plugins/mods.md)
- **Pattern for adding permissions:** Export a function from a plugin file, call `withAndroidManifest(config, cfg => { … })`, push a new `<uses-permission>` node into `cfg.modResults.manifest`, and return. Register the plugin in `app.config.ts`'s `plugins` array. Run `npx expo prebuild --clean` to apply. — [GeekyAnts Blog (Jan 2024)](https://geekyants.com/en-ae/blog/unlocking-expos-power-a-guide-to-config-plugins-and-mods)
- **Service and receiver entries:** The same `withAndroidManifest` approach applies to adding `<service>`, `<receiver>`, and `<intent-filter>` nodes needed for a foreground service and a boot-completed receiver.
- **expo-alarm-module config plugin:** Even with the config plugin installed and added to the `plugins` array, you must still manually add exact-alarm, boot-completed, foreground-service, and wake-lock permissions to `AndroidManifest.xml` (per its README — this suggests the plugin is incomplete). — [npm: expo-alarm-module](https://npmjs.com/package/expo-alarm-module)
- **`withDangerousMod`:** For changes beyond `AndroidManifest.xml` (e.g., modifying `build.gradle`), Expo provides `withDangerousMod`. Used when you need to add dependencies or custom Gradle config. — [Expo Docs: Config Plugin Mods](https://docs.expo.dev/config-plugins/mods.md)

### Inferences
- Writing a custom Expo config plugin that adds all required `AndroidManifest.xml` entries (permissions, receiver, service) is the correct pattern. It keeps prebuild repeatable and avoids hand-edits that `prebuild --clean` would overwrite.
- Libraries like notifee and react-native-background-actions ship their own config plugins that handle manifest changes, reducing the manual work.

### Gaps
- The exact `withAndroidManifest` code to declare a `<receiver>` with `BOOT_COMPLETED` and an `<intent-filter>` for `SET_ALARM` was not found in fetched sources — needs to be derived from the Expo docs and React Native native module examples.

---

## Key Question 3: HeadlessJS — can it start a foreground service? Restrictions?

### Takeaway
HeadlessJS on its own cannot reliably start a foreground service from the background on Android 8.0+; you must combine it with a `BroadcastReceiver` that calls `startForegroundService()` and a `HeadlessJsTaskService` subclass that promotes to foreground within 5 seconds. WorkManager is an alternative for deferrable background work but cannot schedule exact-time alarms.

### Cited Findings
- **What HeadlessJS is:** An async JS function registered with `AppRegistry.registerHeadlessTask`. It runs in a native Android service (`HeadlessJsTaskService` subclass). Must not touch UI (will throw if it tries). — [React Native Docs: Headless JS (0.79)](https://reactnative.dev/docs/0.79/headless-js-android)
- **Foreground-app crash by default:** If a HeadlessJS task starts while the app is in the foreground, it crashes unless the 4th constructor argument of `HeadlessJsTaskConfig` is `true`. The docs recommend checking `isAppOnForeground()` before starting the service. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)
- **Android 8.0+ service limit:** From Android 8.0 (API 26), the OS limits background services. WorkManager cannot start a background service directly; the recommended path is a foreground service (started with `startForegroundService()`), which requires a visible ongoing notification. — [LogRocket: Run RN Background Tasks with HeadlessJS](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)
- **5-second rule:** After `startForegroundService()` is called, the service must call `startForeground()` (with a notification) within 5 seconds or the system ANRs it. — [LogRocket Blog](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)
- **Wake lock requirement:** If the service is started from a `BroadcastReceiver`, call `HeadlessJsTaskService.acquireWakeLockNow(context)` before returning from `onReceive()`, otherwise the CPU may sleep before the service launches. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)
- **WorkManager pattern:** An alternative is creating a `Worker` that extends `Worker`, enqueueing it via `PeriodicWorkRequest` or `OneTimeWorkRequest`, and inside `doWork()` calling `startForegroundService` to hand off to a `HeadlessJsTaskService`. This is more OEM-resilient for periodic tasks. — [LogRocket Blog](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)
- **Timeout:** Each HeadlessJS task has a configurable timeout in milliseconds (default typically 5000 ms) set in `HeadlessJsTaskConfig`. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)
- **Supported task content:** Anything not UI-bound: network requests, timers, local data writes, playing audio. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)

### Inferences
- HeadlessJS is sufficient to run JS code when a BroadcastReceiver fires (e.g., when `AlarmManager` triggers). However, for playing audio and displaying a full-screen alert, the JS task should be kept minimal and the heavy lifting (notification, foreground service promotion, audio playback) should be handled natively.
- For an alarm clock use case (exact time, wakes screen), HeadlessJS alone is not enough; it must be paired with a `BroadcastReceiver → startForegroundService → HeadlessJsTaskService` chain.

### Gaps
- Android 14 introduced foreground service type requirements (e.g., `android:foregroundServiceType="mediaPlayback"` in the manifest). How this interacts with `HeadlessJsTaskService` specifically was not found in fetched sources; requires testing.

---

## Key Question 4: Notifee — full-screen alarm intent + notification actions on Android 14+

### Takeaway
Notifee supports full-screen intents and notification actions, but `USE_FULL_SCREEN_INTENT` was removed from its bundled manifest in v9.0.0 (Android 14 compliance), so apps must add it manually. Notifee's last active release was December 2024; it appears to have been archived by Invertase afterward. For continued use, migrate to the community fork `react-native-notify-kit`.

### Cited Findings
- **`fullScreenAction` API:** Set `fullScreenAction` in the `android` config of `notifee.displayNotification`. Accepts `mainComponent` (a registered React component name) or `launchActivity` (an Android Activity class). Notifee tries to launch it when the notification is displayed. — [Notifee Docs: Android Behaviour](https://docs.page/invertase/notifee/react-native/android/behaviour)
- **Recommended pairing:** The docs recommend using `category: AndroidCategory.CALL` and `importance: AndroidImportance.HIGH` alongside `fullScreenAction`. — [Notifee Docs: Android Behaviour](https://docs.page/invertase/notifee/react-native/android/behaviour)
- **`asForegroundService`:** Setting `asForegroundService: true` on the notification associates it with a foreground service, e.g., for an ongoing alarm. — [Notifee Docs: Android Behaviour](https://docs.page/invertase/notifee/react-native/android/behaviour)
- **Manifest entries required:**
  - In `android/app/src/main/AndroidManifest.xml`, add `android:showWhenLocked="true"` and `android:turnScreenOn="true"` to your main `<activity>`.
  - Add `<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />`.
  — [Notifee Docs: Android Behaviour](https://docs.page/invertase/notifee/react-native/android/behaviour)
- **Android 14 breaking change:** Notifee v9.0.0 removed `USE_FULL_SCREEN_INTENT` from the package's own bundled `AndroidManifest.xml`. Apps that need it must now add it manually. — [Notifee Release Notes v9.0.0](https://docs.page/invertase/notifee/react-native/release-notes)
- **Android 14 FSI restriction (platform-level):** Android 14 restricts `USE_FULL_SCREEN_INTENT` to apps that have genuine "calling or alarm" functionality declared via the Play Console (or `ROLE_DIALER`/`USE_EXACT_ALARM` declaration). Users can also revoke it per-app via "Manage full screen intents" settings. — [Android AOSP Docs: FSI Limits](https://source.android.com/docs/core/permissions/fsi-limits)
- **Notification actions:** Notifee supports custom `actions` (button-style and input) on notifications. The docs reference input actions and press actions. Stop/Snooze/Done can be implemented as `pressAction` entries — however, specific alarm-action docs were not fetched due to 404 on the triggers page.
- **Notifee maintenance — last release:** v9.1.8 on 2024-12-20. — [Notifee Release Notes](https://docs.page/invertase/notifee/react-native/release-notes)
- **Notifee maintenance — archival (unverified):** Multiple secondary sources (awesome.ecosyste.ms, Snyk) report the Invertase repo was archived April 7, 2026, with expo-notifications and react-native-notify-kit as recommended alternatives. Could not verify on the official Invertase GitHub due to GitHub MCP connection failure. — [awesome.ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fmarcocrupi%2Freact-native-notify-kit)
- **Heads-up vs. full-screen:** When the device is actively in use, Android may show the notification as a heads-up rather than a full-screen takeover — this is Android OS behavior, not a Notifee limitation. — [Notifee Docs: Android Behaviour](https://docs.page/invertase/notifee/react-native/android/behaviour)

### Inferences
- Notifee/react-native-notify-kit covers: scheduling triggers, full-screen intents, custom foreground service notifications, notification channels with USAGE_ALARM, and button actions (Stop/Snooze/Done). This eliminates the need to write most native notification code manually.
- On a personal app (no Play Store), the FSI permission can be added to the manifest freely; the Play Store declaration requirement only affects store distribution.

### Gaps
- The notifee `/android/triggers` docs page returned a 404; could not confirm exact AlarmManager type used (RTC_WAKEUP vs ELAPSED_REALTIME_WAKEUP) or whether notifee handles `SCHEDULE_EXACT_ALARM` runtime permission checks internally.
- Whether `react-native-notify-kit` achieves full feature parity with notifee for alarms (triggers, full-screen intent, actions) is not confirmed from its docs.

---

## Key Question 5: expo-audio / react-native-audio-api for background service playback

### Takeaway
`expo-audio` (SDK 58) supports background audio playback via a media foreground service, is stable, and plays local bundled files. `react-native-audio-api` (Software Mansion) also has an Expo config plugin for background audio. Both require a visible foreground service notification on Android; pure background service (no notification) will be killed after ~3 minutes.

### Cited Findings
- **expo-audio background playback config plugin (SDK 58):** `enableBackgroundPlayback` option (default `true`) adds a media playback foreground service (`AudioControlsService`) to the app and enables lock screen controls. Changes require rebuilding the app binary. — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **Runtime requirement:** Must call `setActiveForLockScreen` at runtime for sustained background playback. Without it, "audio will stop after approximately 3 minutes of background playback (OS limitation)." — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **Local files:** `useAudioPlayer(require('./assets/Hello.mp3'))` and `Audio.preload(require('./assets/sound.mp3'))` both work for bundled local assets. — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **Headphone disconnect:** Audio automatically stops when headphones or Bluetooth devices disconnect. — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **Other config plugin options:** `enableBackgroundRecording` (adds recording foreground service, default `false`); `recordAudioAndroid` (RECORD_AUDIO permission, default `true`). — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **react-native-audio-api (Software Mansion) config plugin:** Provides `iosBackgroundMode`, `androidPermissions`, `androidForegroundService`, and `androidFSTypes` options. Sets up a media playback foreground service type declaration. — [react-native-audio-api Plugin Docs](https://docs.swmansion.com/react-native-audio-api/other/audio-api-plugin)
- **expo-audio vs expo-av:** `expo-av` is the legacy audio library; `expo-audio` is the current replacement as of SDK 50+. The Medium post about `expo-av` from 2017 is not relevant. — [Expo Docs Audio v54](https://docs.expo.dev/versions/v54.0.0/sdk/audio-av.md)

### Inferences
- For an alarm app, `expo-audio` is the simplest integration: the config plugin handles the foreground service manifest entry, and `setActiveForLockScreen` ensures the alarm audio persists while the screen is on.
- Playing alarm audio from within a `HeadlessJsTaskService` is listed as a valid use case in the RN docs. However, direct integration between `expo-audio`'s foreground service and a `HeadlessJsTaskService` may need testing since they are separate foreground services.
- `react-native-audio-api` is a lower-level Web Audio API-compatible library — better for complex audio processing; for simple alarm playback, `expo-audio` is the simpler choice.

### Gaps
- Whether `expo-audio`'s `AudioControlsService` can be started from inside a `HeadlessJsTaskService` (or must be the app's primary foreground service) is not documented in fetched sources.
- The exact `androidFSTypes` value needed for `react-native-audio-api` for alarm audio (vs. media playback) was not found.

---

## Key Question 6: Minimum native Android code that must be written manually

### Takeaway
With notifee/react-native-notify-kit and expo-audio, the required custom native code is reduced to: a `BroadcastReceiver` for alarm firing (and a separate one for BOOT_COMPLETED to reschedule), wired to `AlarmManager.setExactAndAllowWhileIdle`. The `HeadlessJsTaskService` subclass is boilerplate but required. Config plugins handle manifest entries.

### Cited Findings
- **BroadcastReceiver (mandatory):** `AlarmManager` fires an `Intent`; a `BroadcastReceiver` must be registered to receive it. The CPU stays awake only during `onReceive()`; wake lock must be acquired immediately. — [Android Developer: AlarmManager](https://developer.android.com/reference/kotlin/android/app/AlarmManager)
- **startForegroundService from receiver:** The receiver must call `Context.startForegroundService()` (API 26+) pointing to the `HeadlessJsTaskService`. Must complete within `onReceive()` scope. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)
- **HeadlessJsTaskService subclass (mandatory):** Extend `HeadlessJsTaskService`, override `getTaskConfig()` returning a `HeadlessJsTaskConfig` with task name, timeout, and foreground-allowed flag. — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android)
- **BOOT_COMPLETED receiver (mandatory):** Alarms are lost on reboot. A second `BroadcastReceiver` listening for `android.intent.action.BOOT_COMPLETED` must reschedule all stored alarms. — [Android Developer: AlarmManager](https://developer.android.com/reference/kotlin/android/app/AlarmManager)
- **AlarmManager.setExactAndAllowWhileIdle (mandatory for Doze):** The only API that fires during Doze mode. Requires `SCHEDULE_EXACT_ALARM` (or `USE_EXACT_ALARM`) permission; must check `canScheduleExactAlarms()` at runtime on API 33+. — [Android Developer: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)
- **Covered by notifee:** Notification channel creation (including USAGE_ALARM), trigger scheduling via `TimestampTrigger` / `IntervalTrigger`, full-screen intent configuration, notification actions, foreground service notification management. — [Notifee Release Notes](https://docs.page/invertase/notifee/react-native/release-notes)
- **Covered by expo-audio:** Background audio foreground service (`AudioControlsService`), lock screen controls, local file playback. — [Expo Docs: Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio.md)
- **Covered by react-native-background-actions:** Foreground service wrapper with notification, cross-platform (Android 8.0+ compliant), JS-initiated start/stop. Android 12+ cannot launch from background without user interaction unless combined with AlarmManager. — [react-native-background-actions (Algolia MCP)](https://docsearch.algolia.com/mcp/docs/repo/rapsssito/react-native-background-actions)
- **Manual work remaining even with packages:**
  - Kotlin/Java `BroadcastReceiver` class for alarm firing (< 30 lines)
  - Kotlin/Java `BroadcastReceiver` class for BOOT_COMPLETED reschedule (< 20 lines)
  - Kotlin/Java native module (or Expo Module API) to call `AlarmManager.setExactAndAllowWhileIdle` from JavaScript
  - `AndroidManifest.xml` entries (handled by config plugin if written)
  — [React Native Docs: Headless JS](https://reactnative.dev/docs/0.79/headless-js-android); [LogRocket Blog](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)

### Inferences
- Total custom native code (excluding what packages provide) is approximately 3–4 Kotlin/Java files, each small (< 50 lines). The complexity lies in correct wake-lock handling and the foreground service promotion sequence, not volume of code.
- Using the Expo Modules API (`expo-modules-core`) simplifies the native module bridge compared to writing a raw `ReactPackage`/`NativeModule`.

### Gaps
- Whether notifee's trigger scheduling internally calls `AlarmManager.setExactAndAllowWhileIdle` or a different API was not confirmed (the triggers docs page returned 404). If it uses an inexact API, a custom AlarmManager call would still be needed.

---

## Key Question 7: HeadlessJS killed by manufacturers (Samsung, Xiaomi, etc.)

### Takeaway
OEM battery management layers (Samsung One UI, Xiaomi MIUI, etc.) kill background services independently of Android's Doze. Foreground services significantly reduce (but do not eliminate) the risk. The mitigation strategy is a combination of: foreground service, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission request, and in-app guidance to users to disable OEM-specific autostart/battery restrictions.

### Cited Findings
- **OEM layers above Doze:** Manufacturers like Xiaomi (MIUI), Huawei (EMUI), Samsung (One UI), Oppo, and Vivo add their own battery management layers with restrictions beyond stock Android Doze. These do not respect standard `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` exemptions in all cases. — [Mintlify: react-native-background-guardian OEM Restrictions](https://www.mintlify.com/ivangonzalezg/react-native-background-guardian/concepts/oem-restrictions)
- **Xiaomi MIUI specifics:** The relevant settings are "Autostart Manager" and "App Battery Saver" (set to "No Restrictions" per app). Standard battery-optimization exemption does not override these. — [Mintlify: Platform Differences](https://www.mintlify.com/ivangonzalezg/react-native-background-guardian/guides/platform-differences)
- **Samsung case:** A developer noted that on Samsung, Xiaomi, and Oppo, "the OS kills your service before the JS task starts even when the alarm and receiver fire." The documented workaround is prompting the user to whitelist the app from battery optimization in device settings. — [DEV Community: Android Doze kills RN background tasks](https://dev.to/srahman0203/android-doze-kills-your-react-native-background-tasks-heres-why-and-how-to-fix-it-2299)
- **Foreground services as partial mitigation:** A foreground service prevents App Standby Bucket restrictions. It does not fully override OEM autostart restrictions. Libraries like `react-native-background-actions` or `react-native-background-guardian` wrap this pattern. — [Mintlify: react-native-background-guardian FAQ](https://www.mintlify.com/ivangonzalezg/react-native-background-guardian/resources/faq)
- **AlarmManager + foreground service is the most robust pattern:** `AlarmManager.setExactAndAllowWhileIdle` fires the `BroadcastReceiver` even in Doze. The receiver must immediately call `startForegroundService` and acquire a wake lock. This is the pattern closest to what native Android alarm apps use. — [Android Developer: Schedule Alarms](https://developer.android.com/training/scheduling/alarms)
- **dontkillmyapp.com:** Community resource listing per-device steps to whitelist apps from OEM battery optimizations. Referenced by react-native-background-guardian. — [dontkillmyapp.com](https://dontkillmyapp.com)
- **Historical context:** Samsung wrote its own "Doze-like" system in One UI well before Android 12, and the problem has existed since 2019. It is not a 2024-specific regression. — [Dice Insights: Android OEMs Shamed](https://insights.dice.com/2019/01/15/android-devs-shame-oems/)

### Inferences
- For a personal alarm app, the best UX mitigation is displaying an in-app prompt guiding users through the device-specific battery settings (using a library like `react-native-background-guardian` or a custom prompt linking to the Settings intent).
- There is no technical solution that fully prevents OEM kills without user action on MIUI and some Samsung devices.
- `AlarmManager.setExactAndAllowWhileIdle` is the "floor": the receiver will fire. Whether the subsequent foreground service survives is the OEM-dependent variable.

### Gaps
- Android 14's new foreground service type requirements (`android:foregroundServiceType` must be declared for each type used) and their interaction with OEM battery killers on Samsung One UI 6+ was not found in fetched sources. Needs direct testing.
- No 2024–2025 dated source specifically for Samsung One UI 6 or Xiaomi MIUI 14 behavior was found.
