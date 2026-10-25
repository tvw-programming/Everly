package expo.modules.everlyalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Reschedule future alarms after reboot — never plays music at boot. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (
      action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_LOCKED_BOOT_COMPLETED
    ) {
      return
    }
    val now = System.currentTimeMillis()
    for (payload in AlarmStore.all(context)) {
      if (!payload.optBoolean("enabled", true)) continue
      val next = payload.optLong("nextFireAt", 0L)
      if (next > now) {
        AlarmScheduler.schedule(context, payload)
      }
      // Missed alarms are not auto-played (plan: show on open later)
    }
  }
}
