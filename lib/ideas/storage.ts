import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { createSeedIdeas } from './seeds';
import type { IdeaNote, IdeaStatus } from './types';

const KEY = '@ideas/vault/v1';
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

export async function loadIdeas(): Promise<IdeaNote[]> {
  const raw = await read();
  if (!raw) {
    const seeds = createSeedIdeas();
    await write(JSON.stringify(seeds));
    return seeds;
  }
  try {
    const parsed = JSON.parse(raw) as IdeaNote[];
    return Array.isArray(parsed) ? parsed : createSeedIdeas();
  } catch {
    return createSeedIdeas();
  }
}

export async function saveIdeas(ideas: IdeaNote[]): Promise<void> {
  await write(JSON.stringify(ideas));
}

export async function upsertIdeas(incoming: IdeaNote[]): Promise<IdeaNote[]> {
  const list = await loadIdeas();
  const map = new Map(list.map((i) => [i.id, i]));
  for (const idea of incoming) map.set(idea.id, idea);
  const next = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  await saveIdeas(next);
  return next;
}

export async function updateIdea(
  id: string,
  patch: Partial<IdeaNote>
): Promise<IdeaNote[]> {
  const list = await loadIdeas();
  const next = list.map((i) =>
    i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i
  );
  await saveIdeas(next);
  return next;
}

export async function setIdeaStatus(id: string, status: IdeaStatus): Promise<IdeaNote[]> {
  return updateIdea(id, { status });
}

export async function deleteIdea(id: string): Promise<IdeaNote[]> {
  const next = (await loadIdeas()).filter((i) => i.id !== id);
  await saveIdeas(next);
  return next;
}

export async function linkReminder(ideaId: string, reminderId: string): Promise<IdeaNote[]> {
  const list = await loadIdeas();
  const next = list.map((i) => {
    if (i.id !== ideaId) return i;
    const ids = Array.from(new Set([...(i.linkedReminderIds ?? []), reminderId]));
    return {
      ...i,
      linkedReminderIds: ids,
      status: i.status === 'captured' || i.status === 'clarified' ? 'planned' : i.status,
      updatedAt: new Date().toISOString(),
    } as IdeaNote;
  });
  await saveIdeas(next);
  return next;
}
