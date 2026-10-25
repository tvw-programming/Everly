import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { computeNextFireAt } from './schedule';
import type { AlarmReminder } from './types';

const KEY = '@alarms/v1';
const memory = new Map<string, string>();

async function read(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return memory.get(KEY) ?? null;
      }
    }
    return memory.get(KEY) ?? null;
  }
}

async function write(value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value);
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(KEY, value);
        return;
      } catch {
        // fall through
      }
    }
    memory.set(KEY, value);
  }
}

function withNext(r: AlarmReminder): AlarmReminder {
  return { ...r, nextFireAt: computeNextFireAt(r) };
}

export async function loadAlarms(): Promise<AlarmReminder[]> {
  const raw = await read();
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as AlarmReminder[];
    if (!Array.isArray(list)) return [];
    return list.map(withNext).sort(sortAlarms);
  } catch {
    return [];
  }
}

function sortAlarms(a: AlarmReminder, b: AlarmReminder): number {
  if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
  const an = a.nextFireAt ?? Number.MAX_SAFE_INTEGER;
  const bn = b.nextFireAt ?? Number.MAX_SAFE_INTEGER;
  return an - bn;
}

export async function saveAlarms(list: AlarmReminder[]): Promise<AlarmReminder[]> {
  const next = list.map(withNext).sort(sortAlarms);
  await write(JSON.stringify(next));
  return next;
}

export async function upsertAlarm(alarm: AlarmReminder): Promise<AlarmReminder[]> {
  const list = await loadAlarms();
  const idx = list.findIndex((a) => a.id === alarm.id);
  const stamped = {
    ...alarm,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = stamped;
  else list.push(stamped);
  return saveAlarms(list);
}

export async function deleteAlarm(id: string): Promise<AlarmReminder[]> {
  const list = (await loadAlarms()).filter((a) => a.id !== id);
  return saveAlarms(list);
}

export async function getAlarm(id: string): Promise<AlarmReminder | null> {
  return (await loadAlarms()).find((a) => a.id === id) ?? null;
}
