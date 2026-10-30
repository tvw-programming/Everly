import type { MissedAlarm } from './bootstrap';
import type { AlarmReminder } from './types';

/** Evidence from the native service that a reminder actually rang. */
export type FiredOutcome = { alarmId: string; at: number };

/** One row of the native module's view of what is actually scheduled. */
export type NativeSchedule = {
  id: string;
  nextFireAt: number | null;
  enabled: boolean;
};

/**
 * A reminder whose time passed only moments ago was probably ringing as the app
 * opened; treating it as missed produces a banner that contradicts the alarm the
 * user is looking at.
 */
const GRACE_MS = 30_000;

/**
 * Merge the native module's schedule into the stored alarms and decide what was
 * genuinely missed.
 *
 * Native owns the live schedule: once an alarm fires it advances its own copy
 * without waiting for JS to open. The stored `nextFireAt` is therefore routinely
 * in the past for alarms that worked perfectly, and must not be read as evidence
 * of a miss on its own — only when native agrees it never moved on.
 */
export function reconcileSchedules(
  stored: AlarmReminder[],
  native: NativeSchedule[],
  now: number,
  outcomes: FiredOutcome[] = []
): { alarms: AlarmReminder[]; missed: MissedAlarm[] } {
  const byId = new Map(native.map((row) => [row.id, row]));
  const missed: MissedAlarm[] = [];

  const alarms = stored.map((alarm) => {
    const row = byId.get(alarm.id);
    const scheduledAt = alarm.nextFireAt;
    const elapsed =
      typeof scheduledAt === 'number' && scheduledAt < now - GRACE_MS;

    // Native moving past the stored time means it fired and advanced — not a miss.
    const nativeAdvanced =
      row != null && row.nextFireAt != null && row.nextFireAt > (scheduledAt ?? 0);

    // A one-time reminder is retired the moment it fires, so no native row
    // survives to prove it ran. Its recorded outcome is that proof.
    const outcomeProvesItFired =
      scheduledAt != null &&
      outcomes.some((o) => o.alarmId === alarm.id && o.at >= scheduledAt);

    const wasMissed = alarm.enabled && elapsed && !nativeAdvanced && !outcomeProvesItFired;
    if (wasMissed) {
      missed.push({ id: alarm.id, title: alarm.title, scheduledAt: scheduledAt! });
    }

    return {
      ...alarm,
      // A one-time reminder that already passed does not come back.
      enabled: wasMissed && alarm.frequency === 'once' ? false : alarm.enabled,
      nextFireAt: row ? row.nextFireAt : alarm.nextFireAt,
    };
  });

  return { alarms, missed };
}
