import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { snoozeActiveAlarm, stopActiveAlarm } from '@/lib/alarms/native';
import { formatAlarmTime } from '@/lib/alarms/schedule';
import { getAlarm } from '@/lib/alarms/storage';
import type { AlarmReminder } from '@/lib/alarms/types';
import { useTheme } from '@/lib/theme/ThemeContext';

/** Large Stop / Snooze screen — opened from notification tap when possible. */
export default function AlarmActiveScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [alarm, setAlarm] = useState<AlarmReminder | null>(null);

  useEffect(() => {
    if (!id) return;
    void getAlarm(id).then(setAlarm);
  }, [id]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: '#05080F',
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Text style={styles.kicker}>Active alarm</Text>
      <Text style={styles.title}>{alarm?.title ?? 'Reminder'}</Text>
      {alarm ? (
        <Text style={styles.time}>
          {formatAlarmTime(alarm.hour12, alarm.minute, alarm.period)}
        </Text>
      ) : null}
      {alarm?.description ? <Text style={styles.desc}>{alarm.description}</Text> : null}

      <Pressable
        style={[styles.primary, { backgroundColor: theme.accent }]}
        onPress={async () => {
          await stopActiveAlarm();
          router.replace('/alarms');
        }}
      >
        <Text style={[styles.primaryText, { color: theme.onAccent }]}>Stop</Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={async () => {
          await snoozeActiveAlarm(alarm?.snoozeMinutes ?? 10);
          router.replace('/alarms');
        }}
      >
        <Text style={styles.secondaryText}>
          Snooze {alarm?.snoozeMinutes ?? 10} min
        </Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          await stopActiveAlarm();
          router.replace('/alarms');
        }}
      >
        <Text style={styles.done}>Mark as Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 14 },
  kicker: {
    color: '#5EEAD4',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: { color: '#F8FAFC', fontSize: 32, fontWeight: '900' },
  time: { color: '#E2E8F0', fontSize: 40, fontWeight: '900' },
  desc: { color: 'rgba(248,250,252,0.7)', fontSize: 16, lineHeight: 22 },
  primary: { marginTop: 24, borderRadius: 18, paddingVertical: 22, alignItems: 'center' },
  primaryText: { fontSize: 22, fontWeight: '900' },
  secondary: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  secondaryText: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  done: { textAlign: 'center', color: '#94A3B8', fontWeight: '800', marginTop: 8 },
});
