import { impact, notify, selectionTick } from '../haptics';

jest.mock('expo-haptics', () => ({
  // Mirrors Expo Go on Android, where some haptics are not implemented
  selectionAsync: jest.fn(() => {
    throw new Error("The method or property Haptic.selectionAsync is not available on android");
  }),
  impactAsync: jest.fn(() => Promise.reject(new Error('unavailable'))),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

describe('haptics helpers', () => {
  it('swallows a synchronous unavailability error', () => {
    expect(() => selectionTick()).not.toThrow();
  });

  it('swallows a rejected haptic promise', async () => {
    expect(() => impact('light')).not.toThrow();
    await Promise.resolve();
  });

  it('still fires the haptics that do work', () => {
    const haptics = jest.requireMock('expo-haptics');
    notify('success');
    expect(haptics.notificationAsync).toHaveBeenCalledWith('success');
  });
});
