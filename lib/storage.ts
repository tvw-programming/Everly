import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { ReminderTask, SubCategory, TaskCategory, TaskPriority } from './types';

const STORAGE_KEY = '@reminders/v2';
const LEGACY_KEY = '@reminders/v1';

const memoryFallback = new Map<string, string>();

async function readRaw(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return memoryFallback.get(key) ?? null;
      }
    }
    return memoryFallback.get(key) ?? null;
  }
}

async function writeRaw(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
    return;
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // fall through
      }
    }
    memoryFallback.set(key, value);
  }
}

function migrateLegacy(raw: unknown): ReminderTask | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const legacyCat = String(r.category ?? '');
  let category: TaskCategory = 'personal';
  let subCategory: SubCategory = 'general';
  if (legacyCat === 'health' || legacyCat === 'daily_routine' || legacyCat === 'personal') {
    category = 'personal';
    subCategory = legacyCat === 'health' ? 'medication' : 'general';
  } else if (legacyCat === 'communication' || legacyCat === 'social') {
    category = 'social';
    subCategory = 'networking';
  } else if (legacyCat === 'professional') {
    category = 'professional';
  }

  const schedule = (r.schedule as ReminderTask['schedule']) ?? {
    time: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  };
  const sound = (r.sound as ReminderTask['sound']) ?? {
    mode: 'mp3' as const,
    assetUri: 'chime',
    assetName: 'Chime',
  };

  return {
    id: String(r.id ?? `mig_${Date.now()}`),
    title: String(r.title ?? 'Untitled'),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    category,
    subCategory: (r.subCategory as SubCategory) ?? subCategory,
    priority: (r.priority as TaskPriority) ?? 'p3',
    schedule,
    dueAt: typeof r.dueAt === 'string' ? r.dueAt : null,
    contextTrigger: typeof r.contextTrigger === 'string' ? r.contextTrigger : undefined,
    sound,
    enabled: r.enabled !== false,
    completed: Boolean(r.completed),
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    notificationId: typeof r.notificationId === 'string' ? r.notificationId : undefined,
  };
}

export async function loadReminders(): Promise<ReminderTask[]> {
  let raw = await readRaw(STORAGE_KEY);
  if (!raw) {
    raw = await readRaw(LEGACY_KEY);
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed.map(migrateLegacy).filter(Boolean) as ReminderTask[];
    await saveReminders(migrated);
    return migrated;
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: ReminderTask[]): Promise<void> {
  await writeRaw(STORAGE_KEY, JSON.stringify(reminders));
}

export async function upsertReminder(reminder: ReminderTask): Promise<ReminderTask[]> {
  const list = await loadReminders();
  const idx = list.findIndex((r) => r.id === reminder.id);
  if (idx >= 0) list[idx] = reminder;
  else list.unshift(reminder);
  await saveReminders(list);
  return list;
}

export async function upsertMany(reminders: ReminderTask[]): Promise<ReminderTask[]> {
  let list = await loadReminders();
  for (const reminder of reminders) {
    const idx = list.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) list[idx] = reminder;
    else list = [reminder, ...list];
  }
  await saveReminders(list);
  return list;
}

export async function deleteReminder(id: string): Promise<ReminderTask[]> {
  const list = (await loadReminders()).filter((r) => r.id !== id);
  await saveReminders(list);
  return list;
}

export async function getReminderById(id: string): Promise<ReminderTask | undefined> {
  return (await loadReminders()).find((r) => r.id === id);
}
