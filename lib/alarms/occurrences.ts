import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@alarms/occurrences/v1';

/** Newest-first log is capped so it cannot grow without bound. */
export const MAX_OCCURRENCES = 200;

export type OccurrenceState =
  | 'scheduled'
  | 'triggered'
  | 'snoozed'
  | 'completed'
  | 'dismissed'
  | 'timed_out';

export type Occurrence = {
  alarmId: string;
  state: OccurrenceState;
  at: number;
};

/**
 * How a ringing reminder ended, as reported by the native service.
 *
 * Completion is never inferred from the alarm merely stopping: only the Done
 * action means the user did the thing. Stop means they silenced it, and an
 * untouched alarm that ran out its ring time is a third outcome again.
 */
export function stateForReason(reason: string): OccurrenceState {
  switch (reason) {
    case 'triggered':
      return 'triggered';
    case 'done':
      return 'completed';
    case 'snooze':
      return 'snoozed';
    case 'timeout':
      return 'timed_out';
    default:
      return 'dismissed';
  }
}

async function readAll(): Promise<Occurrence[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Occurrence[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function recordOccurrence(
  alarmId: string,
  state: OccurrenceState,
  at: number
): Promise<void> {
  const next = [{ alarmId, state, at }, ...(await readAll())].slice(0, MAX_OCCURRENCES);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // History is a convenience; never fail a reminder over it.
  }
}

/** Newest first, optionally only for one reminder. */
export async function loadOccurrences(alarmId?: string): Promise<Occurrence[]> {
  const all = await readAll();
  return alarmId ? all.filter((o) => o.alarmId === alarmId) : all;
}

export async function clearOccurrences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
