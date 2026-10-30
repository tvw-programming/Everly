import { toHour24 } from './schedule';
import type { AlarmCategory, AlarmReminder } from './types';

/** Board order — matches the category legend in Theme settings. */
export const ALARM_CATEGORIES: AlarmCategory[] = [
  'personal',
  'social',
  'professional',
  'financial',
];

export type AlarmsByCategory = Record<AlarmCategory, AlarmReminder[]>;

function minuteOfDay(a: AlarmReminder): number {
  return toHour24(a.hour12, a.period) * 60 + a.minute;
}

export function groupAlarmsByCategory(alarms: AlarmReminder[]): AlarmsByCategory {
  const map = {
    personal: [],
    social: [],
    professional: [],
    financial: [],
  } as AlarmsByCategory;

  for (const alarm of alarms) map[alarm.category]?.push(alarm);
  for (const category of ALARM_CATEGORIES) {
    map[category].sort((a, b) => minuteOfDay(a) - minuteOfDay(b));
  }
  return map;
}

/** A category with nothing switched on is left off the board entirely. */
export function visibleAlarmCategories(map: AlarmsByCategory): AlarmCategory[] {
  return ALARM_CATEGORIES.filter((category) => map[category].some((a) => a.enabled));
}
