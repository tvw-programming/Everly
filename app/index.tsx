import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryFilter } from '@/components/CategoryFilter';
import { EmptyState } from '@/components/EmptyState';
import { ReminderCard } from '@/components/ReminderCard';
import { palette } from '@/constants/Colors';
import {
  cancelReminderNotification,
  ensureNotificationPermissions,
  scheduleReminderNotification,
} from '@/lib/notifications';
import { deleteReminder, loadReminders, upsertReminder } from '@/lib/storage';
import type { CategoryFilter as Filter, Reminder } from '@/lib/types';

export default function RemindersDashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionHint, setPermissionHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await loadReminders();
      setReminders(list);
      if (Platform.OS !== 'web') {
        const granted = await ensureNotificationPermissions();
        setPermissionHint(
          granted
            ? null
            : 'Notifications are off — reminders will save, but sounds will not fire on time until permission is granted.'
        );
      } else {
        setPermissionHint(
          'Web preview: browse and add reminders here. Schedule + MP3 playback needs Expo Go or a device build.'
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const counts = useMemo(
    () => ({
      all: reminders.length,
      health: reminders.filter((r) => r.category === 'health').length,
      daily_routine: reminders.filter((r) => r.category === 'daily_routine').length,
      communication: reminders.filter((r) => r.category === 'communication').length,
    }),
    [reminders]
  );

  const visible = useMemo(
    () => (filter === 'all' ? reminders : reminders.filter((r) => r.category === filter)),
    [reminders, filter]
  );

  async function handleToggle(id: string, enabled: boolean) {
    const current = reminders.find((r) => r.id === id);
    if (!current) return;
    const updated: Reminder = { ...current, enabled };
    if (!enabled) {
      await cancelReminderNotification(current.notificationId);
      updated.notificationId = undefined;
    } else {
      updated.notificationId = await scheduleReminderNotification(updated);
    }
    const list = await upsertReminder(updated);
    setReminders(list);
  }

  async function handleDelete(id: string) {
    const current = reminders.find((r) => r.id === id);
    if (current?.notificationId) {
      await cancelReminderNotification(current.notificationId);
    }
    const list = await deleteReminder(id);
    setReminders(list);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Local reminders</Text>
          <Text style={styles.title}>Your day, on cue</Text>
        </View>
        <Link href="/add-reminder" asChild>
          <Pressable style={styles.addBtn} accessibilityLabel="Add reminder">
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </Link>
      </View>

      <CategoryFilter value={filter} onChange={setFilter} counts={counts} />

      {permissionHint ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{permissionHint}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.teal} size="large" />
          <Text style={styles.muted}>Loading reminders…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              void refresh();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void refresh();
              }}
              tintColor={palette.teal}
            />
          }
          ListEmptyComponent={<EmptyState filter={filter} />}
          renderItem={({ item }) => (
            <ReminderCard reminder={item} onToggle={handleToggle} onDelete={handleDelete} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: { flex: 1, gap: 2 },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: palette.white,
    fontSize: 32,
    fontWeight: '400',
    marginTop: -2,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B55',
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
  },
  list: {
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  muted: {
    color: palette.muted,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.danger,
  },
  retry: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.mist,
  },
  retryText: {
    fontWeight: '700',
    color: palette.tealDark,
  },
});
