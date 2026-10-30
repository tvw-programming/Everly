import { Platform } from 'react-native';

/**
 * Local-notification access that survives Expo Go on Android.
 *
 * The `expo-notifications` barrel cannot be imported there: its index
 * re-exports `topicSubscription`, which runs
 * `requireNativeModule('ExpoTopicSubscriptionModule')` at module scope, and
 * that push-only native module is absent in Expo Go since SDK 53. Importing
 * the barrel therefore throws before any local API is reachable — even though
 * local notifications themselves are supported.
 *
 * So reach the local APIs through their own submodules, none of which import
 * the topic-subscription module.
 */

/** High-importance channel so a reminder actually alerts on Android 8+. */
export const ALARM_CHANNEL_ID = 'everly-reminders';

/** AndroidImportance.HIGH — inlined to avoid importing the enum's module. */
const IMPORTANCE_HIGH = 4;

export type NotifyContent = {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type Notifier = {
  scheduleAt(content: NotifyContent, date: Date): Promise<string | undefined>;
  cancel(id: string): Promise<void>;
  ensurePermission(): Promise<boolean>;
  /** Read-only — never prompts, so a status screen can call it freely. */
  hasPermission(): Promise<boolean>;
  setHandler(): void;
  onReceived(cb: (data: Record<string, unknown> | undefined) => void): () => void;
};

type Submodules = {
  schedule: (req: unknown) => Promise<string>;
  cancel: (id: string) => Promise<void>;
  getPermissions: () => Promise<{ granted: boolean }>;
  requestPermissions: () => Promise<{ granted: boolean }>;
  setChannel: (id: string, config: unknown) => Promise<unknown>;
  setHandler: (handler: unknown) => void;
  addReceived: (cb: (n: unknown) => void) => { remove(): void };
  addResponse: (cb: (r: unknown) => void) => { remove(): void };
};

function loadSubmodules(): Submodules | null {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const scheduler = require('expo-notifications/build/scheduleNotificationAsync');
    const canceller = require('expo-notifications/build/cancelScheduledNotificationAsync');
    const permissions = require('expo-notifications/build/NotificationPermissions');
    const channels = require('expo-notifications/build/setNotificationChannelAsync');
    const handler = require('expo-notifications/build/NotificationsHandler');
    const emitter = require('expo-notifications/build/NotificationsEmitter');
    /* eslint-enable @typescript-eslint/no-require-imports */

    return {
      schedule: scheduler.scheduleNotificationAsync,
      cancel: canceller.cancelScheduledNotificationAsync,
      getPermissions: permissions.getPermissionsAsync,
      requestPermissions: permissions.requestPermissionsAsync,
      setChannel: channels.setNotificationChannelAsync,
      setHandler: handler.setNotificationHandler,
      addReceived: emitter.addNotificationReceivedListener,
      addResponse: emitter.addNotificationResponseReceivedListener,
    };
  } catch {
    return null;
  }
}

/** SchedulableTriggerInputTypes.DATE — inlined to avoid its module. */
const TRIGGER_DATE = 'date';

function contentOf(content: NotifyContent) {
  return {
    title: content.title,
    body: content.body,
    data: content.data ?? {},
    sound: true,
  };
}

function build(mods: Submodules): Notifier {
  async function ensureChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      // `sound` is left unset so the channel keeps the system default; the
      // input field expects a bundled filename, not the word "default".
      await mods.setChannel(ALARM_CHANNEL_ID, {
        name: 'Reminders',
        importance: IMPORTANCE_HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
      });
    } catch {
      // A channel we cannot create is not a reason to skip the reminder.
    }
  }

  return {
    async hasPermission() {
      try {
        return (await mods.getPermissions()).granted;
      } catch {
        return false;
      }
    },

    async ensurePermission() {
      // Android 13+ shows no prompt until a channel exists, so create it first.
      await ensureChannel();
      const existing = await mods.getPermissions();
      if (existing.granted) return true;
      const requested = await mods.requestPermissions();
      return requested.granted;
    },

    async scheduleAt(content, date) {
      return mods.schedule({
        content: contentOf(content),
        trigger: { type: TRIGGER_DATE, date, channelId: ALARM_CHANNEL_ID },
      });
    },

    async cancel(id) {
      try {
        await mods.cancel(id);
      } catch {
        // Already fired or already gone.
      }
    },

    setHandler() {
      // Foreground presentation only. Sound is left to the app, which plays the
      // reminder's own tone or music file; the notification's `sound: true`
      // still covers the case where the app is not running to do that.
      mods.setHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    },

    onReceived(cb) {
      const received = mods.addReceived((n) => {
        const notification = n as { request?: { content?: { data?: Record<string, unknown> } } };
        cb(notification.request?.content?.data);
      });
      const response = mods.addResponse((r) => {
        const res = r as {
          notification?: { request?: { content?: { data?: Record<string, unknown> } } };
        };
        cb(res.notification?.request?.content?.data);
      });
      return () => {
        received.remove();
        response.remove();
      };
    },
  };
}

let cached: Notifier | null | undefined;

/** The notifier, or null where local notifications cannot run at all (web). */
export function loadNotifier(): Notifier | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') {
    cached = null;
    return cached;
  }
  const mods = loadSubmodules();
  cached = mods ? build(mods) : null;
  return cached;
}
