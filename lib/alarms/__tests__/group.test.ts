import { groupAlarmsByCategory, visibleAlarmCategories } from '../group';
import type { AlarmReminder } from '../types';

function alarm(over: Partial<AlarmReminder> = {}): AlarmReminder {
  return {
    id: over.id ?? 'a1',
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

describe('groupAlarmsByCategory', () => {
  it('returns an entry for every category even when empty', () => {
    const map = groupAlarmsByCategory([]);
    expect(Object.keys(map).sort()).toEqual([
      'financial',
      'personal',
      'professional',
      'social',
    ]);
    expect(map.personal).toEqual([]);
  });

  it('files each alarm under its own category', () => {
    const map = groupAlarmsByCategory([
      alarm({ id: 'a', category: 'personal' }),
      alarm({ id: 'b', category: 'financial' }),
      alarm({ id: 'c', category: 'personal' }),
    ]);
    expect(map.personal.map((a) => a.id)).toEqual(['a', 'c']);
    expect(map.financial.map((a) => a.id)).toEqual(['b']);
    expect(map.social).toEqual([]);
  });

  it('sorts a category by time of day, earliest first', () => {
    const map = groupAlarmsByCategory([
      alarm({ id: 'evening', hour12: 9, minute: 0, period: 'PM' }),
      alarm({ id: 'midnight', hour12: 12, minute: 0, period: 'AM' }),
      alarm({ id: 'noon', hour12: 12, minute: 0, period: 'PM' }),
      alarm({ id: 'morning', hour12: 8, minute: 45, period: 'AM' }),
    ]);
    expect(map.personal.map((a) => a.id)).toEqual([
      'midnight',
      'morning',
      'noon',
      'evening',
    ]);
  });
});

describe('visibleAlarmCategories', () => {
  it('lists only categories holding at least one enabled alarm', () => {
    const map = groupAlarmsByCategory([
      alarm({ id: 'a', category: 'personal' }),
      alarm({ id: 'b', category: 'social', enabled: false }),
    ]);
    expect(visibleAlarmCategories(map)).toEqual(['personal']);
  });

  it('is empty when nothing is enabled anywhere', () => {
    const map = groupAlarmsByCategory([alarm({ enabled: false })]);
    expect(visibleAlarmCategories(map)).toEqual([]);
  });

  it('keeps categories in the canonical board order', () => {
    const map = groupAlarmsByCategory([
      alarm({ id: 'a', category: 'financial' }),
      alarm({ id: 'b', category: 'personal' }),
      alarm({ id: 'c', category: 'professional' }),
    ]);
    expect(visibleAlarmCategories(map)).toEqual([
      'personal',
      'professional',
      'financial',
    ]);
  });
});
