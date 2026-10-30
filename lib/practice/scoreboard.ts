import {
  WEEKLY_TARGETS,
  type ScoreboardMetric,
  type ScoreboardWeek,
} from './types';
import { kvGet, kvSet } from './kv';

const KEY = '@practice/v1/scoreboard';

function weekIdFor(d: Date = new Date()): string {
  // ISO-ish week id YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function emptyWeek(weekId: string): ScoreboardWeek {
  return {
    weekId,
    deepWorkBlocks: 0,
    applications: 0,
    networkMessages: 0,
    demosPosted: 0,
    repoPushes: 0,
    saasSlices: 0,
    rejections: 0,
  };
}

export async function loadScoreboardAll(): Promise<ScoreboardWeek[]> {
  const raw = await kvGet(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as ScoreboardWeek[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveAll(list: ScoreboardWeek[]): Promise<void> {
  await kvSet(KEY, JSON.stringify(list));
}

export async function getCurrentWeek(): Promise<ScoreboardWeek> {
  const id = weekIdFor();
  const all = await loadScoreboardAll();
  const found = all.find((w) => w.weekId === id);
  if (found) return found;
  const week = emptyWeek(id);
  all.push(week);
  await saveAll(all);
  return week;
}

export async function incrementMetric(
  metric: ScoreboardMetric,
  by = 1
): Promise<ScoreboardWeek> {
  const id = weekIdFor();
  const all = await loadScoreboardAll();
  let week = all.find((w) => w.weekId === id);
  if (!week) {
    week = emptyWeek(id);
    all.push(week);
  }
  week[metric] = Math.max(0, (week[metric] ?? 0) + by);
  await saveAll(all);
  return week;
}

export async function getSixMonthTotals(): Promise<Record<ScoreboardMetric, number>> {
  const all = await loadScoreboardAll();
  // Approx last ~26 weeks
  const recent = all.slice(-26);
  const totals: Record<ScoreboardMetric, number> = {
    deepWorkBlocks: 0,
    applications: 0,
    networkMessages: 0,
    demosPosted: 0,
    repoPushes: 0,
    saasSlices: 0,
    rejections: 0,
  };
  for (const w of recent) {
    for (const k of Object.keys(totals) as ScoreboardMetric[]) {
      totals[k] += w[k] ?? 0;
    }
  }
  return totals;
}

export function targetFor(metric: Exclude<ScoreboardMetric, 'rejections'>): number {
  return WEEKLY_TARGETS[metric];
}

/** HT11: Thursday and applications under 15. */
export async function isBehindPaceApplications(now: Date = new Date()): Promise<boolean> {
  if (now.getDay() !== 4) return false; // Thursday
  const week = await getCurrentWeek();
  return week.applications < 15;
}

export const SCOREBOARD_LABELS: Record<ScoreboardMetric, string> = {
  deepWorkBlocks: 'Deep-work blocks',
  applications: 'Applications / outreach',
  networkMessages: 'Network messages',
  demosPosted: 'Demos posted',
  repoPushes: 'Repo pushes',
  saasSlices: 'SaaS slices',
  rejections: 'Rejections logged',
};
