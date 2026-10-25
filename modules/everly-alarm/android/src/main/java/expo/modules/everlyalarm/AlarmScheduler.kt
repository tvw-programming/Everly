package expo.modules.everlyalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject

object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.everlyalarm.FIRE"
  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_PAYLOAD = "payload"

  fun canScheduleExact(ctx: Context): Boolean {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      am.canScheduleExactAlarms()
    } else {
      true
    }
  }

  fun schedule(ctx: Context, payload: JSONObject): Long? {
    val id = payload.optString("id")
    if (id.isBlank()) return null
    if (!payload.optBoolean("enabled", true)) {
      cancel(ctx, id)
      AlarmStore.remove(ctx, payload.optString("id"))
      return null
    }

    var next = payload.optLong("nextFireAt", 0L)
    if (next <= System.currentTimeMillis()) {
      // Push at least 5s ahead so test/edge cases still fire
      next = System.currentTimeMillis() + 5_000L
      payload.put("nextFireAt", next)
    }

    AlarmStore.put(ctx, payload)

    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = pendingFire(ctx, id, payload)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pi)
    } else {
      @Suppress("DEPRECATION")
      am.setExact(AlarmManager.RTC_WAKEUP, next, pi)
    }
    return next
  }

  fun cancel(ctx: Context, id: String) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(pendingFire(ctx, id, null))
    AlarmStore.remove(ctx, id)
  }

  fun rescheduleAll(ctx: Context, payloads: List<JSONObject>) {
    // Cancel existing first
    for (existing in AlarmStore.all(ctx)) {
      val id = existing.optString("id")
      if (id.isNotBlank()) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(pendingFire(ctx, id, null))
      }
    }
    AlarmStore.clearAll(ctx)
    for (p in payloads) {
      if (p.optBoolean("enabled", true)) {
        schedule(ctx, p)
      }
    }
  }

  fun scheduleSnooze(ctx: Context, id: String, minutes: Int) {
    val base = AlarmStore.get(ctx, id) ?: JSONObject().put("id", id).put("title", "Alarm")
    val next = System.currentTimeMillis() + minutes * 60_000L
    base.put("nextFireAt", next)
    base.put("enabled", true)
    schedule(ctx, base)
  }

  private fun pendingFire(ctx: Context, id: String, payload: JSONObject?): PendingIntent {
    val intent = Intent(ctx, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtra(EXTRA_ALARM_ID, id)
      if (payload != null) {
        putExtra(EXTRA_PAYLOAD, payload.toString())
      }
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(ctx, id.hashCode(), intent, flags)
  }
}
