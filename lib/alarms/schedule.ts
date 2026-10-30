import type { AlarmFrequency, AlarmReminder } from './types';
import { WEEKDAY_SHORT } from './types';

/** Convert 12h wall clock to 24h hour (0–23). */
export function toHour24(hour12: number, period: 'AM' | 'PM'): number {
  const h = ((hour12 - 1) % 12) + 1; // normalize 1–12
  if (period === 'AM') return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

export function formatAlarmTime(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function formatRepeatSummary(reminder: Pick<AlarmReminder, 'frequency' | 'weekdays'>): string {
  if (reminder.frequency === 'once') return 'One-time';
  if (reminder.frequency === 'daily') return 'Daily';
  if (!reminder.weekdays.length) return 'Weekly';
  const sorted = [...reminder.weekdays].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Daily';
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function buildAlarmSummary(r: AlarmReminder): string {
  const when = formatAlarmTime(r.hour12, r.minute, r.period);
  const repeat = formatRepeatSummary(r);
  const audio = r.audio.displayName || 'Tone';
  const ring =
    r.playback.mode === 'once'
      ? 'Play once'
      : `Repeat up to ${r.playback.maxRingMinutes} min`;
  const vibe = r.vibration ? 'Vibration on' : 'Vibration off';
  if (r.frequency === 'weekly') {
    return `Every ${formatRepeatSummary(r)} at ${when} · ${audio} · ${ring} · ${vibe}`;
  }
  if (r.frequency === 'daily') {
    return `Daily at ${when} · ${audio} · ${ring} · ${vibe}`;
  }
  return `${repeat} at ${when} · ${audio} · ${ring} · ${vibe}`;
}

function atLocal(date: Date, hour24: number, minute: number): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setHours(hour24, minute, 0, 0);
  return d;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Next eligible fire as epoch ms, or null if none. */
export function computeNextFireAt(
  reminder: Pick<
    AlarmReminder,
    'hour12' | 'minute' | 'period' | 'frequency' | 'weekdays' | 'startDate' | 'endDate' | 'enabled'
  >,
  from: Date = new Date()
): number | null {
  if (!reminder.enabled) return null;

  const hour24 = toHour24(reminder.hour12, reminder.period);
  const start = parseYmd(reminder.startDate);
  start.setHours(0, 0, 0, 0);
  const end = reminder.endDate ? parseYmd(reminder.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const cursor = new Date(Math.max(from.getTime(), start.getTime()));

  for (let i = 0; i < 400; i++) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + i);
    day.setHours(0, 0, 0, 0);
    if (end && day.getTime() > end.getTime()) return null;

    if (reminder.frequency === 'weekly') {
      if (!reminder.weekdays.includes(day.getDay())) continue;
    }

    if (reminder.frequency === 'once' && ymd(day) !== reminder.startDate) {
      // only the start date
      if (day.getTime() > start.getTime()) return null;
      continue;
    }

    const fire = atLocal(day, hour24, reminder.minute);
    if (fire.getTime() <= from.getTime()) continue;
    if (fire.getTime() < start.getTime()) continue;
    if (end && fire.getTime() > end.getTime()) return null;
    return fire.getTime();
  }
  return null;
}

export function formatNextFire(epochMs: number | null | undefined): string {
  if (!epochMs) return 'Not scheduled';
  const d = new Date(epochMs);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function createAlarmId(): string {
  return `alarm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function todayYmd(): string {
  return ymd(new Date());
}

export function defaultAlarmDraft(): Omit<AlarmReminder, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();
  let hour24 = now.getHours();
  let minute = now.getMinutes() + 5;
  if (minute >= 60) {
    minute -= 60;
    hour24 = (hour24 + 1) % 24;
  }
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  return {
    title: '',
    description: '',
    category: 'personal',
    hour12,
    minute,
    period,
    startDate: todayYmd(),
    endDate: null,
    frequency: 'daily',
    weekdays: [1, 2, 3, 4, 5],
    enabled: true,
    audio: {
      source: 'bundled',
      bundledKey: 'chime',
      displayName: 'Chime',
    },
    playback: {
      mode: 'loop_until_stopped',
      maxRingMinutes: 5,
    },
    vibration: true,
    snoozeMinutes: 10,
    nextFireAt: null,
  };
}

export function isFrequency(v: string): v is AlarmFrequency {
  return v === 'once' || v === 'daily' || v === 'weekly';
}

/**
 * The alarms it is safe to hand to the native scheduler.
 *
 * Native floors any non-future time to a few seconds from now, so passing it a
 * series with nothing left — a one-time reminder whose moment has gone, or one
 * past its end date — makes a retired reminder ring almost immediately, and
 * again on every foreground.
 */
export function schedulableAlarms(
  alarms: AlarmReminder[],
  now: Date = new Date()
): AlarmReminder[] {
  return alarms.filter((a) => a.enabled && computeNextFireAt(a, now) != null);
}
