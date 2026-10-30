/**
 * Title-only practice notifications — body empty, no statement text.
 * Reuses expo-notifications when available; no-ops on web / Expo Go Android.
 */
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import type { ScheduledPracticeJob } from './types';
import { kvGet, kvSet } from './kv';

const JOBS_KEY = '@practice/v1/scheduledJobs';

function loadNotifs(): typeof NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android' && isRunningInExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof NotificationsModule;
  } catch {
    return null;
  }
}

const Notifications = loadNotifs();

/** Canonical scheduled triggers for weekend slice + weekly blocks. */
export const DEFAULT_PRACTICE_JOBS: ScheduledPracticeJob[] = [
  { id: 'MT1', title: 'Evening practice', hour: 22, minute: 15, route: '/practice-session' },
  { id: 'HT4', title: 'Lunch docs', hour: 13, minute: 0, route: '/practice?cue=H4' },
  { id: 'HT5', title: 'Wins line', hour: 18, minute: 30, route: '/practice?cue=H5' },
  {
    id: 'HT7',
    title: 'Demo day',
    hour: 9,
    minute: 30,
    weekdays: [2, 4],
    route: '/practice?cue=H7',
  },
  {
    id: 'HT8',
    title: 'Friday close',
    hour: 17,
    minute: 30,
    weekdays: [5],
    route: '/practice?cue=H8',
  },
  {
    id: 'HT9',
    title: 'Build block',
    hour: 9,
    minute: 0,
    weekdays: [6],
    route: '/practice?cue=H9',
  },
  {
    id: 'HT10',
    title: 'Weekly review',
    hour: 10,
    minute: 0,
    weekdays: [0],
    route: '/practice-woop',
  },
];

function nextDate(hour: number, minute: number, weekdays?: number[] | null): Date {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() <= now.getTime()) continue;
    if (weekdays && weekdays.length && !weekdays.includes(d.getDay())) continue;
    return d;
  }
  const fallback = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  fallback.setHours(hour, minute, 0, 0);
  return fallback;
}

export async function schedulePracticeJobs(
  jobs: ScheduledPracticeJob[] = DEFAULT_PRACTICE_JOBS
): Promise<ScheduledPracticeJob[]> {
  if (!Notifications) {
    await kvSet(JOBS_KEY, JSON.stringify(jobs));
    return jobs;
  }

  const existing = await Notifications.getPermissionsAsync();
  if (!existing.granted) {
    await Notifications.requestPermissionsAsync();
  }

  const scheduled: ScheduledPracticeJob[] = [];
  for (const job of jobs) {
    if (job.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(job.notificationId);
      } catch {
        // ignore
      }
    }
    const when = nextDate(job.hour, job.minute, job.weekdays);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: job.title,
        body: '', // Design rule: no statement text
        data: { practiceTrigger: job.id, route: job.route, kind: 'practice' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
    scheduled.push({ ...job, notificationId: id });
  }
  await kvSet(JOBS_KEY, JSON.stringify(scheduled));
  return scheduled;
}

export async function loadScheduledJobs(): Promise<ScheduledPracticeJob[]> {
  const raw = await kvGet(JOBS_KEY);
  if (!raw) return DEFAULT_PRACTICE_JOBS;
  try {
    const list = JSON.parse(raw) as ScheduledPracticeJob[];
    return Array.isArray(list) ? list : DEFAULT_PRACTICE_JOBS;
  } catch {
    return DEFAULT_PRACTICE_JOBS;
  }
}

/** Reschedule next occurrence after a job fires (call from listener / bootstrap). */
export async function reschedulePracticeJob(jobId: string): Promise<void> {
  const jobs = await loadScheduledJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;
  const others = jobs.filter((j) => j.id !== jobId);
  const refreshed = await schedulePracticeJobs([job]);
  await kvSet(JOBS_KEY, JSON.stringify([...others.filter((j) => j.id !== jobId), ...refreshed]));
}
