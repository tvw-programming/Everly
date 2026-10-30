import type { WoopRecord } from './types';
import { kvGet, kvSet } from './kv';

const KEY = '@practice/v1/woops';

export async function loadWoops(): Promise<WoopRecord[]> {
  const raw = await kvGet(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as WoopRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveWoop(
  input: Omit<WoopRecord, 'id' | 'createdAt'>
): Promise<WoopRecord> {
  const list = await loadWoops();
  const record: WoopRecord = {
    ...input,
    id: `woop_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(record);
  await kvSet(KEY, JSON.stringify(list));
  return record;
}
