import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { CompanionVisualState } from '@/lib/companion/types';

type Props = {
  state: CompanionVisualState;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function AmbientAvatar({ state, onPress, onLongPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    pulse.stopAnimation();
    glow.stopAnimation();

    if (state === 'idle' || state === 'speaking') {
      // ~60 BPM → 1000ms cycle
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.timing(glow, {
        toValue: state === 'speaking' ? 0.85 : 0.4,
        duration: 280,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.55, duration: 420, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(pulse, { toValue: 0.6, duration: 200, useNativeDriver: true }).start();
      return;
    }

    // reacting
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.4, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [state, pulse, glow]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, state === 'reacting' ? 1.18 : 1.08],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel="Companion presence"
      style={styles.wrap}
    >
      <Animated.View style={[styles.halo, { opacity: glow, transform: [{ scale }] }]} />
      <View style={styles.core}>
        <View style={styles.inner} />
      </View>
    </Pressable>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  halo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: t.accent,
  },
  core: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.surfaces.base,
    borderWidth: 2,
    borderColor: t.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: t.accent,
  },
});
