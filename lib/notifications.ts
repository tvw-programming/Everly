import { loadNotifier } from './notify';
import { playSound } from './audio';
import { getNextFireDate } from './schedule';
import { getReminderById, upsertReminder } from './storage';
import type { Reminder } from './types';

const notifier = loadNotifier();

notifier?.setHandler();

let detachListeners: (() => void) | null = null;

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!notifier) return false;
  return notifier.ensurePermission();
}

export async function scheduleReminderNotification(reminder: Reminder): Promise<string | undefined> {
  if (!notifier || !reminder.enabled) return undefined;

  const granted = await ensureNotificationPermissions();
  if (!granted) return undefined;

  if (reminder.notificationId) {
    await notifier.cancel(reminder.notificationId);
  }

  const next = getNextFireDate(reminder.schedule);
  if (!next) return undefined;

  return notifier.scheduleAt(
    {
      title: reminder.title,
      body:
        reminder.notes?.trim() || `Time for your ${reminder.category.replace('_', ' ')} reminder`,
      data: {
        reminderId: reminder.id,
        assetUri: reminder.sound.assetUri,
        soundMode: reminder.sound.mode,
      },
    },
    next
  );
}

export async function cancelReminderNotification(notificationId?: string): Promise<void> {
  if (!notificationId || !notifier) return;
  await notifier.cancel(notificationId);
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
  if (detachListeners || !notifier) return () => undefined;

  detachListeners = notifier.onReceived((data) => {
    void handleNotificationData(data);
  });

  return () => {
    detachListeners?.();
    detachListeners = null;
  };
}
