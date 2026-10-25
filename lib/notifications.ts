import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { playSound } from './audio';
import { getNextFireDate } from './schedule';
import { getReminderById, upsertReminder } from './storage';
import type { Reminder } from './types';

// Expo Go on Android ships without expo-notifications' native modules, so importing it throws there
const Notifications: typeof NotificationsModule | null =
  Platform.OS === 'android' && isRunningInExpoGo() ? null : require('expo-notifications');

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let listenersAttached = false;

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) {
    return false;
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<string | undefined> {
  if (Platform.OS === 'web' || !Notifications || !reminder.enabled) return undefined;

  const granted = await ensureNotificationPermissions();
  if (!granted) return undefined;

  if (reminder.notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    } catch {
      // ignore
    }
  }

  const next = getNextFireDate(reminder.schedule);
  if (!next) return undefined;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.notes?.trim() || `Time for your ${reminder.category.replace('_', ' ')} reminder`,
      data: {
        reminderId: reminder.id,
        assetUri: reminder.sound.assetUri,
        soundMode: reminder.sound.mode,
      },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next,
    },
  });

  return id;
}

export async function cancelReminderNotification(notificationId?: string): Promise<void> {
  if (!notificationId || Platform.OS === 'web' || !Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

async function rescheduleAfterFire(reminderId: string): Promise<void> {
  const reminder = await getReminderById(reminderId);
  if (!reminder || !reminder.enabled) return;
  // One-shot with no remaining date should stay disabled
  if (reminder.schedule.daysOfWeek.length === 0) {
    const updated: Reminder = { ...reminder, enabled: false, notificationId: undefined };
    await upsertReminder(updated);
    return;
  }
  const notificationId = await scheduleReminderNotification(reminder);
  await upsertReminder({ ...reminder, notificationId });
}

async function handleNotificationData(data: Record<string, unknown> | undefined): Promise<void> {
  if (!data) return;
  const assetUri = typeof data.assetUri === 'string' ? data.assetUri : undefined;
  const reminderId = typeof data.reminderId === 'string' ? data.reminderId : undefined;
  const mode = data.soundMode;

  // TTS reserved for later — only play MP3 in this slice
  if (mode === 'tts') return;

  if (assetUri) {
    await playSound(assetUri);
  } else if (reminderId) {
    const reminder = await getReminderById(reminderId);
    if (reminder?.sound.mode === 'mp3') {
      await playSound(reminder.sound.assetUri);
    }
  }

  if (reminderId) {
    await rescheduleAfterFire(reminderId);
  }
}

export function attachNotificationListeners(): () => void {
  if (listenersAttached || Platform.OS === 'web' || !Notifications) {
    return () => undefined;
  }
  listenersAttached = true;

  const received = Notifications.addNotificationReceivedListener((notification) => {
    void handleNotificationData(notification.request.content.data as Record<string, unknown>);
  });

  const response = Notifications.addNotificationResponseReceivedListener((res) => {
    void handleNotificationData(res.notification.request.content.data as Record<string, unknown>);
  });

  return () => {
    received.remove();
    response.remove();
    listenersAttached = false;
  };
}
