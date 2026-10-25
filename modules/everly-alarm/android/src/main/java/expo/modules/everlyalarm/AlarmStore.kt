package expo.modules.everlyalarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Persists native alarm payloads so BootReceiver can reschedule without JS. */
object AlarmStore {
  private const val PREFS = "everly_alarms"
  private const val KEY_MAP = "alarms_json"
  private const val KEY_ACTIVE = "active_id"
  private const val KEY_LAST_TEST = "last_test_at"

  private fun prefs(ctx: Context) =
    ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun put(ctx: Context, payload: JSONObject) {
    val id = payload.optString("id")
    if (id.isBlank()) return
    val map = loadMap(ctx)
    map.put(id, payload)
    saveMap(ctx, map)
  }

  fun remove(ctx: Context, id: String) {
    val map = loadMap(ctx)
    map.remove(id)
    saveMap(ctx, map)
  }

  fun get(ctx: Context, id: String): JSONObject? {
    val raw = loadMap(ctx).optJSONObject(id) ?: return null
    return raw
  }

  fun all(ctx: Context): List<JSONObject> {
    val map = loadMap(ctx)
    val out = mutableListOf<JSONObject>()
    val keys = map.keys()
    while (keys.hasNext()) {
      val k = keys.next()
      map.optJSONObject(k)?.let { out.add(it) }
    }
    return out
  }

  fun clearAll(ctx: Context) {
    prefs(ctx).edit().remove(KEY_MAP).apply()
  }

  fun setActiveId(ctx: Context, id: String?) {
    prefs(ctx).edit().putString(KEY_ACTIVE, id).apply()
  }

  fun getActiveId(ctx: Context): String? =
    prefs(ctx).getString(KEY_ACTIVE, null)

  fun setLastTestAt(ctx: Context, iso: String) {
    prefs(ctx).edit().putString(KEY_LAST_TEST, iso).apply()
  }

  fun getLastTestAt(ctx: Context): String? =
    prefs(ctx).getString(KEY_LAST_TEST, null)

  private fun loadMap(ctx: Context): JSONObject {
    val raw = prefs(ctx).getString(KEY_MAP, null) ?: return JSONObject()
    return try {
      JSONObject(raw)
    } catch (_: Exception) {
      JSONObject()
    }
  }

  private fun saveMap(ctx: Context, map: JSONObject) {
    prefs(ctx).edit().putString(KEY_MAP, map.toString()).apply()
  }

  fun replaceAll(ctx: Context, payloads: JSONArray) {
    val map = JSONObject()
    for (i in 0 until payloads.length()) {
      val obj = payloads.optJSONObject(i) ?: continue
      val id = obj.optString("id")
      if (id.isNotBlank()) map.put(id, obj)
    }
    saveMap(ctx, map)
  }
}
