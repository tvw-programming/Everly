import type { EverlyTheme } from '@/lib/theme/buildTheme';
import type { IdeaFilter } from '@/lib/ideas/types';
import { categoryColors } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';


type Props = {
  value: IdeaFilter;
  onChange: (f: IdeaFilter) => void;
};

const FILTERS: { id: IdeaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'social', label: 'Social' },
  { id: 'professional', label: 'Pro' },
];

export function IdeaFilters({ value, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const chipAccent = (id: IdeaFilter) =>
    id === 'all' ? theme.muted : categoryColors(id, theme.mode).accent;
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => {
        const on = value === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[
              styles.chip,
              {
                borderColor: chipAccent(f.id),
                backgroundColor: on ? chipAccent(f.id) : 'transparent',
              },
            ]}
          >
            <Text style={[styles.text, { color: on ? theme.surfaces.base : chipAccent(f.id) }]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 12 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  text: { fontSize: 11, fontWeight: '800' },
});
