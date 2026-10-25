import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

function useAccessibilityFlag(
  read: () => Promise<boolean>,
  event: 'reduceMotionChanged' | 'reduceTransparencyChanged'
): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(read)
      .then((value) => {
        if (!cancelled) setEnabled(value);
      })
      .catch(() => undefined);
    let sub: { remove: () => void } | undefined;
    try {
      sub = AccessibilityInfo.addEventListener(event, setEnabled);
    } catch {
      // this platform does not report the setting
    }
    return () => {
      cancelled = true;
      try {
        sub?.remove();
      } catch {
        // already gone
      }
    };
  }, [read, event]);

  return enabled;
}

/** Live "Reduce Motion" setting — pause looping animations when true. */
export function useReduceMotion(): boolean {
  return useAccessibilityFlag(
    () => AccessibilityInfo.isReduceMotionEnabled(),
    'reduceMotionChanged'
  );
}

/** Live "Reduce Transparency" setting — fall back to opaque surfaces when true. */
export function useReduceTransparency(): boolean {
  return useAccessibilityFlag(
    () => AccessibilityInfo.isReduceTransparencyEnabled(),
    'reduceTransparencyChanged'
  );
}
