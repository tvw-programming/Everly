import { AppState, type AppStateStatus, Platform } from 'react-native';

import { rescheduleAllAlarms } from './native';
import { computeNextFireAt } from './schedule';
import { saveAlarms } from './storage';
import type { AlarmReminder } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@alarms/v1';
const MISSED_KEY = '@alarms/missed/v1';

async function readRaw(): Promise<AlarmReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as AlarmReminder[];
    return Array.isArray(list) ? list : [];
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const list = JSON.parse(raw) as AlarmReminder[];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

/** Alarms whose previously scheduled fire time passed while the app was away. */
export type MissedAlarm = { id: string; title: string; scheduledAt: number };

export async function loadMissedAlarms(): Promise<MissedAlarm[]> {
  try {
    const raw = await AsyncStorage.getItem(MISSED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as MissedAlarm[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function clearMissedAlarms(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MISSED_KEY);
  } catch {
    // ignore
  }
}

/**
 * Recompute nextFireAt, record missed (do not auto-play), persist, and
 * push schedules into native / notification fallback.
 */
export async function syncAlarmsOnLaunch(now: Date = new Date()): Promise<{
  alarms: AlarmReminder[];
  missed: MissedAlarm[];
}> {
  const raw = await readRaw();
  const nowMs = now.getTime();
  const missed: MissedAlarm[] = [];

  const updated = raw.map((alarm) => {
    const previous = alarm.nextFireAt;
    let next = { ...alarm };

    if (
      alarm.enabled &&
      typeof previous === 'number' &&
      previous < nowMs - 30_000
    ) {
      missed.push({ id: alarm.id, title: alarm.title, scheduledAt: previous });
      // One-time alarms that already fired/missed stay off
      if (alarm.frequency === 'once') {
        next = { ...next, enabled: false };
      }
    }

    next = {
      ...next,
      nextFireAt: computeNextFireAt(next, now),
      updatedAt: new Date().toISOString(),
    };
    return next;
  });

  const alarms = await saveAlarms(updated);
  await rescheduleAllAlarms(alarms);

  if (missed.length) {
    try {
      const prior = await loadMissedAlarms();
      const byId = new Map(prior.map((m) => [m.id + m.scheduledAt, m]));
      for (const m of missed) byId.set(m.id + m.scheduledAt, m);
      await AsyncStorage.setItem(MISSED_KEY, JSON.stringify([...byId.values()]));
    } catch {
      // ignore
    }
  }

  return { alarms, missed: await loadMissedAlarms() };
}

let attached = false;

/** Call once from root layout — sync on mount and when returning to foreground. */
export function attachAlarmBootstrap(): () => void {
  if (attached) return () => undefined;
  attached = true;

  void syncAlarmsOnLaunch();

  const onChange = (state: AppStateStatus) => {
    if (state === 'active') void syncAlarmsOnLaunch();
  };
  const sub = AppState.addEventListener('change', onChange);
  return () => {
    attached = false;
    sub.remove();
  };
}
