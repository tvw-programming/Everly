package expo.modules.everlyalarm

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class EverlyAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("EverlyAlarm")

    AsyncFunction("canScheduleExactAlarms") {
      AlarmScheduler.canScheduleExact(context)
    }

    AsyncFunction("schedule") { payload: String ->
      val obj = JSONObject(payload)
      val next = AlarmScheduler.schedule(context, obj)
      mapOf("nextFireAt" to next)
    }

    AsyncFunction("cancel") { id: String ->
      AlarmScheduler.cancel(context, id)
    }

    AsyncFunction("rescheduleAll") { payload: String ->
      val arr = JSONArray(payload)
      val list = mutableListOf<JSONObject>()
      for (i in 0 until arr.length()) {
        arr.optJSONObject(i)?.let { list.add(it) }
      }
      AlarmScheduler.rescheduleAll(context, list)
    }

    // Native owns the live schedule after a fire, so JS reads it back rather
    // than second-guessing it from its own stale copy.
    AsyncFunction("getSchedules") {
      AlarmStore.all(context).map { payload ->
        val next = payload.optLong("nextFireAt", 0L)
        mapOf(
          "id" to payload.optString("id"),
          "nextFireAt" to if (next > 0L) next else null,
          "enabled" to payload.optBoolean("enabled", true)
        )
      }
    }

    AsyncFunction("testFire") { id: String ->
      val stored = AlarmStore.get(context, id)
      val payload = stored ?: JSONObject()
        .put("id", id)
        .put("title", "Test alarm")
        .put("description", "Manual test")
        .put("enabled", true)
        .put("loop", true)
        .put("maxRingMinutes", 1)
        .put("vibration", true)
        .put("snoozeMinutes", 5)
        .put("audioSource", "bundled")
        .put("bundledKey", "chime")

      payload.put("nextFireAt", System.currentTimeMillis() + 2_000L)
      AlarmScheduler.schedule(context, payload)
      val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      fmt.timeZone = TimeZone.getTimeZone("UTC")
      AlarmStore.setLastTestAt(context, fmt.format(Date()))
    }

    AsyncFunction("stopAlarm") {
      AlarmPlaybackService.stop(context)
    }

    AsyncFunction("snoozeAlarm") { minutes: Int ->
      AlarmPlaybackService.snooze(context, minutes.coerceIn(1, 120))
    }

    AsyncFunction("openExactAlarmSettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${context.packageName}")
        }
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${context.packageName}")
        }
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    AsyncFunction("openBatterySettings") {
      val pkg = context.packageName
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:$pkg")
        }
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:$pkg")
        }
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
      } catch (_: Exception) {
        val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(fallback)
      }
    }

    AsyncFunction("getReliabilityStatus") {
      val notifications = NotificationManagerCompat.from(context).areNotificationsEnabled()
      val exact = AlarmScheduler.canScheduleExact(context)
      // Volume 0 and an explicitly muted stream are distinct states; either one
      // means the reminder will not be audible. Never adjust it on the user's behalf.
      val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val alarmVolumeOk =
        audio.getStreamVolume(AudioManager.STREAM_ALARM) > 0 &&
          !audio.isStreamMute(AudioManager.STREAM_ALARM)
      val batteryHint = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        if (pm.isIgnoringBatteryOptimizations(context.packageName)) {
          "Battery optimization already ignored for Everly."
        } else {
          "Exclude Everly from battery optimization for reliable alarms."
        }
      } else {
        "Battery optimization not applicable on this Android version."
      }

      mapOf(
        "notifications" to notifications,
        "exactAlarms" to exact,
        "nativeModule" to true,
        "alarmVolumeOk" to alarmVolumeOk,
        "batteryHint" to batteryHint,
        "lastTestAt" to AlarmStore.getLastTestAt(context),
        "message" to when {
          !notifications -> "Enable notifications so Stop / Snooze / Done appear."
          !exact -> "Exact alarm access is off — open Alarm settings."
          !alarmVolumeOk -> "Alarm volume is silent — raise it or you will not hear reminders."
          else -> "Native alarm module ready."
        }
      )
    }
  }
}
