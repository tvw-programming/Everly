import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlarmCard } from '@/components/alarms/AlarmCard';
import { PhoneShell } from '@/components/PhoneShell';
import { useDockInset } from '@/components/glass/GlassDock';
import {
  cancelAlarmSchedule,
  getReliabilityStatus,
  syncAlarmSchedule,
  testAlarm,
} from '@/lib/alarms/native';
import { deleteAlarm, loadAlarms, upsertAlarm } from '@/lib/alarms/storage';
import type { AlarmReminder } from '@/lib/alarms/types';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function AlarmsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dock = useDockInset();
  const [alarms, setAlarms] = useState<AlarmReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await loadAlarms();
      setAlarms(list);
      const status = await getReliabilityStatus();
      if (!status.nativeModule) {
        setBanner('Fallback mode: install the Android APK for closed-app full-song alarms.');
      } else if (!status.exactAlarms) {
        setBanner('Exact alarm access is off — open Reliability to enable.');
      } else {
        setBanner(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <PhoneShell>
      <View style={[styles.root, { backgroundColor: theme.canvas, paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: theme.accent }]}>Alarms</Text>
            <Text style={[styles.title, { color: theme.ink }]}>Personal reminders</Text>
          </View>
          <Link href="/alarm-reliability" asChild>
            <Pressable>
              <Text style={StyleSheet.flatten([styles.link, { color: theme.accent }])}>
                Reliability
              </Text>
            </Pressable>
          </Link>
        </View>

        {banner ? (
          <Text
            style={StyleSheet.flatten([
              styles.banner,
              { color: theme.muted, backgroundColor: theme.soft },
            ])}
          >
            {banner}
          </Text>
        ) : null}

        <Link href="/alarm-edit" asChild>
          <Pressable
            style={StyleSheet.flatten([styles.addBtn, { backgroundColor: theme.accent }])}
          >
            <Text style={StyleSheet.flatten([styles.addText, { color: theme.onAccent }])}>
              + Add Reminder
            </Text>
          </Pressable>
        </Link>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: dock + 16, gap: 0 }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.muted }]}>
                No alarms yet. Add one with a 12-hour time — music rings via the native alarm
                service on a sideloaded APK.
              </Text>
            }
            renderItem={({ item }) => (
              <AlarmCard
                alarm={item}
                onToggle={async (enabled) => {
                  const next = { ...item, enabled };
                  const fire = await syncAlarmSchedule(next);
                  next.nextFireAt = fire;
                  setAlarms(await upsertAlarm(next));
                }}
                onEdit={() => router.push({ pathname: '/alarm-edit', params: { id: item.id } })}
                onTest={async () => {
                  const res = await testAlarm(item);
                  Alert.alert(
                    res.mode === 'native' ? 'Test alarm queued' : 'Preview playing',
                    res.mode === 'native'
                      ? 'Native module will fire shortly.'
                      : 'Playing bundled preview (4s). Full closed-app playback needs the APK.'
                  );
                }}
                onDelete={() => {
                  Alert.alert('Delete alarm?', item.title, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await cancelAlarmSchedule(item.id);
                        setAlarms(await deleteAlarm(item.id));
                      },
                    },
                  ]);
                }}
              />
            )}
          />
        )}
      </View>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  kicker: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '900' },
  link: { fontWeight: '800', fontSize: 13, paddingBottom: 4 },
  banner: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  addBtn: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addText: { fontWeight: '900', fontSize: 16 },
  empty: { padding: 24, textAlign: 'center', lineHeight: 20 },
});
