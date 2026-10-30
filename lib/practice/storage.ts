import { ACTIVE_CAPS, type PracticeRep, type PracticeStatement, type PracticeStatementType } from './types';
import { buildSeedStatements } from './seeds';
import { kvGet, kvSet } from './kv';

const STATEMENTS_KEY = '@practice/v1/statements';
const REPS_KEY = '@practice/v1/reps';
const SESSION_DAY_KEY = '@practice/v1/sessionDay';

function stamp(s: PracticeStatement): PracticeStatement {
  return { ...s, updatedAt: new Date().toISOString() };
}

export async function ensurePracticeSeeded(): Promise<PracticeStatement[]> {
  const existing = await loadStatements();
  if (existing.length > 0) return existing;
  const seeds = buildSeedStatements();
  await saveStatements(seeds);
  return seeds;
}

export async function loadStatements(): Promise<PracticeStatement[]> {
  const raw = await kvGet(STATEMENTS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as PracticeStatement[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveStatements(list: PracticeStatement[]): Promise<PracticeStatement[]> {
  await kvSet(STATEMENTS_KEY, JSON.stringify(list));
  return list;
}

export async function getStatement(id: string): Promise<PracticeStatement | null> {
  return (await loadStatements()).find((s) => s.id === id) ?? null;
}

export async function getStatementByCode(code: string): Promise<PracticeStatement | null> {
  return (await loadStatements()).find((s) => s.code === code) ?? null;
}

export async function upsertStatement(stmt: PracticeStatement): Promise<PracticeStatement[]> {
  const list = await loadStatements();
  const idx = list.findIndex((s) => s.id === stmt.id);
  const next = stamp(stmt);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  return saveStatements(list);
}

export function countActive(list: PracticeStatement[], type: PracticeStatementType): number {
  return list.filter((s) => s.active && !s.retiredAt && s.type === type).length;
}

export type ActivateResult =
  | { ok: true; statements: PracticeStatement[] }
  | { ok: false; reason: 'cap'; type: PracticeStatementType; cap: number };

/** Activate a statement; enforces 10/10/3 caps. */
export async function activateStatement(id: string): Promise<ActivateResult> {
  const list = await loadStatements();
  const stmt = list.find((s) => s.id === id);
  if (!stmt) return { ok: true, statements: list };
  if (stmt.active) return { ok: true, statements: list };

  const cap = ACTIVE_CAPS[stmt.type === 'if-then' ? 'ifThen' : stmt.type === 'reactive' ? 'reactive' : 'manifest'];
  const typeKey = stmt.type;
  if (countActive(list, typeKey) >= cap) {
    return { ok: false, reason: 'cap', type: typeKey, cap };
  }

  stmt.active = true;
  stmt.onBench = false;
  stmt.retiredAt = null;
  stmt.updatedAt = new Date().toISOString();
  return { ok: true, statements: await saveStatements(list) };
}

export async function retireStatement(id: string): Promise<PracticeStatement[]> {
  const list = await loadStatements();
  const stmt = list.find((s) => s.id === id);
  if (!stmt) return list;
  stmt.active = false;
  stmt.retiredAt = new Date().toISOString();
  stmt.updatedAt = stmt.retiredAt;
  return saveStatements(list);
}

/** Swap: retire activeId, activate benchId (same type preferred). */
export async function swapStatements(
  retireId: string,
  activateId: string
): Promise<PracticeStatement[]> {
  await retireStatement(retireId);
  const result = await activateStatement(activateId);
  if (!result.ok) {
    // rollback retire by re-activating
    await activateStatement(retireId);
    throw new Error(`Active set full for ${result.type} (cap ${result.cap})`);
  }
  return result.statements;
}

export async function moveToBench(id: string): Promise<PracticeStatement[]> {
  const list = await loadStatements();
  const stmt = list.find((s) => s.id === id);
  if (!stmt) return list;
  stmt.active = false;
  stmt.onBench = true;
  stmt.updatedAt = new Date().toISOString();
  return saveStatements(list);
}

export async function loadReps(): Promise<PracticeRep[]> {
  const raw = await kvGet(REPS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as PracticeRep[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function appendRep(rep: Omit<PracticeRep, 'id' | 'at'> & { at?: string }): Promise<PracticeRep> {
  const list = await loadReps();
  const full: PracticeRep = {
    id: `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    statementId: rep.statementId,
    kind: rep.kind,
    at: rep.at ?? new Date().toISOString(),
  };
  list.push(full);
  // Keep last 2000 reps
  const trimmed = list.length > 2000 ? list.slice(list.length - 2000) : list;
  await kvSet(REPS_KEY, JSON.stringify(trimmed));
  return full;
}

export async function markSessionCompleteToday(): Promise<void> {
  const ymd = new Date().toISOString().slice(0, 10);
  await kvSet(SESSION_DAY_KEY, ymd);
}

export async function wasSessionCompleteToday(): Promise<boolean> {
  const ymd = new Date().toISOString().slice(0, 10);
  return (await kvGet(SESSION_DAY_KEY)) === ymd;
}

export async function activeByType(type: PracticeStatementType): Promise<PracticeStatement[]> {
  const list = await ensurePracticeSeeded();
  return list.filter((s) => s.active && !s.retiredAt && s.type === type);
}

export async function searchStatements(query: string): Promise<PracticeStatement[]> {
  const q = query.trim().toLowerCase();
  const list = await ensurePracticeSeeded();
  if (!q) return list;
  return list.filter(
    (s) =>
      s.body.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.sourcePath.toLowerCase().includes(q) ||
      (s.cueText?.toLowerCase().includes(q) ?? false)
  );
}

/** Full offline export blob for F12. */
export async function exportPracticeBundle(): Promise<string> {
  const { loadScoreboardAll } = await import('./scoreboard');
  const { loadWins } = await import('./wins');
  const { loadWoops } = await import('./woop');
  const bundle = {
    exportedAt: new Date().toISOString(),
    statements: await loadStatements(),
    reps: await loadReps(),
    scoreboard: await loadScoreboardAll(),
    wins: await loadWins(),
    woops: await loadWoops(),
  };
  return JSON.stringify(bundle, null, 2);
}
