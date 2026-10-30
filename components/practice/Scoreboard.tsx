import { StyleSheet, Text, View, Pressable } from 'react-native';

import { SCOREBOARD_LABELS, targetFor } from '@/lib/practice/scoreboard';
import {
  WEEKLY_TARGETS,
  type ScoreboardMetric,
  type ScoreboardWeek,
} from '@/lib/practice/types';
import { GlassSurface } from '@/components/glass/GlassSurface';

type Props = {
  week: ScoreboardWeek;
  totals: Record<ScoreboardMetric, number>;
  accent: string;
  ink: string;
  muted: string;
  soft: string;
  onAccent: string;
  onIncrement: (metric: ScoreboardMetric) => void;
};

const INPUT_METRICS = Object.keys(WEEKLY_TARGETS) as Exclude<ScoreboardMetric, 'rejections'>[];

export function ScoreboardView({
  week,
  totals,
  accent,
  ink,
  muted,
  soft,
  onAccent,
  onIncrement,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: ink }]}>Weekly inputs</Text>
      <Text style={[styles.sub, { color: muted }]}>
        Count what you control. No offers, revenue, or callbacks here.
      </Text>
      {INPUT_METRICS.map((m) => {
        const actual = week[m];
        const target = targetFor(m);
        const pct = Math.min(1, actual / target);
        return (
          <GlassSurface key={m} style={styles.row} radius={14}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.label, { color: ink }]}>{SCOREBOARD_LABELS[m]}</Text>
              <View style={[styles.barTrack, { backgroundColor: soft }]}>
                <View
                  style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: accent }]}
                />
              </View>
              <Text style={[styles.meta, { color: muted }]}>
                {actual} / {target} this week · {totals[m]} ~6mo
              </Text>
            </View>
            <Pressable
              onPress={() => onIncrement(m)}
              style={[styles.plus, { backgroundColor: accent }]}
              accessibilityLabel={`Add one ${SCOREBOARD_LABELS[m]}`}
            >
              <Text style={{ color: onAccent, fontWeight: '900', fontSize: 18 }}>+1</Text>
            </Pressable>
          </GlassSurface>
        );
      })}
      <Text style={[styles.meta, { color: muted, marginTop: 4 }]}>
        Rejections logged (volume): {week.rejections}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingHorizontal: 14 },
  title: { fontSize: 18, fontWeight: '900', paddingHorizontal: 2 },
  sub: { fontSize: 12, lineHeight: 17, marginBottom: 4, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  label: { fontWeight: '800', fontSize: 13 },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  meta: { fontSize: 11, fontWeight: '600' },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
