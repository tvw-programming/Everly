import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IDEA_CATEGORY_META, type IdeaFilter } from '@/lib/ideas/types';

type Props = {
  value: IdeaFilter;
  onChange: (f: IdeaFilter) => void;
};

const FILTERS: { id: IdeaFilter; label: string; accent: string }[] = [
  { id: 'all', label: 'All', accent: '#94A3B8' },
  { id: 'personal', label: 'Personal', accent: IDEA_CATEGORY_META.personal.accent },
  { id: 'social', label: 'Social', accent: IDEA_CATEGORY_META.social.accent },
  { id: 'professional', label: 'Pro', accent: IDEA_CATEGORY_META.professional.accent },
];

export function IdeaFilters({ value, onChange }: Props) {
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
                borderColor: f.accent,
                backgroundColor: on ? f.accent : 'transparent',
              },
            ]}
          >
            <Text style={[styles.text, { color: on ? '#041016' : f.accent }]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
