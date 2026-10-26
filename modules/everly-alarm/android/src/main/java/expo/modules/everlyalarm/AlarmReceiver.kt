package expo.modules.everlyalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != AlarmScheduler.ACTION_FIRE) return
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val raw = intent.getStringExtra(AlarmScheduler.EXTRA_PAYLOAD)
    val payload = when {
      !raw.isNullOrBlank() -> try {
        JSONObject(raw)
      } catch (_: Exception) {
        AlarmStore.get(context, id)
      }
      else -> AlarmStore.get(context, id)
    } ?: return

    // Always hand it to the service, which decides whether to ring it now or
    // queue it behind the reminder already playing. One song at a time is
    // enforced there, where the queue lives.
    val service = Intent(context, AlarmPlaybackService::class.java).apply {
      action = AlarmPlaybackService.ACTION_START
      putExtra(AlarmScheduler.EXTRA_ALARM_ID, id)
      putExtra(AlarmScheduler.EXTRA_PAYLOAD, payload.toString())
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(service)
    } else {
      context.startService(service)
    }

    // Queue the following occurrence while this one plays (closed-app recurring).
    AlarmScheduler.advanceAfterFire(context, JSONObject(payload.toString()))
  }
}
