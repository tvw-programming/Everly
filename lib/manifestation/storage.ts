import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { PILLARS } from './seed';
import type { ManifestPillar, ManifestPillarId } from './types';

const KEY = '@manifestation/pillars/v1';
const IDENTITY_KEY = '@manifestation/identity/v1';
const memory = new Map<string, string>();

async function read(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return memory.get(key) ?? null;
      }
    }
    return memory.get(key) ?? null;
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
    memory.set(key, value);
  }
}

export async function loadPillars(): Promise<ManifestPillar[]> {
  const raw = await read(KEY);
  if (!raw) return PILLARS.map((p) => ({ ...p }));
  try {
    const overrides = JSON.parse(raw) as Partial<
      Record<ManifestPillarId, Partial<ManifestPillar>>
    >;
    return PILLARS.map((p) => ({ ...p, ...overrides[p.id] }));
  } catch {
    return PILLARS.map((p) => ({ ...p }));
  }
}

export async function savePillarPatch(
  id: ManifestPillarId,
  patch: Partial<Pick<ManifestPillar, 'voiceUri' | 'customStillUri' | 'visionPrompt'>>
): Promise<void> {
  const raw = await read(KEY);
  let overrides: Partial<Record<ManifestPillarId, Partial<ManifestPillar>>> = {};
  if (raw) {
    try {
      overrides = JSON.parse(raw) as typeof overrides;
    } catch {
      overrides = {};
    }
  }
  overrides[id] = { ...(overrides[id] ?? {}), ...patch };
  await write(KEY, JSON.stringify(overrides));
}

export async function loadIdentityCode(): Promise<string> {
  return (await read(IDENTITY_KEY)) ?? 'I construct generational software & compound wealth';
}

export async function saveIdentityCode(code: string): Promise<void> {
  await write(IDENTITY_KEY, code.trim());
}
