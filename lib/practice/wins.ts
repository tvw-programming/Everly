import type { WinsEntry } from './types';
import { kvGet, kvSet } from './kv';

const KEY = '@practice/v1/wins';

export async function loadWins(): Promise<WinsEntry[]> {
  const raw = await kvGet(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as WinsEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addWin(text: string): Promise<WinsEntry> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Wins line required');
  const list = await loadWins();
  const entry: WinsEntry = {
    id: `win_${Date.now().toString(36)}`,
    date: new Date().toISOString().slice(0, 10),
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  await kvSet(KEY, JSON.stringify(list));
  return entry;
}

/** Surface three random past entries — for when a line stops feeling true / R2. */
export async function readThreeRandom(): Promise<WinsEntry[]> {
  const list = await loadWins();
  if (list.length <= 3) return [...list];
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

export async function exportWinsText(): Promise<string> {
  const list = await loadWins();
  return list.map((w) => `${w.date}\t${w.text}`).join('\n');
}
