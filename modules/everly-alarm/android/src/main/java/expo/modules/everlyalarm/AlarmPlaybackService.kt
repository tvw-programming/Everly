package expo.modules.everlyalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.File

/**
 * Short mediaPlayback foreground service — plays local/bundled audio until
 * Stop / Snooze / Done or max ring minutes.
 */
class AlarmPlaybackService : Service() {
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var currentId: String? = null
  private var currentPayload: JSONObject? = null
  private var alsoDueTitle: String? = null
  private val handler = Handler(Looper.getMainLooper())
  private var stopRunnable: Runnable? = null
  private var focusRequest: AudioFocusRequest? = null

  /**
   * An alarm the user cannot hear has failed, so this never ducks and never
   * pauses for a transient loss such as an incoming call. Only a permanent
   * loss ends playback.
   */
  private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
    if (change == AudioManager.AUDIOFOCUS_LOSS) {
      finish(stopSelf = true)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return START_NOT_STICKY
        val raw = intent.getStringExtra(AlarmScheduler.EXTRA_PAYLOAD)
        val payload = try {
          if (!raw.isNullOrBlank()) JSONObject(raw) else AlarmStore.get(this, id)
        } catch (_: Exception) {
          AlarmStore.get(this, id)
        } ?: return START_NOT_STICKY
        begin(id, payload)
      }
      ACTION_STOP, ACTION_DONE -> {
        finish(stopSelf = true)
      }
      ACTION_SNOOZE -> {
        val minutes = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10).coerceIn(1, 120)
        val id = currentId ?: intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID)
        finish(stopSelf = false)
        if (id != null) {
          AlarmScheduler.scheduleSnooze(this, id, minutes)
        }
        stopSelf()
      }
      ACTION_ALSO_DUE -> {
        val raw = intent.getStringExtra(AlarmScheduler.EXTRA_PAYLOAD)
        if (!raw.isNullOrBlank()) {
          try {
            val p = JSONObject(raw)
            alsoDueTitle = p.optString("title", "Another reminder")
            refreshNotification()
          } catch (_: Exception) {
            // ignore
          }
        }
      }
      else -> {
        // no-op
      }
    }
    return START_NOT_STICKY
  }

  private fun begin(id: String, payload: JSONObject) {
    // Conflict: already playing something else → queue text only
    if (currentId != null && currentId != id) {
      alsoDueTitle = payload.optString("title", "Another reminder")
      refreshNotification()
      return
    }

    currentId = id
    currentPayload = payload
    AlarmStore.setActiveId(this, id)
    ensureChannel()

    val title = payload.optString("title", "Alarm")
    val body = payload.optString("description", "Reminder")
    startForeground(NOTIF_ID, buildNotification(title, body))

    startPlayback(payload)
    maybeVibrate(payload)

    val maxMin = payload.optInt("maxRingMinutes", 10).coerceIn(1, 60)
    stopRunnable?.let { handler.removeCallbacks(it) }
    stopRunnable = Runnable { finish(stopSelf = true) }
    handler.postDelayed(stopRunnable!!, maxMin * 60_000L)
  }

  private fun startPlayback(payload: JSONObject) {
    stopPlaybackOnly()
    val source = payload.optString("audioSource", "bundled")
    if (source == "silent") return

    val path = payload.optString("managedPath", "")
    val loop = payload.optBoolean("loop", true)

    val attrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()
    requestFocus(attrs)

    try {
      val mp = MediaPlayer()
      mp.setAudioAttributes(attrs)

      when {
        path.startsWith("content:") || path.startsWith("file:") ->
          mp.setDataSource(this, Uri.parse(path))
        path.isNotBlank() && File(path).exists() -> mp.setDataSource(path)
        else -> {
          // Bundled module fallback (res/raw/chime) or system alarm
          val resId = resources.getIdentifier("chime", "raw", packageName)
          if (resId != 0) {
            val afd = resources.openRawResourceFd(resId)
            mp.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
            afd.close()
          } else {
            val uri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
              ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            mp.setDataSource(this, uri)
          }
        }
      }

      mp.isLooping = loop
      mp.setOnCompletionListener {
        if (!loop) finish(stopSelf = true)
      }
      mp.prepare()
      mp.start()
      player = mp
    } catch (_: Exception) {
      try {
        val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        val mp = MediaPlayer.create(this, uri)
        mp?.isLooping = loop
        mp?.start()
        player = mp
      } catch (_: Exception) {
        // give up on audio — notification still shows
      }
    }
  }

  /**
   * Transient focus, because an alarm is finite: whatever was playing before
   * is expected to resume once the user dismisses it.
   */
  private fun requestFocus(attrs: AudioAttributes) {
    abandonFocus()
    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(attrs)
      .setOnAudioFocusChangeListener(focusListener, handler)
      .build()
    focusRequest = request
    // Ring regardless of the answer — a denied request must not silence an alarm.
    try {
      am.requestAudioFocus(request)
    } catch (_: Exception) {
      // ignore
    }
  }

  private fun abandonFocus() {
    val request = focusRequest ?: return
    focusRequest = null
    try {
      val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      am.abandonAudioFocusRequest(request)
    } catch (_: Exception) {
      // ignore
    }
  }

  private fun maybeVibrate(payload: JSONObject) {
    if (!payload.optBoolean("vibration", true)) return
    vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(VIBRATOR_SERVICE) as Vibrator
    }
    val pattern = longArrayOf(0, 600, 400, 600, 400, 600)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      vibrator?.vibrate(pattern, 0)
    }
  }

  private fun finish(stopSelf: Boolean) {
    stopRunnable?.let { handler.removeCallbacks(it) }
    stopRunnable = null
    stopPlaybackOnly()
    try {
      vibrator?.cancel()
    } catch (_: Exception) {
      // ignore
    }
    vibrator = null
    abandonFocus()
    AlarmStore.setActiveId(this, null)
    currentId = null
    currentPayload = null
    alsoDueTitle = null
    stopForeground(STOP_FOREGROUND_REMOVE)
    if (stopSelf) stopSelf()
  }

  private fun stopPlaybackOnly() {
    try {
      player?.stop()
    } catch (_: Exception) {
      // ignore
    }
    try {
      player?.release()
    } catch (_: Exception) {
      // ignore
    }
    player = null
  }

  private fun refreshNotification() {
    val title = currentPayload?.optString("title", "Alarm") ?: "Alarm"
    var body = currentPayload?.optString("description", "Reminder") ?: "Reminder"
    if (!alsoDueTitle.isNullOrBlank()) {
      body = "$body · Also due: $alsoDueTitle"
    }
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIF_ID, buildNotification(title, body))
  }

  private fun buildNotification(title: String, body: String): Notification {
    val id = currentId ?: "alarm"
    val snoozeMin = currentPayload?.optInt("snoozeMinutes", 10) ?: 10

    // Must be an explicit VIEW intent: the launcher intent is ACTION_MAIN, and
    // setting data on it does not reach the app as a deep link, so tapping the
    // notification lands on Home instead of the alarm.
    val contentIntent = Intent(
      Intent.ACTION_VIEW,
      Uri.parse("reminders://alarm-active?id=$id")
    ).apply {
      setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val contentPi = PendingIntent.getActivity(
      this,
      id.hashCode() + 11,
      contentIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val stopPi = actionPi(ACTION_STOP, id.hashCode() + 1)
    val snoozeIntent = Intent(this, AlarmPlaybackService::class.java).apply {
      action = ACTION_SNOOZE
      putExtra(AlarmScheduler.EXTRA_ALARM_ID, id)
      putExtra(EXTRA_SNOOZE_MINUTES, snoozeMin)
    }
    val snoozePi = PendingIntent.getService(
      this,
      id.hashCode() + 2,
      snoozeIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val donePi = actionPi(ACTION_DONE, id.hashCode() + 3)

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(body)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setOngoing(true)
      .setContentIntent(contentPi)
      .addAction(0, "Stop", stopPi)
      .addAction(0, "Snooze ${snoozeMin}m", snoozePi)
      .addAction(0, "Done", donePi)
      .build()
  }

  private fun actionPi(action: String, requestCode: Int): PendingIntent {
    val intent = Intent(this, AlarmPlaybackService::class.java).apply {
      this.action = action
      putExtra(AlarmScheduler.EXTRA_ALARM_ID, currentId)
    }
    return PendingIntent.getService(
      this,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    val ch = NotificationChannel(
      CHANNEL_ID,
      "Everly Alarms",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Full-song alarm playback"
      setBypassDnd(true)
      enableVibration(true)
    }
    nm.createNotificationChannel(ch)
  }

  companion object {
    const val ACTION_START = "expo.modules.everlyalarm.START"
    const val ACTION_STOP = "expo.modules.everlyalarm.STOP"
    const val ACTION_SNOOZE = "expo.modules.everlyalarm.SNOOZE"
    const val ACTION_DONE = "expo.modules.everlyalarm.DONE"
    const val ACTION_ALSO_DUE = "expo.modules.everlyalarm.ALSO_DUE"
    const val EXTRA_SNOOZE_MINUTES = "snoozeMinutes"
    private const val CHANNEL_ID = "everly_alarms"
    private const val NOTIF_ID = 71001

    fun enqueueAlsoDue(ctx: Context, payload: JSONObject) {
      val intent = Intent(ctx, AlarmPlaybackService::class.java).apply {
        action = ACTION_ALSO_DUE
        putExtra(AlarmScheduler.EXTRA_PAYLOAD, payload.toString())
      }
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          ctx.startForegroundService(intent)
        } else {
          ctx.startService(intent)
        }
      } catch (_: Exception) {
        // Service may not be running; ignore second alarm for v1
      }
    }

    fun stop(ctx: Context) {
      val intent = Intent(ctx, AlarmPlaybackService::class.java).apply {
        action = ACTION_STOP
      }
      ctx.startService(intent)
    }

    fun snooze(ctx: Context, minutes: Int) {
      val intent = Intent(ctx, AlarmPlaybackService::class.java).apply {
        action = ACTION_SNOOZE
        putExtra(EXTRA_SNOOZE_MINUTES, minutes)
      }
      ctx.startService(intent)
    }
  }
}
