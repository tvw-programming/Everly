import { reconcileSchedules, type NativeSchedule } from '../reconcile';
import type { AlarmReminder } from '../types';

const NOW = Date.parse('2026-10-27T09:00:00.000Z');
const MINUTE = 60_000;

function alarm(over: Partial<AlarmReminder> = {}): AlarmReminder {
  return {
    id: 'a1',
    title: 'Take medicine',
    category: 'personal',
    hour12: 8,
    minute: 30,
    period: 'AM',
    startDate: '2026-10-26',
    frequency: 'daily',
    weekdays: [],
    enabled: true,
    audio: { source: 'bundled', bundledKey: 'chime', displayName: 'Chime' },
    playback: { mode: 'once', maxRingMinutes: 5 },
    vibration: true,
    snoozeMinutes: 10,
    createdAt: '2026-10-26T00:00:00.000Z',
    updatedAt: '2026-10-26T00:00:00.000Z',
    ...over,
  };
}

describe('reconcileSchedules', () => {
  it('takes the native nextFireAt as truth when the two disagree', () => {
    const stored = [alarm({ nextFireAt: NOW + 5 * MINUTE })];
    const native: NativeSchedule[] = [
      { id: 'a1', nextFireAt: NOW + 90 * MINUTE, enabled: true },
    ];

    const { alarms } = reconcileSchedules(stored, native, NOW);
    expect(alarms[0].nextFireAt).toBe(NOW + 90 * MINUTE);
  });

  /**
   * The observed bug: native fired on time and advanced its own copy, leaving
   * the stored time in the past. That is a completed alarm, not a missed one.
   */
  it('reports nothing missed when native already advanced past the stored time', () => {
    const stored = [alarm({ nextFireAt: NOW - 60 * MINUTE })];
    const native: NativeSchedule[] = [
      { id: 'a1', nextFireAt: NOW + 23 * 60 * MINUTE, enabled: true },
    ];

    const { missed } = reconcileSchedules(stored, native, NOW);
    expect(missed).toEqual([]);
  });

  it('reports missed only when native agrees the time passed unfired', () => {
    const stored = [alarm({ nextFireAt: NOW - 60 * MINUTE })];
    const native: NativeSchedule[] = [
      { id: 'a1', nextFireAt: NOW - 60 * MINUTE, enabled: true },
    ];

    const { missed } = reconcileSchedules(stored, native, NOW);
    expect(missed).toEqual([
      { id: 'a1', title: 'Take medicine', scheduledAt: NOW - 60 * MINUTE },
    ]);
  });

  it('falls back to stored values when native returns no row for an alarm', () => {
    const stored = [alarm({ nextFireAt: NOW - 60 * MINUTE })];

    const { alarms, missed } = reconcileSchedules(stored, [], NOW);
    expect(alarms[0].nextFireAt).toBe(NOW - 60 * MINUTE);
    expect(missed.map((m) => m.id)).toEqual(['a1']);
  });

  it('leaves a disabled alarm unscheduled and unmissed', () => {
    const stored = [alarm({ enabled: false, nextFireAt: NOW - 60 * MINUTE })];
    const native: NativeSchedule[] = [
      { id: 'a1', nextFireAt: null, enabled: false },
    ];

    const { alarms, missed } = reconcileSchedules(stored, native, NOW);
    expect(alarms[0].enabled).toBe(false);
    expect(missed).toEqual([]);
  });

  it('ignores a stored time that only just passed, within the grace window', () => {
    const stored = [alarm({ nextFireAt: NOW - 10_000 })];

    const { missed } = reconcileSchedules(stored, [], NOW);
    expect(missed).toEqual([]);
  });

  it('retires a one-time alarm that was missed', () => {
    const stored = [alarm({ frequency: 'once', nextFireAt: NOW - 60 * MINUTE })];

    const { alarms, missed } = reconcileSchedules(stored, [], NOW);
    expect(alarms[0].enabled).toBe(false);
    expect(missed.map((m) => m.id)).toEqual(['a1']);
  });

  it('keeps every stored alarm in the returned list', () => {
    const stored = [alarm({ id: 'a1' }), alarm({ id: 'a2' }), alarm({ id: 'a3' })];

    const { alarms } = reconcileSchedules(stored, [], NOW);
    expect(alarms.map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);
  });
});

/**
 * A one-time reminder is retired by native the moment it fires, so there is no
 * native row left to prove it ran. Without the recorded outcome it looks
 * identical to one that never rang.
 */
describe('reconcileSchedules with recorded outcomes', () => {
  it('does not report a miss when an outcome proves the alarm fired', () => {
    const stored = [alarm({ frequency: 'once', nextFireAt: NOW - 60 * MINUTE })];
    const outcomes = [{ alarmId: 'a1', at: NOW - 59 * MINUTE }];

    const { missed } = reconcileSchedules(stored, [], NOW, outcomes);
    expect(missed).toEqual([]);
  });

  it('still reports a miss when the outcome belongs to a different alarm', () => {
    const stored = [alarm({ nextFireAt: NOW - 60 * MINUTE })];
    const outcomes = [{ alarmId: 'other', at: NOW - 59 * MINUTE }];

    const { missed } = reconcileSchedules(stored, [], NOW, outcomes);
    expect(missed.map((m) => m.id)).toEqual(['a1']);
  });

  it('ignores an outcome from before the scheduled time', () => {
    const stored = [alarm({ nextFireAt: NOW - 60 * MINUTE })];
    const outcomes = [{ alarmId: 'a1', at: NOW - 120 * MINUTE }];

    const { missed } = reconcileSchedules(stored, [], NOW, outcomes);
    expect(missed.map((m) => m.id)).toEqual(['a1']);
  });
})
