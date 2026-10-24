import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryAccent, palette } from '@/constants/Colors';
import type { CategoryFilter as Filter, TaskCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

const TABS: TaskCategory[] = ['personal', 'social', 'professional'];

type Props = {
  value: Filter;
  onChange: (value: Filter) => void;
  counts: Record<TaskCategory, number>;
};

export function CategoryFilter({ value, onChange, counts }: Props) {
  return (
    <View style={styles.grid}>
      {TABS.map((id) => {
        const selected = value === id;
        const accent = categoryAccent[id];
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={[styles.tab, selected && { backgroundColor: accent, borderColor: accent }]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {CATEGORY_LABELS[id]}
            </Text>
            <Text style={[styles.count, selected && styles.countSelected]}>{counts[id]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
  },
  labelSelected: { color: palette.white },
  count: { fontSize: 11, fontWeight: '600', color: palette.muted },
  countSelected: { color: 'rgba(255,255,255,0.85)' },
});
