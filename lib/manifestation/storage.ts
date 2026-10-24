import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { createSeedDeck } from './seeds';
import type { ManifestDeckState, ManifestPillar, ManifestPillarId } from './types';

const KEY = '@manifestation/deck/v1';
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

function mergeWithSeed(raw: ManifestDeckState): ManifestDeckState {
  const seed = createSeedDeck();
  const pillars = { ...seed.pillars };
  for (const id of Object.keys(seed.pillars) as ManifestPillarId[]) {
    pillars[id] = { ...seed.pillars[id], ...(raw.pillars?.[id] ?? {}) };
  }
  return {
    identityCode: raw.identityCode || seed.identityCode,
    auraScore: typeof raw.auraScore === 'number' ? raw.auraScore : seed.auraScore,
    voiceMix: typeof raw.voiceMix === 'number' ? raw.voiceMix : seed.voiceMix,
    pillars,
  };
}

export async function loadDeck(): Promise<ManifestDeckState> {
  const raw = await read();
  if (!raw) {
    const seed = createSeedDeck();
    await write(JSON.stringify(seed));
    return seed;
  }
  try {
    return mergeWithSeed(JSON.parse(raw) as ManifestDeckState);
  } catch {
    return createSeedDeck();
  }
}

export async function saveDeck(deck: ManifestDeckState): Promise<void> {
  await write(JSON.stringify(deck));
}

export async function updatePillar(
  id: ManifestPillarId,
  patch: Partial<ManifestPillar>
): Promise<ManifestDeckState> {
  const deck = await loadDeck();
  deck.pillars[id] = { ...deck.pillars[id], ...patch };
  await saveDeck(deck);
  return deck;
}

export async function setAuraScore(score: number): Promise<ManifestDeckState> {
  const deck = await loadDeck();
  deck.auraScore = Math.max(0, Math.min(100, Math.round(score)));
  await saveDeck(deck);
  return deck;
}

export async function setVoiceMix(mix: number): Promise<ManifestDeckState> {
  const deck = await loadDeck();
  deck.voiceMix = Math.max(0.1, Math.min(0.9, mix));
  await saveDeck(deck);
  return deck;
}

export async function setIdentityCode(code: string): Promise<ManifestDeckState> {
  const deck = await loadDeck();
  deck.identityCode = code.trim() || deck.identityCode;
  await saveDeck(deck);
  return deck;
}
