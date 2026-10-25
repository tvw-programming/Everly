import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { CategoryFilter } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

type Props = {
  filter: CategoryFilter;
};

export function EmptyState({ filter }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Text style={styles.glyph}>◎</Text>
      </View>
      <Text style={styles.title}>No {CATEGORY_LABELS[filter].toLowerCase()} today</Text>
      <Text style={styles.body}>Tap + below to create one for this category.</Text>
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  glyph: {
    fontSize: 22,
    color: t.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: t.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: t.muted,
    textAlign: 'center',
  },
});
