import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { ReminderTask } from '../types';
import { detectRapidSpeech, isHighContextTask } from './scripts';
import type {
  BioStateSnapshot,
  CompanionMemoryEvent,
  CompanionMood,
  SyncScore,
} from './types';

const MEMORY_KEY = '@companion/memories/v1';
const BIO_KEY = '@companion/bio/v1';
const SYNC_KEY = '@companion/sync/v1';
const RITUAL_KEY = '@companion/rituals/v1';
const HYPE_KEY = '@companion/hype-delivered/v1';
const COMPLETIONS_KEY = '@companion/completions-hour/v1';

const memoryFallback = new Map<string, string>();

async function read(key: string): Promise<string | null> {
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

async function write(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
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

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function loadMemories(): Promise<CompanionMemoryEvent[]> {
  const raw = await read(MEMORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CompanionMemoryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMemories(events: CompanionMemoryEvent[]): Promise<void> {
  await write(MEMORY_KEY, JSON.stringify(events));
}

export async function enqueueMemory(
  event: Omit<CompanionMemoryEvent, 'id'> & { id?: string }
): Promise<CompanionMemoryEvent> {
  const full: CompanionMemoryEvent = { ...event, id: event.id ?? uid('mem') };
  const list = await loadMemories();
  list.push(full);
  await saveMemories(list);
  return full;
}

export async function markMemoryDelivered(id: string, skipped = false): Promise<void> {
  const list = await loadMemories();
  const next = list.map((m) =>
    m.id === id
      ? { ...m, deliveredAt: new Date().toISOString(), skipped }
      : m
  );
  await saveMemories(next);
}

/** Due, undelivered memories (follow-ups, etc.) */
export async function popDueMemories(now = new Date()): Promise<CompanionMemoryEvent[]> {
  const list = await loadMemories();
  const due = list.filter(
    (m) => !m.deliveredAt && new Date(m.scheduledFor).getTime() <= now.getTime()
  );
  return due.slice(0, 2);
}

export function inferMood(snapshot?: BioStateSnapshot): CompanionMood {
  if (!snapshot) return 'grounded';
  if (snapshot.signals.includes('late_night')) return 'soothing';
  if (snapshot.stressScore >= 0.65) return 'soothing';
  if (snapshot.signals.includes('completion_streak')) return 'hype';
  return 'calm';
}

export function snapshotFromSignals(input: {
  rapidSpeech?: boolean;
  hour?: number;
  completionsLastHour?: number;
}): BioStateSnapshot {
  const hour = input.hour ?? new Date().getHours();
  const signals: BioStateSnapshot['signals'] = [];
  let stress = 0.25;
  if (input.rapidSpeech) {
    signals.push('rapid_speech');
    stress += 0.35;
  }
  if (hour >= 0 && hour < 5) {
    signals.push('late_night');
    stress += 0.25;
  }
  if ((input.completionsLastHour ?? 0) >= 3) {
    signals.push('completion_streak');
    stress -= 0.15;
  }
  return {
    at: new Date().toISOString(),
    stressScore: Math.max(0, Math.min(1, stress)),
    signals,
  };
}

export function moodFromTranscript(text: string): BioStateSnapshot {
  return snapshotFromSignals({
    rapidSpeech: detectRapidSpeech(text),
    hour: new Date().getHours(),
  });
}

export async function persistBio(snapshot: BioStateSnapshot): Promise<void> {
  await write(BIO_KEY, JSON.stringify(snapshot));
}

export async function recordCompletion(): Promise<number> {
  const hourKey = new Date().toISOString().slice(0, 13);
  const raw = await read(COMPLETIONS_KEY);
  let map: Record<string, number> = {};
  if (raw) {
    try {
      map = JSON.parse(raw) as Record<string, number>;
    } catch {
      map = {};
    }
  }
  map[hourKey] = (map[hourKey] ?? 0) + 1;
  await write(COMPLETIONS_KEY, JSON.stringify(map));
  return map[hourKey];
}

export async function completionsThisHour(): Promise<number> {
  const hourKey = new Date().toISOString().slice(0, 13);
  const raw = await read(COMPLETIONS_KEY);
  if (!raw) return 0;
  try {
    const map = JSON.parse(raw) as Record<string, number>;
    return map[hourKey] ?? 0;
  } catch {
    return 0;
  }
}

export async function loadSyncScore(): Promise<SyncScore> {
  const raw = await read(SYNC_KEY);
  if (!raw) {
    return { sharedStreakDays: 0, hydrationSyncs: 0, movementSyncs: 0, unlockTier: 0 };
  }
  try {
    return JSON.parse(raw) as SyncScore;
  } catch {
    return { sharedStreakDays: 0, hydrationSyncs: 0, movementSyncs: 0, unlockTier: 0 };
  }
}

export async function bumpSync(
  kind: 'hydration' | 'movement'
): Promise<SyncScore> {
  const score = await loadSyncScore();
  if (kind === 'hydration') score.hydrationSyncs += 1;
  else score.movementSyncs += 1;
  const total = score.hydrationSyncs + score.movementSyncs;
  score.unlockTier = Math.min(5, Math.floor(total / 5));
  score.sharedStreakDays = Math.max(score.sharedStreakDays, 1);
  await write(SYNC_KEY, JSON.stringify(score));
  return score;
}

export async function shouldDeliverRitual(kind: 'morning' | 'evening'): Promise<boolean> {
  const raw = await read(RITUAL_KEY);
  const today = new Date().toISOString().slice(0, 10);
  let map: Record<string, string> = {};
  if (raw) {
    try {
      map = JSON.parse(raw) as Record<string, string>;
    } catch {
      map = {};
    }
  }
  if (map[kind] === today) return false;
  map[kind] = today;
  await write(RITUAL_KEY, JSON.stringify(map));
  return true;
}

export function pickRitualForNow(now = new Date()): 'morning' | 'evening' | null {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 20 || h < 2) return 'evening';
  return null;
}

function parseDue(task: ReminderTask, now = new Date()): Date | null {
  if (task.dueAt) {
    const d = new Date(task.dueAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [hh, mm] = task.schedule.time.split(':').map(Number);
  const d = new Date(now);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
}

/** Tasks entering the 10-minute pre-event window */
export function findHypeCandidates(tasks: ReminderTask[], now = new Date()): ReminderTask[] {
  const inWindow: ReminderTask[] = [];
  for (const task of tasks) {
    if (task.completed || !task.enabled) continue;
    if (!(task.priority === 'p1' || task.contextTrigger || task.subCategory === 'trading')) {
      continue;
    }
    const due = parseDue(task, now);
    if (!due) continue;
    const delta = due.getTime() - now.getTime();
    // Between 0 and 10 minutes before
    if (delta > 0 && delta <= 10 * 60 * 1000) inWindow.push(task);
  }
  return inWindow;
}

export async function claimHypeDelivery(taskId: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${taskId}:${day}`;
  const raw = await read(HYPE_KEY);
  let set: string[] = [];
  if (raw) {
    try {
      set = JSON.parse(raw) as string[];
    } catch {
      set = [];
    }
  }
  if (set.includes(key)) return false;
  set.push(key);
  await write(HYPE_KEY, JSON.stringify(set.slice(-40)));
  return true;
}

export async function scheduleFollowUp(task: ReminderTask, prompt: string): Promise<void> {
  if (!isHighContextTask(task)) return;
  const when = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await enqueueMemory({
    kind: 'follow_up',
    relatedTaskId: task.id,
    prompt,
    scheduledFor: when.toISOString(),
  });
}

/** Dev/demo helper: due follow-ups fire in 15s instead of 3h when EXPO_PUBLIC_FAST_FOLLOWUPS=1 */
export async function scheduleFollowUpFast(task: ReminderTask, prompt: string): Promise<void> {
  if (!isHighContextTask(task)) return;
  const ms =
    process.env.EXPO_PUBLIC_FAST_FOLLOWUPS === '1' ? 15_000 : 3 * 60 * 60 * 1000;
  await enqueueMemory({
    kind: 'follow_up',
    relatedTaskId: task.id,
    prompt,
    scheduledFor: new Date(Date.now() + ms).toISOString(),
  });
}
