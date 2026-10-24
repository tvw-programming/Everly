import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Full-bleed themed root with optional CSS multi-stop gradients (web glass / dark). */
export function ThemedCanvas({ children, style }: Props) {
  const { theme } = useTheme();

  const webGradient =
    Platform.OS === 'web' && theme.canvasGradient
      ? ({
          backgroundImage: theme.canvasGradient,
          backgroundColor: theme.canvas,
        } as ViewStyle)
      : { backgroundColor: theme.canvas };

  return (
    <View style={[styles.root, webGradient, style]}>
      {theme.id === 'glass' ? (
        <>
          <View pointerEvents="none" style={[styles.orb, styles.orbCyan]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbAmber]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbEmerald]} />
          <View pointerEvents="none" style={styles.glassSheen} />
        </>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1, zIndex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  orbCyan: {
    width: 220,
    height: 220,
    top: -40,
    left: -60,
    backgroundColor: 'rgba(34,211,238,0.55)',
  },
  orbAmber: {
    width: 200,
    height: 200,
    top: 80,
    right: -70,
    backgroundColor: 'rgba(245,158,11,0.42)',
  },
  orbEmerald: {
    width: 240,
    height: 240,
    bottom: -50,
    left: 40,
    backgroundColor: 'rgba(16,185,129,0.38)',
  },
  glassSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
