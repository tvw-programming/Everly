import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { CategoryFilter } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

type Props = {
  filter: CategoryFilter;
};

export function EmptyState({ filter }: Props) {
  const label =
    filter === 'all' ? 'reminders' : `${CATEGORY_LABELS[filter].toLowerCase()} reminders`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.glyph}>◎</Text>
      <Text style={styles.title}>No {label} yet</Text>
      <Text style={styles.body}>
        Tap + in the top bar to add one. Pick a category, time, and a local MP3 that plays when it
        fires.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 36,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    backgroundColor: palette.mist,
    alignItems: 'center',
    gap: 10,
  },
  glyph: {
    fontSize: 36,
    color: palette.teal,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.muted,
    textAlign: 'center',
  },
});
