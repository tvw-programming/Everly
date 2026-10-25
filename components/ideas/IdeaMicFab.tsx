import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDockInset } from '@/components/glass/GlassDock';

export type MicState = 'idle' | 'listening' | 'processing' | 'saved';

type Props = {
  state: MicState;
  onPress: () => void;
};

export function IdeaMicFab({ state, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const dockInset = useDockInset();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation();
    if (state === 'idle' || state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: state === 'listening' ? 420 : 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: state === 'listening' ? 420 : 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (state === 'processing') {
      Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.timing(pulse, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [state, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const bg =
    state === 'listening'
      ? '#EF4444'
      : state === 'saved'
        ? '#10B981'
        : state === 'processing'
          ? '#6366F1'
          : '#0EA5A8';

  const label =
    state === 'listening'
      ? 'Listening…'
      : state === 'processing'
        ? 'Organizing…'
        : state === 'saved'
          ? 'Idea organized'
          : 'Capture idea';

  return (
    <View style={[styles.wrap, { bottom: dockInset + 8 }]} pointerEvents="box-none">
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          style={[styles.fab, { backgroundColor: bg }]}
          accessibilityLabel="Voice idea capture"
        >
          <Text style={styles.icon}>{state === 'processing' ? '◌' : '🎙'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    alignItems: 'center',
    gap: 6,
    zIndex: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(248,250,252,0.8)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: { fontSize: 26 },
});
