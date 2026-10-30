import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  MAX_OCCURRENCES,
  loadOccurrences,
  recordOccurrence,
  stateForReason,
} from '../occurrences';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const T = Date.parse('2026-10-27T08:30:00.000Z');

beforeEach(async () => {
  await AsyncStorage.clear();
});

/**
 * The spec is explicit that completion must not be inferred from the alarm
 * merely stopping: Stop, Done and the ring timeout are three different
 * outcomes and must be stored as such.
 */
describe('stateForReason', () => {
  it('records completed only for the Done action', () => {
    expect(stateForReason('done')).toBe('completed');
  });

  it('records dismissed for Stop, never completed', () => {
    expect(stateForReason('stop')).toBe('dismissed');
    expect(stateForReason('stop')).not.toBe('completed');
  });

  it('records timed_out when the max ring duration elapses', () => {
    expect(stateForReason('timeout')).toBe('timed_out');
  });

  it('records snoozed', () => {
    expect(stateForReason('snooze')).toBe('snoozed');
  });

  /** The service reports the start of a ring too; it is not a dismissal. */
  it('records triggered when the reminder started ringing', () => {
    expect(stateForReason('triggered')).toBe('triggered');
  });

  it('falls back to dismissed for an unrecognised reason', () => {
    expect(stateForReason('something-else')).toBe('dismissed');
  });
});

describe('recordOccurrence', () => {
  it('records a triggered occurrence when an alarm starts ringing', async () => {
    await recordOccurrence('a1', 'triggered', T);

    const list = await loadOccurrences();
    expect(list).toEqual([{ alarmId: 'a1', state: 'triggered', at: T }]);
  });

  it('records snoozed without ending the occurrence series', async () => {
    await recordOccurrence('a1', 'triggered', T);
    await recordOccurrence('a1', 'snoozed', T + 1000);
    await recordOccurrence('a1', 'completed', T + 2000);

    const states = (await loadOccurrences('a1')).map((o) => o.state);
    expect(states).toEqual(['completed', 'snoozed', 'triggered']);
  });

  it('caps the log so it cannot grow without bound', async () => {
    for (let i = 0; i < MAX_OCCURRENCES + 25; i++) {
      await recordOccurrence('a1', 'triggered', T + i);
    }

    const list = await loadOccurrences();
    expect(list).toHaveLength(MAX_OCCURRENCES);
    // The newest survive; the oldest fall off.
    expect(list[0].at).toBe(T + MAX_OCCURRENCES + 24);
  });
});

describe('loadOccurrences', () => {
  it('returns occurrences newest first, filtered by alarm id', async () => {
    await recordOccurrence('a1', 'triggered', T);
    await recordOccurrence('a2', 'triggered', T + 1000);
    await recordOccurrence('a1', 'completed', T + 2000);

    const mine = await loadOccurrences('a1');
    expect(mine.map((o) => o.at)).toEqual([T + 2000, T]);
    expect(mine.every((o) => o.alarmId === 'a1')).toBe(true);
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await loadOccurrences()).toEqual([]);
  });

  it('survives corrupt stored JSON', async () => {
    await AsyncStorage.setItem('@alarms/occurrences/v1', '{not json');
    expect(await loadOccurrences()).toEqual([]);
  });
});

/**
 * A queued reminder that waited past its own ring window is discarded. It must
 * still leave a trace, or the person never learns the reminder existed.
 */
describe('dropped queue entries', () => {
  it('maps a dropped reminder to a visible timed_out state', () => {
    expect(stateForReason('dropped')).toBe('timed_out');
  });
});
