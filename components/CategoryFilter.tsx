import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { CategoryFilter as Filter, ReminderCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'health', label: CATEGORY_LABELS.health },
  { id: 'daily_routine', label: CATEGORY_LABELS.daily_routine },
  { id: 'communication', label: CATEGORY_LABELS.communication },
];

const ACCENT: Record<ReminderCategory, string> = {
  health: palette.health,
  daily_routine: palette.daily,
  communication: palette.communication,
};

type Props = {
  value: Filter;
  onChange: (value: Filter) => void;
  counts: Record<Filter, number>;
};

export function CategoryFilter({ value, onChange, counts }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((filter) => {
        const selected = value === filter.id;
        const accent =
          filter.id === 'all' ? palette.teal : ACCENT[filter.id as ReminderCategory];
        return (
          <Pressable
            key={filter.id}
            onPress={() => onChange(filter.id)}
            style={[
              styles.chip,
              selected && { backgroundColor: accent, borderColor: accent },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {filter.label}
            </Text>
            <View style={[styles.badge, selected && styles.badgeSelected]}>
              <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
                {counts[filter.id]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  labelSelected: {
    color: palette.white,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mist,
  },
  badgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
  },
  badgeTextSelected: {
    color: palette.white,
  },
});
