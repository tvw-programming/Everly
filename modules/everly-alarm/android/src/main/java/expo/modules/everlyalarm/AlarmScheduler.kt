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
  private const val SHOW_ALARM_REQUEST_CODE = 90001

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

    // setAlarmClock is the strongest primitive Android offers: it is exempt from
    // Doze and battery-saver deferral, where setExactAndAllowWhileIdle is throttled
    // to roughly one fire per app every 9 minutes. It also puts the alarm icon in
    // the status bar, which is honest signalling for a reminder that will ring.
    am.setAlarmClock(AlarmManager.AlarmClockInfo(next, showAlarmIntent(ctx)), pi)
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

  /**
   * After a fire, queue the next occurrence for recurring alarms so music keeps
   * working without waiting for JS to open. A series that has ended is retired.
   */
  fun advanceAfterFire(ctx: Context, payload: JSONObject) {
    reschedule(ctx, payload, System.currentTimeMillis())
  }

  /**
   * Move a stored alarm to its next occurrence after [fromMillis], or retire it
   * when the series has ended. Shared by the post-fire advance and by clock or
   * time-zone changes, so both go through one recurrence implementation.
   */
  fun reschedule(ctx: Context, payload: JSONObject, fromMillis: Long) {
    val weekdays = mutableListOf<Int>()
    payload.optJSONArray("weekdays")?.let { arr ->
      for (i in 0 until arr.length()) weekdays.add(arr.optInt(i))
    }

    val next = NextOccurrence.compute(
      frequency = payload.optString("frequency", "daily"),
      hour24 = payload.optInt("hour24", 9),
      minute = payload.optInt("minute", 0),
      weekdays = weekdays,
      endDateMillis = endOfDayMillis(payload.optString("endDate", "")),
      fromMillis = fromMillis
    )

    if (next == null) {
      payload.put("enabled", false)
      AlarmStore.put(ctx, payload)
      cancel(ctx, payload.optString("id"))
      return
    }

    payload.put("nextFireAt", next)
    payload.put("enabled", true)
    schedule(ctx, payload)
  }

  /** "YYYY-MM-DD" to the last millisecond of that day, so the final day still rings. */
  private fun endOfDayMillis(ymd: String?): Long? {
    if (ymd.isNullOrBlank() || ymd == "null") return null
    val parts = ymd.split("-")
    if (parts.size != 3) return null
    val year = parts[0].toIntOrNull() ?: return null
    val month = parts[1].toIntOrNull() ?: return null
    val day = parts[2].toIntOrNull() ?: return null
    val cal = java.util.Calendar.getInstance()
    cal.set(year, month - 1, day, 23, 59, 59)
    cal.set(java.util.Calendar.MILLISECOND, 999)
    return cal.timeInMillis
  }

  /** Where the system sends the user if they tap the status-bar alarm icon. */
  private fun showAlarmIntent(ctx: Context): PendingIntent {
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
      ?: Intent(Intent.ACTION_MAIN)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(
      ctx,
      SHOW_ALARM_REQUEST_CODE,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
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
