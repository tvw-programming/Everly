import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryColors } from '@/lib/theme/categories';
import { formatTimeDisplay } from '@/lib/schedule';
import type { Reminder } from '@/lib/types';

type Props = {
  reminder: Reminder;
  onToggleComplete: (id: string, completed: boolean) => void;
};

export function ReminderCard({ reminder, onToggleComplete }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { accent, container } = categoryColors(reminder.category, theme.mode);
  const done = Boolean(reminder.completed);

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: accent },
        done && styles.cardDone,
      ]}
    >
      <Pressable
        onPress={() => onToggleComplete(reminder.id, !done)}
        style={[styles.check, done && { backgroundColor: accent, borderColor: accent }]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.time, done && styles.struck]}>{formatTimeDisplay(reminder.schedule.time)}</Text>
        <Text style={[styles.title, done && styles.struck]} numberOfLines={1}>
          {reminder.title}
        </Text>
        {reminder.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {reminder.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: t.cardBg,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    // Soft shadow like the mockup cards
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
  },
  cardDone: {
    opacity: 0.55,
    backgroundColor: t.soft,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.surfaces.base,
  },
  checkMark: {
    color: t.onAccent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: -1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  time: {
    fontSize: 20,
    fontWeight: '800',
    color: t.ink,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: t.ink,
  },
  notes: {
    fontSize: 12,
    color: t.muted,
  },
  struck: {
    textDecorationLine: 'line-through',
    color: t.muted,
  },
});
