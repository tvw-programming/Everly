import { schedulableAlarms } from '../schedule';
import type { AlarmReminder } from '../types';

const NOW = new Date('2026-10-27T15:00:00');

function alarm(over: Partial<AlarmReminder> = {}): AlarmReminder {
  return {
    id: 'a1',
    title: 'Take medicine',
    category: 'personal',
    hour12: 8,
    minute: 0,
    period: 'AM',
    startDate: '2026-10-27',
    frequency: 'daily',
    weekdays: [],
    enabled: true,
    audio: { source: 'bundled', bundledKey: 'chime', displayName: 'Chime' },
    playback: { mode: 'once', maxRingMinutes: 5 },
    vibration: true,
    snoozeMinutes: 10,
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    ...over,
  };
}

/**
 * The native scheduler floors any non-future time to "a few seconds from now",
 * so handing it a series with nothing left makes a retired reminder ring
 * almost immediately — every time the app is foregrounded.
 */
describe('schedulableAlarms', () => {
  it('keeps a recurring alarm that still has a next occurrence', () => {
    expect(schedulableAlarms([alarm()], NOW).map((a) => a.id)).toEqual(['a1']);
  });

  it('drops a disabled alarm', () => {
    expect(schedulableAlarms([alarm({ enabled: false })], NOW)).toEqual([]);
  });

  it('drops a one-time alarm whose time already passed today', () => {
    const past = alarm({ frequency: 'once', hour12: 8, period: 'AM' });
    expect(schedulableAlarms([past], NOW)).toEqual([]);
  });

  it('drops an alarm past its end date', () => {
    const ended = alarm({ endDate: '2026-10-20' });
    expect(schedulableAlarms([ended], NOW)).toEqual([]);
  });

  it('keeps a one-time alarm still ahead of now', () => {
    const later = alarm({ frequency: 'once', hour12: 11, period: 'PM' });
    expect(schedulableAlarms([later], NOW).map((a) => a.id)).toEqual(['a1']);
  });

  it('filters a mixed list without disturbing the survivors order', () => {
    const list = [
      alarm({ id: 'keep1' }),
      alarm({ id: 'drop', enabled: false }),
      alarm({ id: 'keep2' }),
    ];
    expect(schedulableAlarms(list, NOW).map((a) => a.id)).toEqual(['keep1', 'keep2']);
  });
});
