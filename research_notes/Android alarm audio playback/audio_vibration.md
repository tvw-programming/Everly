# Android Alarm Audio Playback & Vibration

## AudioAttributes: USAGE_ALARM vs USAGE_MEDIA

### Takeaway
Use `AudioAttributes.USAGE_ALARM` for all alarm audio; it routes to `STREAM_ALARM` (the alarm volume slider), is treated as a separate audio context from media, and is the correct semantic tag for DND policy evaluation. `USAGE_MEDIA` routes to `STREAM_MUSIC` and has no special alarm priority.

### Cited Findings
- The Android Open Source Project documentation maps `USAGE_ALARM` to the ALARM audio context and `USAGE_MEDIA` to the MUSIC context on Android 9 and later — [Source](https://source.android.com/docs/core/audio/attributes)
- Android recommends using audio attributes (not legacy stream types) for apps targeting Android 5.0 and higher — [Source](https://source.android.com/docs/core/audio/attributes)
- The framework does not enforce or guarantee mapping from legacy stream types to audio attributes across devices, manufacturers, or Android releases — [Source](https://source.android.com/docs/core/audio/attributes)
- `USAGE_ALARM` maps to `STREAM_ALARM` (value `4` on `AudioManager`), which has its own independent volume slider, separate from media and ringer volume — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `CONTENT_TYPE_SONIFICATION` is the recommended content type to pair with `USAGE_ALARM` for alarm/ringtone sounds — [AudioAttributes Reference](https://developer.android.com/reference/android/media/AudioAttributes)
- Correct builder pattern: `.setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)` — [AudioAttributes Reference](https://developer.android.com/reference/android/media/AudioAttributes)

### Inferences
- Choosing `USAGE_MEDIA` for an alarm would route audio through the media volume channel, meaning the alarm volume could be zero while media volume is high or vice versa — this would be a serious UX bug.
- `CONTENT_TYPE_MUSIC` paired with `USAGE_ALARM` is likely incorrect; `CONTENT_TYPE_SONIFICATION` is the semantically appropriate pairing for attention-grabbing alarm tones.

### Gaps
- The exact list of behavioral differences between `USAGE_ALARM` and `USAGE_MEDIA` in DND priority-only mode is not confirmed from primary sources in this research; secondary sources suggest alarms can pass through DND when the alarm category is allowed, but this needs verification against `NotificationManager.Policy` docs.


## AudioFocusRequest for Alarm Playback

### Takeaway
Use `AUDIOFOCUS_GAIN_TRANSIENT` (not `AUDIOFOCUS_GAIN`) for alarm playback. Alarms are finite events after which the user expects prior audio (music) to resume; transient focus communicates this to the system correctly. Abandon focus when the alarm stops.

### Cited Findings
- The official `AudioFocusRequest` docs use alarm playback as the canonical example of `AUDIOFOCUS_GAIN_TRANSIENT`, describing it as when "your application is temporarily grabbing focus from the current owner, with the expectation that playback resumes afterward" — [AudioFocusRequest Reference](https://developer.android.com/reference/android/media/AudioFocusRequest)
- `AUDIOFOCUS_GAIN` is meant for long-running music/podcast playback (long duration), not finite alarms — [SitePoint Guide](https://www.sitepoint.com/managing-multiple-sound-sources-in-android-with-audio-focus/)
- `AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE` is for recording/voice-recognition and is not appropriate for alarms — [AudioFocusRequest Reference](https://developer.android.com/reference/android/media/AudioFocusRequest)
- The older `requestAudioFocus(listener, streamType, durationHint)` overload is deprecated as of API 26; use `AudioFocusRequest.Builder` instead — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `AudioFocusRequest.Builder` requires an `AudioAttributes` object; for alarms, pair it with `USAGE_ALARM` attributes — [AudioFocusRequest Reference](https://developer.android.com/reference/android/media/AudioFocusRequest)
- `requestAudioFocus()` can return `AUDIOFOCUS_REQUEST_GRANTED`, `AUDIOFOCUS_REQUEST_FAILED`, or `AUDIOFOCUS_REQUEST_DELAYED` — handle all three cases — [AudioFocusRequest Reference](https://developer.android.com/reference/android/media/AudioFocusRequest)

### Inferences
- Canonical Kotlin setup for alarm audio focus:
  ```kotlin
  val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(
          AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_ALARM)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build()
      )
      .setOnAudioFocusChangeListener(focusListener, handler)
      .setAcceptsDelayedFocusGain(false)
      .setWillPauseWhenDucked(false)
      .build()
  val result = audioManager.requestAudioFocus(focusRequest)
  // On alarm dismiss: audioManager.abandonAudioFocusRequest(focusRequest)
  ```
- Setting `setWillPauseWhenDucked(false)` prevents the system from auto-pausing the alarm when other apps duck; the alarm should keep playing at full volume.

### Gaps
- Whether `AUDIOFOCUS_REQUEST_DELAYED` can actually occur for alarm-usage audio focus requests is not confirmed; it's more commonly seen in automotive or multi-session setups.


## OnAudioFocusChangeListener: Handling Interruptions

### Takeaway
An alarm should generally **not** silently stop on `AUDIOFOCUS_LOSS_TRANSIENT` (incoming phone call) — most implementations keep playing or re-request focus, because stopping an alarm silently would be a worse experience than playing over a notification sound. However, the correct behavior for `AUDIOFOCUS_LOSS` (permanent loss) is to stop and release resources.

### Cited Findings
- `AUDIOFOCUS_LOSS`: focus was lost for a long time; the app should stop playback and release audio resources — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `AUDIOFOCUS_LOSS_TRANSIENT`: focus was lost temporarily (e.g., a phone call); apps should pause and resume when focus returns via `AUDIOFOCUS_GAIN` — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK`: apps should lower volume temporarily; they don't need to pause — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- Incoming and active phone calls take audio priority; media apps typically receive `AUDIOFOCUS_LOSS_TRANSIENT` when a call starts and `AUDIOFOCUS_GAIN` when the call ends — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)

### Inferences
- For an alarm app, the recommended `onAudioFocusChange` strategy is:
  - `AUDIOFOCUS_LOSS_TRANSIENT` (incoming call): keep the alarm ringing or lower volume slightly, since silently pausing an alarm is dangerous. Re-request focus after handling the change.
  - `AUDIOFOCUS_LOSS` (another app permanently takes focus): Stop the alarm, but show a persistent notification so the user knows the alarm fired.
  - `AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK`: keep ringing at full volume — alarm audio should not duck.
  - `AUDIOFOCUS_GAIN`: resume playback if it was paused.
- Another alarm firing and requesting `AUDIOFOCUS_GAIN_TRANSIENT` would cause the first alarm to receive `AUDIOFOCUS_LOSS_TRANSIENT` — this is the mechanism that must be handled for overlapping alarms (see the simultaneous alarms question below).

### Gaps
- Whether Android's telephony stack sends `AUDIOFOCUS_LOSS_TRANSIENT` or `AUDIOFOCUS_LOSS` for phone calls is not confirmed from a primary source here; behavior may differ between device OEMs.


## VibrationEffect Patterns for Android 12+

### Takeaway
Use `VibrationEffect.createWaveform()` with a repeating pattern for alarms, and pair it with `VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM)` (API 30+) to ensure the vibration is not suppressed by DND and follows alarm intensity settings. Check `Vibrator.hasAmplitudeControl()` before using non-binary amplitudes.

### Cited Findings
- `VibrationAttributes` was added in API 30 (Android 11); `USAGE_ALARM` is an int constant with value 17 — [VibrationAttributes Reference](https://developer.android.com/reference/android/os/VibrationAttributes)
- Background apps must specify a ringtone, notification, or alarm usage in `VibrationAttributes` in order to vibrate on modern Android — [VibrationAttributes Reference](https://developer.android.com/reference/android/os/VibrationAttributes)
- `VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM)` is the factory method; pair it with `Vibrator.vibrate(VibrationEffect, VibrationAttributes)` — [VibrationAttributes Reference](https://developer.android.com/reference/android/os/VibrationAttributes)
- `VibrationEffect.createWaveform(long[] timings, int[] amplitudes, int repeat)`: timings alternate off/on in ms starting with off; amplitudes 0–255; `repeat` is the loop-back index or `-1` for no repeat — [VibrationEffect Reference](https://developer.android.com/reference/android/os/VibrationEffect)
- `createPredefined(int effectId)` (API 29+) maps constants like `EFFECT_CLICK`, `EFFECT_DOUBLE_CLICK`, `EFFECT_TICK`, `EFFECT_HEAVY_CLICK` — the OS decides the waveform — [VibrationEffect Reference](https://developer.android.com/reference/android/os/VibrationEffect)
- Amplitude control is hardware-dependent; devices without it treat any non-zero amplitude value as fully on — [Android Haptics Guide](https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects)
- Android 13 lets users control vibration intensity by category (calls, notifications, alarms, haptics), which affects alarm vibration strength regardless of app-supplied amplitudes — [Android Haptics Guide](https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects)
- The older `vibrate(long, AudioAttributes)` overload is deprecated in favor of `vibrate(VibrationEffect, VibrationAttributes)` — [VibrationEffect Reference](https://developer.android.com/reference/android/os/VibrationEffect)

### Inferences
- Recommended alarm vibration pattern (repeating):
  ```kotlin
  val timings = longArrayOf(0L, 500L, 500L)   // 0ms off, 500ms on, 500ms off
  val amplitudes = intArrayOf(0, 255, 0)
  val effect = VibrationEffect.createWaveform(timings, amplitudes, 1) // loop from index 1
  val attrs = VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM)
  vibrator.vibrate(effect, attrs)
  ```
- Capability check before using variable amplitudes:
  ```kotlin
  val vibrator = context.getSystemService(Vibrator::class.java)
  if (!vibrator.hasAmplitudeControl()) {
      // Fall back to simple on/off pattern, no intermediate amplitudes
  }
  ```
- `VIBRATE` permission (`android.permission.VIBRATE`) is required in the manifest.
- On Android 12 (API 31), `VibratorManager` was introduced for devices with multiple vibrators; for most phones, the single `Vibrator` service is sufficient.

### Gaps
- The exact API level at which `Vibrator.hasAmplitudeControl()` was added is not confirmed from primary sources (general knowledge says API 11, but this needs verification).
- Whether `VibrationAttributes.USAGE_ALARM` is truly honored on all Android 12 devices or just API 30+ was not confirmed from primary sources.


## STREAM_ALARM and Alarm Volume Detection

### Takeaway
`STREAM_ALARM` is the dedicated alarm stream (constant value `4`). Use `AudioManager.getStreamVolume(STREAM_ALARM)` and `isStreamMute(STREAM_ALARM)` to detect zero/muted states and warn the user before the alarm fires.

### Cited Findings
- `AudioManager.STREAM_ALARM` has constant value `4` — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `getStreamVolume(int streamType)` returns the current volume index for any stream — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `getStreamMaxVolume(int streamType)` returns the maximum volume index — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- `isStreamMute(int streamType)` (API 23+) returns whether the stream is explicitly muted — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- A volume index of `0` and mute are distinct states; both should be checked — [AudioManager Reference](https://developer.android.com/reference/android/media/AudioManager)
- Disallowing alarms in a DND policy (`ZenPolicy`) mutes the alarm stream while DND is active — [ZenPolicy.Builder Reference](https://developer.android.com/reference/android/service/notification/ZenPolicy.Builder)

### Inferences
- Recommended check before setting an alarm:
  ```kotlin
  val am = context.getSystemService(AudioManager::class.java)
  val vol = am.getStreamVolume(AudioManager.STREAM_ALARM)
  val muted = am.isStreamMute(AudioManager.STREAM_ALARM)
  if (vol == 0 || muted) {
      // Show a warning to the user that alarm volume is zero/muted
  }
  ```
- Apps should NOT silently adjust the alarm volume on the user's behalf — this is a violation of user intent. Show a warning and let the user change it.
- `setStreamVolume()` (with `FLAG_SHOW_UI`) CAN increase alarm volume programmatically, but this is best reserved for explicit user action (e.g., a "Fix now" button in the warning).

### Gaps
- Whether `isStreamMute` for `STREAM_ALARM` reflects DND-driven muting (as opposed to user-driven muting) was not confirmed from primary sources; they may return different values.


## Do Not Disturb: Bypass Without Special Permission

### Takeaway
An alarm app can bypass DND without `ACCESS_NOTIFICATION_POLICY` by using `AudioAttributes.USAGE_ALARM` for audio and `AlarmManager.setAlarmClock()` for scheduling. These are recognized by the OS as alarm-class events. `ACCESS_NOTIFICATION_POLICY` is only needed to read or change the DND policy itself (e.g., to programmatically turn DND on/off).

### Cited Findings
- `NotificationManager.isNotificationPolicyAccessGranted()` returns whether the app can change the notification policy (DND rules). Only apps that need to read/write DND rules require this — [NotificationManager Reference](https://developer.android.com/reference/android/app/NotificationManager)
- `Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS` opens the system screen where the user can grant policy access — [NotificationManager Reference](https://developer.android.com/reference/android/app/NotificationManager)
- `PRIORITY_CATEGORY_ALARMS` in `NotificationManager.Policy.priorityCategories` controls whether alarm-category notifications pass through a priority-only DND mode — [NotificationManager Reference](https://developer.android.com/reference/android/app/NotificationManager)
- `AlarmManager.setAlarmClock()` is described as highly visible to users; the system "never adjusts their delivery time" and "leaves low-power modes if necessary to deliver the alarms" — [Schedule Alarms Guide](https://developer.android.com/develop/background-work/services/alarms/schedule)
- Disallowing alarms in a `ZenPolicy` "will mute the alarm stream when DND is active" — [ZenPolicy.Builder Reference](https://developer.android.com/reference/android/service/notification/ZenPolicy.Builder)
- For a personal-use app, the user can manually ensure the "Alarms" category is allowed in DND settings; the app doesn't need to manage this programmatically — [ZenPolicy.Builder Reference](https://developer.android.com/reference/android/service/notification/ZenPolicy.Builder)
- Allowing all notifications to bypass DND also unmutes all streams — [ZenPolicy.Builder Reference](https://developer.android.com/reference/android/service/notification/ZenPolicy.Builder)

### Inferences
- For a personal alarm app: use `USAGE_ALARM` + `setAlarmClock()` and do NOT request `ACCESS_NOTIFICATION_POLICY` unless the app has a feature to manage DND rules itself.
- `setAlarmClock()` is the strongest AlarmManager primitive; it shows an alarm icon in the status bar and is the most likely to fire through power-saving modes and DND.
- If a user has DND configured to block all alarms, the `ZenPolicy` will mute `STREAM_ALARM` and the alarm will be silent regardless of app code. The app should detect this via the volume check above and inform the user.
- `USE_EXACT_ALARM` (API 33+) is granted automatically and covers alarm/calendar use cases; prefer it over `SCHEDULE_EXACT_ALARM` for a personal app on Android 13+ — [Schedule Alarms Guide](https://developer.android.com/develop/background-work/services/alarms/schedule)

### Gaps
- Whether `USAGE_ALARM` audio physically bypasses the DND audio suppression on Android 14/15 without any special permission is not definitively confirmed from a primary source; the `ZenPolicy` doc implies it can be suppressed if the DND policy disallows alarms.


## Two Simultaneous Alarms: Queuing Pattern

### Takeaway
The correct pattern for two alarms firing at the same time is: the second alarm requests `AUDIOFOCUS_GAIN_TRANSIENT`, which causes the first to receive `AUDIOFOCUS_LOSS_TRANSIENT`. The first alarm should pause/stop and the second plays; when the second is dismissed, the first alarm's `AUDIOFOCUS_GAIN` callback fires and it can resume. This requires both alarms to share a single queuing owner — a foreground service that manages alarm state.

### Cited Findings
- Android AlarmManager matches pending intents on request code plus `Intent.filterEquals` (which ignores extras); alarms sharing a request code will overwrite each other — [AlarmManager Reference](https://developer.android.com/reference/android/app/AlarmManager); corroborated by plugin documentation
- Each alarm must use a distinct request code to avoid cancellation of earlier alarms — general developer guidance and alarm plugin implementations on [pub.dev](https://pub.dev/packages/native_alarm)
- A foreground service with `foregroundServiceType="mediaPlayback"` is the correct way to keep alarm audio running reliably — multiple open-source alarm apps on [F-Droid](https://f-droid.org/packages/com.angrydoughnuts.android.alarmclock/) use this pattern
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission is needed to declare that foreground service type (Android 14+)
- You cannot schedule the same service multiple times simultaneously; the recommended pattern is to schedule the nearest alarm and queue subsequent ones — community guidance from [B4X forums](https://www.b4x.com/android/forum/threads/countdown-alarm.125535/)

### Inferences
- Correct simultaneous-alarm design:
  1. A single `AlarmPlaybackService` (foreground service, `mediaPlayback` type) owns one `MediaPlayer` instance at a time.
  2. It maintains an ordered queue of pending alarms (`PriorityQueue` by trigger time).
  3. When a new alarm fires while another plays, push the currently-playing alarm state to the queue and start the new one.
  4. On dismissal/snooze, pop the next alarm from the queue and play it.
  5. Use a single `AudioFocusRequest` for the service; re-request on each new alarm.
- This avoids the audio overlap problem entirely without needing two MediaPlayer instances playing simultaneously — MediaPlayer playback overlap is undefined behavior and should be avoided.
- The `OnAudioFocusChangeListener` approach (letting the system arbitrate between two competing focus requests) is a valid alternative but is less predictable than managing the queue explicitly.

### Gaps
- No official Android documentation was found that explicitly describes the "queue" pattern for overlapping alarms; the pattern above is inferred from the audio focus model and common open-source implementations.
- How the system handles two `AUDIOFOCUS_GAIN_TRANSIENT` requests from the same app (same UID) is not documented in primary sources found here.


## MediaPlayer: Playing Files from Internal Storage (getFilesDir)

### Takeaway
For alarm tones stored in `context.filesDir`, use `MediaPlayer.setDataSource(file.absolutePath)` with `AudioAttributes` set to `USAGE_ALARM`, then call `prepareAsync()`. Set `isLooping = true` for repeating alarm tones. Use a `FileDescriptor` via `FileInputStream.getFD()` if path-based access fails on older devices.

### Cited Findings
- Google recommends Jetpack Media3 (ExoPlayer) for new apps; MediaPlayer is the legacy API — [MediaPlayer Overview](https://developer.android.com/media/platform/mediaplayer)
- MediaPlayer can play from raw resources, file system paths, and network streams — [MediaPlayer Overview](https://developer.android.com/media/platform/mediaplayer)
- `setDataSource(String path)` accepts a file path to internal storage — [MediaPlayer Overview](https://developer.android.com/media/platform/mediaplayer)
- Files in `context.filesDir` are app-private and readable by the same app without special permissions — [Data Storage Guide](https://developer.android.com/training/data-storage/app-specific)
- An older anecdotal report (Tencent Cloud, 2012) noted that a `FileInputStream.getFD()` approach was more reliable than a path string for internal files; this may no longer be relevant on modern Android but is a useful fallback — [Tencent Cloud Q&A](https://cloud.tencent.com/developer/ask/46396)
- MediaPlayer state machine: Idle → Initialized (`setDataSource`) → Prepared (`prepare()` or `prepareAsync()`) → Started ↔ Paused → Stopped → Released — [MediaPlayer Reference](https://developer.android.com/reference/android/media/MediaPlayer)
- Calling a method in the wrong state throws `IllegalStateException`; always call `release()` when done — [MediaPlayer Reference](https://developer.android.com/reference/android/media/MediaPlayer)

### Inferences
- Complete alarm MediaPlayer setup:
  ```kotlin
  val file = File(context.filesDir, "alarm_tone.mp3")
  val player = MediaPlayer().apply {
      setAudioAttributes(
          AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_ALARM)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build()
      )
      setDataSource(file.absolutePath)
      isLooping = true
      setOnPreparedListener { it.start() }
      setOnErrorListener { mp, what, extra ->
          mp.reset()
          true
      }
      prepareAsync()
  }
  // On dismiss: player.stop(); player.release()
  ```
- FileDescriptor fallback:
  ```kotlin
  FileInputStream(file).use { fis ->
      player.setDataSource(fis.fd)
  }
  ```
- `setAudioAttributes()` must be called before `setDataSource()` — calling it after `prepare()` has no effect.
- ExoPlayer (Media3) handles the state machine more safely and is preferred for new implementations, but MediaPlayer is sufficient for alarm use cases where the audio is short, looped, and well-understood.

### Gaps
- Whether `setDataSource(String)` vs `setDataSource(FileDescriptor)` makes a practical difference on Android 12–15 was not confirmed; the older reports about path failures may not apply to modern Android.
- There is no primary source confirming that `setAudioAttributes()` must precede `setDataSource()`; this is an inference from the API's stateful nature.
