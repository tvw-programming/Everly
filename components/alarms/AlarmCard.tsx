import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { GlassSurface } from '@/components/glass/GlassSurface';
import {
  buildAlarmSummary,
  formatAlarmTime,
  formatNextFire,
  formatRepeatSummary,
} from '@/lib/alarms/schedule';
import { ALARM_CATEGORY_LABELS, type AlarmReminder } from '@/lib/alarms/types';
import { categoryAccentFor } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  alarm: AlarmReminder;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onTest: () => void;
  onDelete: () => void;
};

export function AlarmCard({ alarm, onToggle, onEdit, onTest, onDelete }: Props) {
  const { theme } = useTheme();
  const accent = categoryAccentFor(alarm.category, theme.mode);

  return (
    <GlassSurface style={styles.card} radius={16}>
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.cat, { color: accent }]}>
              {ALARM_CATEGORY_LABELS[alarm.category]}
            </Text>
            <Text style={[styles.title, { color: theme.ink }]} numberOfLines={1}>
              {alarm.title}
            </Text>
            <Text style={[styles.time, { color: theme.ink }]}>
              {formatAlarmTime(alarm.hour12, alarm.minute, alarm.period)}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {formatRepeatSummary(alarm)} · Next {formatNextFire(alarm.nextFireAt)}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]} numberOfLines={1}>
              {alarm.audio.displayName}
              {alarm.vibration ? ' · Vibrate' : ''}
              {alarm.audio.source !== 'silent' ? ' · Sound' : ' · Silent'}
            </Text>
          </View>
          <Switch
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{ true: theme.accent, false: theme.border }}
          />
        </View>

        <Text style={[styles.summary, { color: theme.muted }]} numberOfLines={2}>
          {buildAlarmSummary(alarm)}
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.action}>
            <Text style={[styles.actionText, { color: theme.accent }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={onTest} style={styles.action}>
            <Text style={[styles.actionText, { color: theme.accent }]}>Test</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.action}>
            <Text style={[styles.actionText, { color: theme.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden', marginBottom: 10 },
  stripe: { width: 4 },
  body: { flex: 1, padding: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cat: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800' },
  time: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  meta: { fontSize: 12, fontWeight: '600' },
  summary: { fontSize: 11, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 14 },
  action: { paddingVertical: 4 },
  actionText: { fontWeight: '800', fontSize: 13 },
});
