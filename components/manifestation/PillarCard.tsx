import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { categoryColors } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar;
  active?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

export function PillarCard({ pillar, active, onPress, onLongPress }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const accent = categoryColors(pillar.id, theme.mode).accent;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        { borderColor: accent },
        active && { shadowColor: accent, shadowOpacity: 0.55 },
      ]}
    >
      <ImageBackground source={{ uri: pillar.stillUri }} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.glass}>
          <Text style={[styles.label, { color: accent }]}>{pillar.label}</Text>
          {pillar.goalLabel ? <Text style={styles.goal}>{pillar.goalLabel}</Text> : null}
          <Text style={styles.affirm} numberOfLines={3}>
            {pillar.identityScript}
          </Text>
          <Text style={styles.micro} numberOfLines={1}>
            {pillar.microStrip}
          </Text>
          <Text style={styles.hint}>Tap play · Hold Reality Lock</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: t.canvas,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bg: { flex: 1 },
  bgImage: { opacity: 0.55 },
  glass: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(8,12,20,0.55)',
    justifyContent: 'space-between',
    gap: 4,
  },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  goal: { fontSize: 12, fontWeight: '700', color: t.onAccent },
  affirm: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  micro: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  hint: { fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
});
