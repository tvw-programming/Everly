import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PracticeStatement } from '@/lib/practice/types';
import { GlassSurface } from '@/components/glass/GlassSurface';

type Props = {
  statement: PracticeStatement;
  accent: string;
  ink: string;
  muted: string;
  onAccent: string;
  onStart: () => void;
};

export function CueCard({ statement, accent, ink, muted, onAccent, onStart }: Props) {
  const dayLabel =
    statement.cadence === 'weekly' && statement.weekdays?.length
      ? ` · ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .filter((_, i) => statement.weekdays!.includes(i))
          .join('/')}`
      : statement.cadence === 'daily'
        ? ' · Daily'
        : '';

  return (
    <GlassSurface style={styles.card} radius={16}>
      <Text style={[styles.code, { color: accent }]}>
        {statement.code}
        {dayLabel}
      </Text>
      <Text style={[styles.when, { color: ink }]}>{statement.cueText ?? statement.body}</Text>
      {statement.thenText ? (
        <Text style={[styles.then, { color: muted }]}>then {statement.thenText}</Text>
      ) : null}
      <Pressable
        onPress={onStart}
        style={[styles.start, { backgroundColor: accent }]}
        accessibilityRole="button"
        accessibilityLabel={`Start ${statement.code}`}
      >
        <Text style={[styles.startText, { color: onAccent }]}>Start</Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, marginBottom: 10, gap: 8 },
  code: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  when: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  then: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  start: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startText: { fontWeight: '900', fontSize: 15 },
});
