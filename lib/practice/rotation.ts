import { ROTATION_INTERVAL_DAYS, type PracticeStatement, type RotationBox } from './types';
import { appendRep, loadStatements, saveStatements, upsertStatement } from './storage';

function addDays(isoOrNow: Date, days: number): string {
  const d = new Date(isoOrNow);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Confirmed rep moves line up a box; schedules next due. */
export async function confirmManifestRep(statementId: string): Promise<PracticeStatement | null> {
  const stmt = (await loadStatements()).find((s) => s.id === statementId);
  if (!stmt || stmt.type !== 'manifest') return null;

  const nextBox = Math.min(5, stmt.rotationBox + 1) as RotationBox;
  stmt.rotationBox = nextBox;
  stmt.repCount += 1;
  stmt.nextDueAt = addDays(new Date(), ROTATION_INTERVAL_DAYS[nextBox]);
  stmt.updatedAt = new Date().toISOString();
  await upsertStatement(stmt);
  await appendRep({ statementId, kind: 'manifest' });
  return stmt;
}

/** Believability rule: reset to box 1 / daily. */
export async function markDidntLand(statementId: string): Promise<PracticeStatement | null> {
  const stmt = (await loadStatements()).find((s) => s.id === statementId);
  if (!stmt || stmt.type !== 'manifest') return null;
  stmt.rotationBox = 1;
  stmt.didntLandCount += 1;
  stmt.nextDueAt = new Date().toISOString();
  stmt.updatedAt = new Date().toISOString();
  await upsertStatement(stmt);
  await appendRep({ statementId, kind: 'didnt_land' });
  return stmt;
}

/** Evening session: 2–3 due manifest lines, oldest first. */
export async function getDueManifestLines(
  limit = 3,
  now: Date = new Date()
): Promise<PracticeStatement[]> {
  const list = await loadStatements();
  const due = list
    .filter(
      (s) =>
        s.active &&
        !s.retiredAt &&
        s.type === 'manifest' &&
        (s.nextDueAt == null || new Date(s.nextDueAt).getTime() <= now.getTime())
    )
    .sort((a, b) => {
      const at = a.nextDueAt ? new Date(a.nextDueAt).getTime() : 0;
      const bt = b.nextDueAt ? new Date(b.nextDueAt).getTime() : 0;
      return at - bt;
    });
  return due.slice(0, limit);
}

/** Candidates for monthly review. */
export async function getReviewFlags(): Promise<{
  automatic: PracticeStatement[];
  notBelievable: PracticeStatement[];
  ladder: PracticeStatement[];
}> {
  const list = (await loadStatements()).filter((s) => s.active && !s.retiredAt);
  return {
    automatic: list.filter((s) => s.type === 'manifest' && s.rotationBox === 5),
    notBelievable: list.filter((s) => s.type === 'manifest' && s.didntLandCount >= 2),
    ladder: list.filter((s) => s.ladderRung != null && s.ladderCondition),
  };
}

export async function ensureAllActiveManifestDueIfNull(): Promise<void> {
  const list = await loadStatements();
  let changed = false;
  for (const s of list) {
    if (s.active && s.type === 'manifest' && !s.nextDueAt) {
      s.nextDueAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) await saveStatements(list);
}
