package expo.modules.everlyalarm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.Calendar

/**
 * Recurrence maths, with no Android dependencies so it runs on the JVM.
 *
 * Every expectation is built with the same Calendar the implementation uses, so
 * the suite is independent of the machine's time zone.
 */
class NextOccurrenceTest {

  private fun at(year: Int, month: Int, day: Int, hour: Int, minute: Int): Long {
    val cal = Calendar.getInstance()
    cal.set(year, month - 1, day, hour, minute, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.timeInMillis
  }

  private fun weekdayOf(millis: Int = 0, at: Long): Int {
    val cal = Calendar.getInstance()
    cal.timeInMillis = at
    return cal.get(Calendar.DAY_OF_WEEK) - 1
  }

  @Test
  fun `daily alarm moves to tomorrow at the same time`() {
    val firedAt = at(2026, 10, 26, 8, 30)
    val next = NextOccurrence.compute("daily", 8, 30, emptyList(), null, firedAt)
    assertEquals(at(2026, 10, 27, 8, 30), next)
  }

  @Test
  fun `midnight alarm fires at 00-00 not noon`() {
    val firedAt = at(2026, 10, 26, 0, 0)
    val next = NextOccurrence.compute("daily", 0, 0, emptyList(), null, firedAt)
    assertEquals(at(2026, 10, 27, 0, 0), next)
  }

  @Test
  fun `noon alarm fires at 12-00 not midnight`() {
    val firedAt = at(2026, 10, 26, 12, 0)
    val next = NextOccurrence.compute("daily", 12, 0, emptyList(), null, firedAt)
    assertEquals(at(2026, 10, 27, 12, 0), next)
  }

  @Test
  fun `daily alarm later today is used before tomorrow`() {
    val now = at(2026, 10, 26, 6, 0)
    val next = NextOccurrence.compute("daily", 22, 15, emptyList(), null, now)
    assertEquals(at(2026, 10, 26, 22, 15), next)
  }

  @Test
  fun `weekly alarm with only today selected lands 7 days out`() {
    val firedAt = at(2026, 10, 26, 9, 0)
    val today = weekdayOf(at = firedAt)
    val next = NextOccurrence.compute("weekly", 9, 0, listOf(today), null, firedAt)
    assertEquals(at(2026, 11, 2, 9, 0), next)
  }

  @Test
  fun `weekly alarm picks the nearest selected weekday`() {
    val firedAt = at(2026, 10, 26, 9, 0)
    val today = weekdayOf(at = firedAt)
    val twoDaysOn = (today + 2) % 7
    val fiveDaysOn = (today + 5) % 7
    val next = NextOccurrence.compute(
      "weekly",
      9,
      0,
      listOf(fiveDaysOn, twoDaysOn),
      null,
      firedAt
    )
    assertEquals(at(2026, 10, 28, 9, 0), next)
  }

  @Test
  fun `returns null once past endDate`() {
    val firedAt = at(2026, 10, 26, 8, 30)
    val endOfToday = at(2026, 10, 26, 23, 59)
    assertNull(NextOccurrence.compute("daily", 8, 30, emptyList(), endOfToday, firedAt))
  }

  @Test
  fun `an occurrence exactly on the endDate still runs`() {
    val firedAt = at(2026, 10, 26, 8, 30)
    val endOfTomorrow = at(2026, 10, 27, 23, 59)
    val next = NextOccurrence.compute("daily", 8, 30, emptyList(), endOfTomorrow, firedAt)
    assertEquals(at(2026, 10, 27, 8, 30), next)
  }

  @Test
  fun `once frequency returns null`() {
    val firedAt = at(2026, 10, 26, 8, 30)
    assertNull(NextOccurrence.compute("once", 8, 30, emptyList(), null, firedAt))
  }

  @Test
  fun `weekly with no weekdays selected returns null rather than firing daily`() {
    val firedAt = at(2026, 10, 26, 9, 0)
    assertNull(NextOccurrence.compute("weekly", 9, 0, emptyList(), null, firedAt))
  }
}
