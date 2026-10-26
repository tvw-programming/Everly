/**
 * Thin bridge to the EverlyAlarm native module.
 * When the native APK module is missing (web / Expo Go), falls back to
 * scheduled local notifications so reminders still alert.
 *
 * Local notifications work in Expo Go on Android; only the barrel import of
 * expo-notifications does not, which is why this goes through lib/notify.
 */
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { playSound, stopSound } from '@/lib/audio';
import { loadNotifier } from '@/lib/notify';

import { alarmAudioUri } from './audioSource';

import type { NativeSchedule } from './reconcile';
import { computeNextFireAt, toHour24 } from './schedule';
import type { AlarmReminder } from './types';

export type ReliabilityStatus = {
  notifications: boolean;
  exactAlarms: boolean;
  nativeModule: boolean;
  /** False when the alarm stream is at zero or muted — reminders would be silent. */
  alarmVolumeOk: boolean;
  batteryHint: string;
  lastTestAt?: string | null;
  message: string;
};

type NativeModule = {
  canScheduleExactAlarms(): Promise<boolean>;
  schedule(payload: string): Promise<{ nextFireAt: number | null }>;
  cancel(id: string): Promise<void>;
  rescheduleAll(payload: string): Promise<void>;
  getSchedules(): Promise<NativeSchedule[]>;
  testFire(id: string): Promise<void>;
  stopAlarm(): Promise<void>;
  snoozeAlarm(minutes: number): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  getReliabilityStatus(): Promise<ReliabilityStatus>;
};

let lastTestAt: string | null = null;
const fallbackNotifIds = new Map<string, string>();

const notifier = loadNotifier();

function getNative(): NativeModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('everly-alarm');
    if (!mod?.isNativeAvailable) return null;
    return (mod?.default ?? mod) as NativeModule;
  } catch {
    return null;
  }
}

export function hasNativeAlarmModule(): boolean {
  return Platform.OS === 'android' && getNative() != null;
}

function toNativePayload(alarm: AlarmReminder) {
  return {
    id: alarm.id,
    title: alarm.title,
    description: alarm.description ?? '',
    category: alarm.category,
    hour24: toHour24(alarm.hour12, alarm.period),
    minute: alarm.minute,
    frequency: alarm.frequency,
    weekdays: alarm.weekdays,
    startDate: alarm.startDate,
    endDate: alarm.endDate ?? null,
    nextFireAt: computeNextFireAt(alarm),
    enabled: alarm.enabled,
    audioSource: alarm.audio.source,
    bundledKey: alarm.audio.bundledKey ?? 'chime',
    managedPath: alarm.audio.managedPath ?? null,
    displayName: alarm.audio.displayName,
    loop: alarm.playback.mode === 'loop_until_stopped',
    maxRingMinutes: alarm.playback.maxRingMinutes,
    vibration: alarm.vibration,
    snoozeMinutes: alarm.snoozeMinutes,
  };
}

async function ensureNotifPermission(): Promise<boolean> {
  if (!notifier) return false;
  return notifier.ensurePermission();
}

/** Schedule or cancel based on enabled + next fire. */
export async function syncAlarmSchedule(alarm: AlarmReminder): Promise<number | null> {
  const native = getNative();
  const next = computeNextFireAt(alarm);

  if (native && Platform.OS === 'android') {
    if (!alarm.enabled || !next) {
      await native.cancel(alarm.id);
      return null;
    }
    const res = await native.schedule(JSON.stringify(toNativePayload({ ...alarm, nextFireAt: next })));
    return res.nextFireAt ?? next;
  }

  // Fallback: a scheduled local notification. It alerts on time but cannot
  // play a full song from a closed app — that needs the native APK module.
  if (!notifier) return next;

  const previous = fallbackNotifIds.get(alarm.id);
  if (previous) {
    await notifier.cancel(previous);
    fallbackNotifIds.delete(alarm.id);
  }
  if (!alarm.enabled || !next) return next;

  const ok = await ensureNotifPermission();
  if (!ok) return next;

  const id = await notifier.scheduleAt(
    {
      title: alarm.title,
      body: alarm.description || `${alarm.audio.displayName} · reminder`,
      data: { alarmId: alarm.id, kind: 'alarm_fallback' },
    },
    new Date(next)
  );
  if (id) fallbackNotifIds.set(alarm.id, id);
  return next;
}

export async function cancelAlarmSchedule(id: string): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.cancel(id);
    return;
  }
  const notifId = fallbackNotifIds.get(id);
  if (notifId && notifier) {
    await notifier.cancel(notifId);
    fallbackNotifIds.delete(id);
  }
}

/**
 * What the native module believes is scheduled. Empty when it is absent, which
 * makes the caller fall back to the stored values.
 */
export async function getNativeSchedules(): Promise<NativeSchedule[]> {
  const native = getNative();
  if (!native || Platform.OS !== 'android') return [];
  try {
    return await native.getSchedules();
  } catch {
    return [];
  }
}

export async function rescheduleAllAlarms(alarms: AlarmReminder[]): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    const payload = JSON.stringify(alarms.filter((a) => a.enabled).map(toNativePayload));
    await native.rescheduleAll(payload);
    return;
  }
  for (const a of alarms) {
    await syncAlarmSchedule(a);
  }
}

export async function testAlarm(alarm: AlarmReminder): Promise<{ mode: 'native' | 'preview' }> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.testFire(alarm.id);
    lastTestAt = new Date().toISOString();
    return { mode: 'native' };
  }
  // Preview the reminder's real audio — the picked music file, not just a tone.
  lastTestAt = new Date().toISOString();
  const uri = alarmAudioUri(alarm.audio);
  if (!uri) return { mode: 'preview' };
  await playSound(uri);
  setTimeout(() => {
    void stopSound();
  }, 4000);
  return { mode: 'preview' };
}

export async function stopActiveAlarm(): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.stopAlarm();
    return;
  }
  await stopSound();
}

export async function snoozeActiveAlarm(minutes: number): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.snoozeAlarm(minutes);
    return;
  }
  await stopSound();
}

export async function getReliabilityStatus(): Promise<ReliabilityStatus> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    try {
      const s = await native.getReliabilityStatus();
      return { ...s, lastTestAt: s.lastTestAt ?? lastTestAt };
    } catch {
      // fall through
    }
  }

  const notifications = notifier ? await notifier.hasPermission() : false;
  const nativeModule = hasNativeAlarmModule();
  return {
    notifications,
    exactAlarms: nativeModule,
    nativeModule,
    // Only the native module can read the alarm stream; assume audible elsewhere
    // rather than showing a warning we cannot substantiate.
    alarmVolumeOk: true,
    batteryHint: nativeModule
      ? 'Open battery settings and exclude Everly from optimization for reliable alarms.'
      : 'Install the Android APK (custom build) for exact alarms and full-song playback. Expo Go cannot do this.',
    lastTestAt,
    message: nativeModule
      ? 'Native alarm module ready.'
      : 'Running in fallback mode — UI works; use a sideloaded APK for real closed-app music alarms.',
  };
}

export async function openExactAlarmSettings(): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.openExactAlarmSettings();
    return;
  }
  if (Platform.OS === 'android') {
    await Linking.openSettings();
  }
}

export async function openBatterySettings(): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.openBatterySettings();
    return;
  }
  if (Platform.OS === 'android') {
    await Linking.openSettings();
  }
}
