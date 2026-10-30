package expo.modules.everlyalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Restores alarms after the system drops them.
 *
 * Two different jobs, and the difference matters:
 *  - After a reboot the stored absolute times are still correct, so they are
 *    simply re-registered. Nothing is played: a missed occurrence is reported
 *    when the app opens, never rung on boot, and newer Android versions forbid
 *    starting a media foreground service from here anyway.
 *  - After a time-zone or manual clock change the stored absolute times point
 *    at the wrong wall-clock moment, so each alarm is recomputed from its rule.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    when (intent?.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_LOCKED_BOOT_COMPLETED -> restoreAfterBoot(context)

      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_TIME_CHANGED -> recomputeForNewClock(context)

      else -> return
    }
  }

  private fun restoreAfterBoot(context: Context) {
    val now = System.currentTimeMillis()
    for (payload in AlarmStore.all(context)) {
      if (!payload.optBoolean("enabled", true)) continue
      if (payload.optLong("nextFireAt", 0L) > now) {
        AlarmScheduler.schedule(context, payload)
      }
      // A time that already passed stays missed; the app reports it on open.
    }
  }

  /**
   * An 08:00 reminder must still be 08:00 local after the clock moves, not the
   * old absolute instant, so every enabled alarm goes back through the rule.
   */
  private fun recomputeForNewClock(context: Context) {
    val now = System.currentTimeMillis()
    for (payload in AlarmStore.all(context)) {
      if (!payload.optBoolean("enabled", true)) continue
      AlarmScheduler.reschedule(context, payload, now)
    }
  }
}
