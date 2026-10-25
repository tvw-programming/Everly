import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Full-bleed themed root: gradient wash plus the soft orbs of the 3D glass style. */
export function GradientCanvas({ children, style }: Props) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={theme.canvasColors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.root, style]}
    >
      {theme.orbColors.map((color, i) => (
        <View
          key={color + i}
          pointerEvents="none"
          style={[styles.orb, ORB_POSITIONS[i], { backgroundColor: color }]}
        />
      ))}
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const ORB_POSITIONS: ViewStyle[] = [
  { width: 260, height: 260, top: -70, left: -80 },
  { width: 220, height: 220, top: 90, right: -80 },
  { width: 280, height: 280, bottom: -90, left: 20 },
];

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1, zIndex: 1 },
  orb: { position: 'absolute', borderRadius: 999 },
});
