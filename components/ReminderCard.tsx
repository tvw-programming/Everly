import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { formatNextFire, formatScheduleSummary } from '@/lib/schedule';
import { getBundledSoundName } from '@/lib/sounds';
import type { Reminder, ReminderCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';

const ACCENT: Record<ReminderCategory, string> = {
  health: palette.health,
  daily_routine: palette.daily,
  communication: palette.communication,
};

type Props = {
  reminder: Reminder;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
};

export function ReminderCard({ reminder, onToggle, onDelete }: Props) {
  const accent = ACCENT[reminder.category];
  const soundLabel =
    getBundledSoundName(reminder.sound.assetUri) ?? reminder.sound.assetName;

  return (
    <View style={[styles.card, !reminder.enabled && styles.cardDisabled]}>
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.chip, { backgroundColor: `${accent}18` }]}>
            <Text style={[styles.chipText, { color: accent }]}>
              {CATEGORY_LABELS[reminder.category]}
            </Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={(v) => onToggle(reminder.id, v)}
            trackColor={{ false: palette.border, true: `${accent}88` }}
            thumbColor={reminder.enabled ? accent : '#f4f4f4'}
          />
        </View>

        <Text style={styles.title}>{reminder.title}</Text>
        {reminder.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {reminder.notes}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatNextFire(reminder)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaMuted}>{formatScheduleSummary(reminder.schedule)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.sound}>♪ {soundLabel}</Text>
          <Pressable
            onPress={() => onDelete(reminder.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${reminder.title}`}
          >
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.62,
  },
  stripe: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
  },
  notes: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.tealDark,
  },
  metaDot: {
    color: palette.muted,
  },
  metaMuted: {
    fontSize: 13,
    color: palette.muted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sound: {
    fontSize: 13,
    color: palette.muted,
  },
  delete: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.danger,
  },
});
