/**
 * Thin bridge to the EverlyAlarm native module.
 * When the native APK module is missing (web / Expo Go), falls back to
 * expo-notifications + local preview so UI still works.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

import { playSound, stopSound } from '@/lib/audio';

import { computeNextFireAt, toHour24 } from './schedule';
import type { AlarmReminder } from './types';

export type ReliabilityStatus = {
  notifications: boolean;
  exactAlarms: boolean;
  nativeModule: boolean;
  batteryHint: string;
  lastTestAt?: string | null;
  message: string;
};

type NativeModule = {
  canScheduleExactAlarms(): Promise<boolean>;
  schedule(payload: string): Promise<{ nextFireAt: number | null }>;
  cancel(id: string): Promise<void>;
  rescheduleAll(payload: string): Promise<void>;
  testFire(id: string): Promise<void>;
  stopAlarm(): Promise<void>;
  snoozeAlarm(minutes: number): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  getReliabilityStatus(): Promise<ReliabilityStatus>;
};

let lastTestAt: string | null = null;
const fallbackNotifIds = new Map<string, string>();

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
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
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

  // Fallback: expo-notifications (dev / web / Expo Go) — not full-song FGS
  if (fallbackNotifIds.has(alarm.id)) {
    try {
      await Notifications.cancelScheduledNotificationAsync(fallbackNotifIds.get(alarm.id)!);
    } catch {
      // ignore
    }
    fallbackNotifIds.delete(alarm.id);
  }
  if (!alarm.enabled || !next || Platform.OS === 'web') return next;

  const ok = await ensureNotifPermission();
  if (!ok) return next;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.title,
      body: alarm.description || 'Alarm',
      data: { alarmId: alarm.id, kind: 'alarm_fallback' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(next),
    },
  });
  fallbackNotifIds.set(alarm.id, id);
  return next;
}

export async function cancelAlarmSchedule(id: string): Promise<void> {
  const native = getNative();
  if (native && Platform.OS === 'android') {
    await native.cancel(id);
    return;
  }
  const notifId = fallbackNotifIds.get(id);
  if (notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    } catch {
      // ignore
    }
    fallbackNotifIds.delete(id);
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
  // Preview bundled / local via JS audio
  lastTestAt = new Date().toISOString();
  if (alarm.audio.source === 'silent') return { mode: 'preview' };
  const key = alarm.audio.bundledKey ?? 'chime';
  await playSound(key);
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

  let notifications = false;
  if (Platform.OS !== 'web') {
    try {
      notifications = (await Notifications.getPermissionsAsync()).granted;
    } catch {
      notifications = false;
    }
  }

  const nativeModule = hasNativeAlarmModule();
  return {
    notifications,
    exactAlarms: nativeModule,
    nativeModule,
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
