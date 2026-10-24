import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Reminder } from './types';

const STORAGE_KEY = '@reminders/v1';

const memoryFallback = new Map<string, string>();

async function readRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return memoryFallback.get(STORAGE_KEY) ?? null;
      }
    }
    return memoryFallback.get(STORAGE_KEY) ?? null;
  }
}

async function writeRaw(value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
    return;
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, value);
        return;
      } catch {
        // fall through
      }
    }
    memoryFallback.set(STORAGE_KEY, value);
  }
}

export async function loadReminders(): Promise<Reminder[]> {
  const raw = await readRaw();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await writeRaw(JSON.stringify(reminders));
}

export async function upsertReminder(reminder: Reminder): Promise<Reminder[]> {
  const list = await loadReminders();
  const idx = list.findIndex((r) => r.id === reminder.id);
  if (idx >= 0) {
    list[idx] = reminder;
  } else {
    list.unshift(reminder);
  }
  await saveReminders(list);
  return list;
}

export async function deleteReminder(id: string): Promise<Reminder[]> {
  const list = (await loadReminders()).filter((r) => r.id !== id);
  await saveReminders(list);
  return list;
}

export async function getReminderById(id: string): Promise<Reminder | undefined> {
  const list = await loadReminders();
  return list.find((r) => r.id === id);
}
