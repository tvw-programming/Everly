package expo.modules.everlyalarm

import java.util.Calendar

/**
 * When a recurring reminder should next ring.
 *
 * Deliberately free of Android types so it can be unit-tested on the JVM: this
 * is the one piece of the alarm path where an off-by-one lands a reminder a day
 * or twelve hours out of place.
 */
object NextOccurrence {

  /** How far ahead to look before giving up; a week plus a day covers every weekly case. */
  private const val SEARCH_DAYS = 8

  /**
   * The next fire time strictly after [fromMillis], or null when the series has
   * ended — a one-time reminder, a weekly one with no weekday selected, or an
   * occurrence that would fall past [endDateMillis].
   *
   * Being strict about "after" is what makes this correct in both uses: called
   * the moment an alarm fires, today's slot is not after now, so it rolls
   * forward; called on a clock change, today's later slot is still eligible.
   *
   * @param weekdays 0=Sunday … 6=Saturday, matching the JS side.
   */
  fun compute(
    frequency: String,
    hour24: Int,
    minute: Int,
    weekdays: List<Int>,
    endDateMillis: Long?,
    fromMillis: Long
  ): Long? {
    if (frequency == "once") return null
    if (frequency == "weekly" && weekdays.isEmpty()) return null

    val cal = Calendar.getInstance()
    for (dayOffset in 0..SEARCH_DAYS) {
      cal.timeInMillis = fromMillis
      cal.add(Calendar.DAY_OF_YEAR, dayOffset)
      cal.set(Calendar.HOUR_OF_DAY, hour24)
      cal.set(Calendar.MINUTE, minute)
      cal.set(Calendar.SECOND, 0)
      cal.set(Calendar.MILLISECOND, 0)

      val candidate = cal.timeInMillis
      if (candidate <= fromMillis) continue

      if (frequency == "weekly") {
        val jsWeekday = cal.get(Calendar.DAY_OF_WEEK) - 1
        if (!weekdays.contains(jsWeekday)) continue
      }

      if (endDateMillis != null && candidate > endDateMillis) return null
      return candidate
    }
    return null
  }
}
