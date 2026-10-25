import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics are decoration, and support varies by device, OS and whether the app
 * runs in Expo Go — `selectionAsync`, for instance, raises an unavailability
 * error on some Android runtimes. Every call here fails silently so a missing
 * motor can never break a tap.
 */
function safely(run: () => Promise<void> | void): void {
  if (Platform.OS === 'web') return;
  try {
    const result = run();
    if (result && typeof result.catch === 'function') {
      result.catch(() => undefined);
    }
  } catch {
    // unsupported on this runtime
  }
}

export type ImpactStrength = 'light' | 'medium' | 'heavy';
export type NotifyKind = 'success' | 'warning' | 'error';

const IMPACT: Record<ImpactStrength, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFY: Record<NotifyKind, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/** A light tick for selection changes; falls back to a light impact. */
export function selectionTick(): void {
  safely(() => Haptics.selectionAsync());
}

export function impact(strength: ImpactStrength = 'light'): void {
  safely(() => Haptics.impactAsync(IMPACT[strength]));
}

export function notify(kind: NotifyKind): void {
  safely(() => Haptics.notificationAsync(NOTIFY[kind]));
}
