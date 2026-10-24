import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { BioStateSnapshot, CompanionMemoryEvent, CompanionMood, SyncScore } from './types';

const MEMORY_KEY = '@companion/memories/v1';
const BIO_KEY = '@companion/bio/v1';
const SYNC_KEY = '@companion/sync/v1';
const RITUAL_KEY = '@companion/rituals/v1';

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

export async function persistBio(snapshot: BioStateSnapshot): Promise<void> {
  await write(BIO_KEY, JSON.stringify(snapshot));
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

/** Once per local day per ritual key */
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
