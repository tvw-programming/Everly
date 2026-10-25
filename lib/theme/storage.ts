import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { parsePrefs } from './prefs';
import type { ThemePrefs } from './types';
import { DEFAULT_PREFS } from './types';

const KEY = '@everly/theme/v2';
const LEGACY_KEY = '@everly/theme/v1';
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

export async function loadPrefs(): Promise<ThemePrefs> {
  try {
    const [v2, v1] = await Promise.all([read(KEY), read(LEGACY_KEY)]);
    return parsePrefs(v2, v1);
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: ThemePrefs): Promise<void> {
  await write(KEY, JSON.stringify(prefs));
}
