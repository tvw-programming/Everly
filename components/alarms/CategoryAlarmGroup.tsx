import { StyleSheet, Text, View } from 'react-native';

import { AlarmCard } from '@/components/alarms/AlarmCard';
import { ALARM_CATEGORY_LABELS, type AlarmCategory, type AlarmReminder } from '@/lib/alarms/types';
import { categoryAccentFor } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  category: AlarmCategory;
  alarms: AlarmReminder[];
  onToggle: (alarm: AlarmReminder, enabled: boolean) => void;
  onEdit: (alarm: AlarmReminder) => void;
  onTest: (alarm: AlarmReminder) => void;
  onDelete: (alarm: AlarmReminder) => void;
};

/** One category's reminders on the Home board. */
export function CategoryAlarmGroup({
  category,
  alarms,
  onToggle,
  onEdit,
  onTest,
  onDelete,
}: Props) {
  const { theme } = useTheme();
  const accent = categoryAccentFor(category, theme.mode);
  const on = alarms.filter((a) => a.enabled).length;

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.label, { color: accent }]}>
          {ALARM_CATEGORY_LABELS[category]}
        </Text>
        <Text style={[styles.count, { color: theme.muted }]}>
          {on} on · {alarms.length} total
        </Text>
      </View>

      {alarms.map((alarm) => (
        <AlarmCard
          key={alarm.id}
          alarm={alarm}
          onToggle={(enabled) => onToggle(alarm, enabled)}
          onEdit={() => onEdit(alarm)}
          onTest={() => onTest(alarm)}
          onDelete={() => onDelete(alarm)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  count: { fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
});
