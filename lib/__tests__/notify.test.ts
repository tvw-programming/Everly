/**
 * The barrel `expo-notifications` import crashes in Expo Go on Android: its
 * index re-exports topicSubscription, which evaluates
 * requireNativeModule('ExpoTopicSubscriptionModule') at module scope, and that
 * native module is absent there. Local notifications ARE supported, so the
 * notifier must reach them through the submodules that avoid that import.
 */
type ScheduleRequest = { content: { title: string }; trigger: { date: Date } };
type ChannelConfig = { importance: number };

const mockSchedule = jest.fn((_req: ScheduleRequest) => Promise.resolve('notif-1'));
const mockCancel = jest.fn((_id: string) => Promise.resolve());
const mockGetPerms = jest.fn(() => Promise.resolve({ granted: false }));
const mockRequestPerms = jest.fn(() => Promise.resolve({ granted: true }));
const mockSetChannel = jest.fn((_id: string, _config: ChannelConfig) => Promise.resolve(null));
const mockSetHandler = jest.fn();

jest.mock('expo-notifications/build/scheduleNotificationAsync', () => ({
  scheduleNotificationAsync: mockSchedule,
}));
jest.mock('expo-notifications/build/cancelScheduledNotificationAsync', () => ({
  cancelScheduledNotificationAsync: mockCancel,
}));
jest.mock('expo-notifications/build/NotificationPermissions', () => ({
  getPermissionsAsync: mockGetPerms,
  requestPermissionsAsync: mockRequestPerms,
}));
jest.mock('expo-notifications/build/setNotificationChannelAsync', () => ({
  setNotificationChannelAsync: mockSetChannel,
}));
jest.mock('expo-notifications/build/NotificationsHandler', () => ({
  setNotificationHandler: mockSetHandler,
}));
jest.mock('expo-notifications/build/NotificationsEmitter', () => ({
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// The crashing module. Importing it must never happen.
const mockTopicSubscription = jest.fn(() => {
  throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
});
jest.mock('expo-notifications/build/TopicSubscriptionModule', () => {
  mockTopicSubscription();
  return {};
});

// Expo Go on Android — the environment that used to disable notifications.
jest.mock('expo', () => ({
  isRunningInExpoGo: () => true,
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { ALARM_CHANNEL_ID, loadNotifier } from '../notify';

describe('loadNotifier in Expo Go on Android', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is available even though the app runs in Expo Go', () => {
    expect(loadNotifier()).not.toBeNull();
  });

  it('never pulls in the topic-subscription module that crashes there', () => {
    loadNotifier();
    expect(mockTopicSubscription).not.toHaveBeenCalled();
  });

  it('schedules through the local-notification scheduler', async () => {
    const notifier = loadNotifier()!;
    const when = new Date('2026-10-27T08:30:00.000Z');
    await notifier.scheduleAt({ title: 'Take medicine', body: 'Personal' }, when);

    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const req = mockSchedule.mock.calls[0][0];
    expect(req.content.title).toBe('Take medicine');
    expect(req.trigger.date).toEqual(when);
  });

  it('cancels by id', async () => {
    await loadNotifier()!.cancel('notif-1');
    expect(mockCancel).toHaveBeenCalledWith('notif-1');
  });
});

describe('android notification channel', () => {
  beforeEach(() => jest.clearAllMocks());

  /**
   * Android 13+ shows no permission prompt until a channel exists, and a
   * default-importance channel will not alert for a reminder.
   */
  it('creates a high-importance channel before asking for permission', async () => {
    const notifier = loadNotifier()!;
    await notifier.ensurePermission();

    expect(mockSetChannel).toHaveBeenCalled();
    const [channelId, config] = mockSetChannel.mock.calls[0];
    expect(channelId).toBe(ALARM_CHANNEL_ID);
    expect(config.importance).toBeGreaterThanOrEqual(4);

    const channelOrder = mockSetChannel.mock.invocationCallOrder[0];
    const requestOrder = mockRequestPerms.mock.invocationCallOrder[0];
    expect(channelOrder).toBeLessThan(requestOrder);
  });

  it('does not re-request when permission is already granted', async () => {
    mockGetPerms.mockResolvedValueOnce({ granted: true });
    const granted = await loadNotifier()!.ensurePermission();

    expect(granted).toBe(true);
    expect(mockRequestPerms).not.toHaveBeenCalled();
  });

  it('reports the outcome of a fresh request', async () => {
    mockGetPerms.mockResolvedValueOnce({ granted: false });
    mockRequestPerms.mockResolvedValueOnce({ granted: false });
    await expect(loadNotifier()!.ensurePermission()).resolves.toBe(false);
  });
});

describe('hasPermission', () => {
  beforeEach(() => jest.clearAllMocks());

  /** The reliability readout must never trigger a prompt just by being shown. */
  it('reads the current status without requesting', async () => {
    mockGetPerms.mockResolvedValueOnce({ granted: true });
    await expect(loadNotifier()!.hasPermission()).resolves.toBe(true);
    expect(mockRequestPerms).not.toHaveBeenCalled();
  });

  it('reports false when the status lookup throws', async () => {
    mockGetPerms.mockRejectedValueOnce(new Error('unavailable'));
    await expect(loadNotifier()!.hasPermission()).resolves.toBe(false);
  });
});
