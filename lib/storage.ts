import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Reminder } from './types';

const STORAGE_KEY = '@reminders/v1';

export async function loadReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
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
