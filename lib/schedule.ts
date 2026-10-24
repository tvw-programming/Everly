import type { ReminderSchedule, ReminderTask } from './types';
import { DAY_LABELS, PRIORITY_WEIGHT } from './types';

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map((n) => Number(n));
  return { hours: h || 0, minutes: m || 0 };
}

/** Next Date this schedule should fire (local timezone). */
export function getNextFireDate(schedule: ReminderSchedule, from = new Date()): Date | null {
  const { hours, minutes } = parseTime(schedule.time);

  if (schedule.daysOfWeek.length === 0) {
    if (!schedule.date) return null;
    const [y, mo, d] = schedule.date.split('-').map(Number);
    const once = new Date(y, mo - 1, d, hours, minutes, 0, 0);
    return once.getTime() > from.getTime() ? once : null;
  }

  // Look up to 8 days ahead for the next matching weekday
  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (!schedule.daysOfWeek.includes(candidate.getDay())) continue;
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  return null;
}

export function formatScheduleSummary(schedule: ReminderSchedule): string {
  const timeLabel = formatTime12h(schedule.time);
  if (schedule.daysOfWeek.length === 0) {
    return schedule.date ? `${schedule.date} · ${timeLabel}` : timeLabel;
  }
  const sorted = [...schedule.daysOfWeek].sort((a, b) => a - b);
  const isWeekdays =
    sorted.length === 5 && sorted.every((d, i) => d === [1, 2, 3, 4, 5][i]);
  const isEveryday = sorted.length === 7;
  if (isEveryday) return `Every day · ${timeLabel}`;
  if (isWeekdays) return `Weekdays · ${timeLabel}`;
  return `${sorted.map((d) => DAY_LABELS[d]).join(', ')} · ${timeLabel}`;
}

export function formatTime12h(time: string): string {
  const { hours, minutes } = parseTime(time);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Mockup-style time: "09.00 am" */
export function formatTimeDisplay(time: string): string {
  const { hours, minutes } = parseTime(time);
  const period = hours >= 12 ? 'pm' : 'am';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}.${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatHeaderDate(date = new Date()): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[date.getMonth()]}, ${date.getDate()} ${date.getFullYear()}`;
}

export function isScheduledToday(schedule: ReminderSchedule, from = new Date()): boolean {
  const day = from.getDay();
  if (schedule.daysOfWeek.length > 0) {
    return schedule.daysOfWeek.includes(day);
  }
  if (!schedule.date) return false;
  const y = from.getFullYear();
  const m = String(from.getMonth() + 1).padStart(2, '0');
  const d = String(from.getDate()).padStart(2, '0');
  return schedule.date === `${y}-${m}-${d}`;
}

export function sortByTime(a: ReminderTask, b: ReminderTask): number {
  return a.schedule.time.localeCompare(b.schedule.time);
}

/** Highest leverage first (p1 → p2 → p3), then soonest time */
export function sortByPriority(a: ReminderTask, b: ReminderTask): number {
  const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  if (pw !== 0) return pw;
  return sortByTime(a, b);
}

export function formatNextFire(reminder: ReminderTask): string {
  if (!reminder.enabled) return 'Paused';
  const next = getNextFireDate(reminder.schedule);
  if (!next) return 'No upcoming time';
  const now = new Date();
  const sameDay =
    next.getFullYear() === now.getFullYear() &&
    next.getMonth() === now.getMonth() &&
    next.getDate() === now.getDate();
  const time = formatTime12h(
    `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
  );
  if (sameDay) return `Today · ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    next.getFullYear() === tomorrow.getFullYear() &&
    next.getMonth() === tomorrow.getMonth() &&
    next.getDate() === tomorrow.getDate();
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${DAY_LABELS[next.getDay()]} · ${time}`;
}

export function createId(): string {
  return `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
