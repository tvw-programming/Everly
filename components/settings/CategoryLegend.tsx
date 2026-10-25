import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { CATEGORY_KEYS } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';
import { mix } from '@/lib/theme/color';
import { LEGEND_SURFACE, RADIUS, SPACE } from '@/lib/theme/tokens';

const LABELS: Record<string, string> = {
  personal: 'Personal',
  social: 'Social',
  professional: 'Professional',
  financial: 'Financial',
};

const FEEL: Record<string, string> = {
  personal: 'Warm, individual, expressive',
  social: 'Friendly, connected, energetic',
  professional: 'Trustworthy, focused, neutral',
  financial: 'Growth, money, positive status',
};

/** The category identity colours, as they resolve in the current mode. */
export function CategoryLegend() {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      {CATEGORY_KEYS.map((key) => {
        const { accent } = theme.categories[key];
        // The hue reads on the border and dot; the card itself stays neutral.
        const edge = mix(accent, '#000000', theme.mode === 'dark' ? 0.45 : 0.3);
        return (
          <View
            key={key}
            style={[
              styles.row,
              { backgroundColor: LEGEND_SURFACE[theme.mode], borderColor: edge },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <View style={styles.text}>
              <Text variant="bodyMedium" style={[styles.name, { color: theme.ink }]}>
                {LABELS[key]}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.muted }}>
                {FEEL[key]}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: theme.ink }}>
              {accent}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[1],
    padding: SPACE[2],
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  text: { flex: 1 },
  name: { fontWeight: '700' },
});
