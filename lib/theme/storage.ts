import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { ThemeId } from './types';
import { THEME_IDS } from './types';

const KEY = '@everly/theme/v1';
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

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEME_IDS as string[]).includes(value);
}

export async function loadThemeId(): Promise<ThemeId> {
  const raw = await read();
  return isThemeId(raw) ? raw : 'light';
}

export async function saveThemeId(id: ThemeId): Promise<void> {
  await write(id);
}
