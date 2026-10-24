import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryFilter } from '@/components/CategoryFilter';
import { EmptyState } from '@/components/EmptyState';
import { PhoneShell } from '@/components/PhoneShell';
import { ReminderCard } from '@/components/ReminderCard';
import { palette } from '@/constants/Colors';
import {
  formatHeaderDate,
  isScheduledToday,
  sortByTime,
} from '@/lib/schedule';
import { loadReminders, upsertReminder } from '@/lib/storage';
import type { CategoryFilter as Filter, Reminder, ReminderCategory } from '@/lib/types';

/** Max items so the mockup stays single-screen with no scrolling */
const MAX_VISIBLE = 4;

export default function RemindersDashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<Filter>('health');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await Promise.race([
        loadReminders(),
        new Promise<Reminder[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timed out loading reminders')), 4000)
        ),
      ]);
      setReminders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const todayByCategory = useMemo(() => {
    const today = reminders.filter((r) => r.enabled && isScheduledToday(r.schedule));
    return {
      health: today.filter((r) => r.category === 'health').sort(sortByTime),
      daily_routine: today.filter((r) => r.category === 'daily_routine').sort(sortByTime),
      communication: today.filter((r) => r.category === 'communication').sort(sortByTime),
    } satisfies Record<ReminderCategory, Reminder[]>;
  }, [reminders]);

  const counts = useMemo(
    () => ({
      health: todayByCategory.health.length,
      daily_routine: todayByCategory.daily_routine.length,
      communication: todayByCategory.communication.length,
    }),
    [todayByCategory]
  );

  const visibleAll = todayByCategory[filter];
  const visible = visibleAll.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, visibleAll.length - MAX_VISIBLE);

  async function handleToggleComplete(id: string, completed: boolean) {
    const current = reminders.find((r) => r.id === id);
    if (!current) return;
    const list = await upsertReminder({ ...current, completed });
    setReminders(list);
  }

  return (
    <PhoneShell>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
          <Text style={styles.headerSub}>Today’s reminders</Text>
        </View>

        <CategoryFilter value={filter} onChange={setFilter} counts={counts} />

        <View style={styles.listArea}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.muted}>Loading…</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
              <Pressable
                onPress={() => {
                  setLoading(true);
                  void refresh();
                }}
              >
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            </View>
          ) : visible.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <View style={styles.list}>
              {visible.map((item) => (
                <ReminderCard
                  key={item.id}
                  reminder={item}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
              {overflow > 0 ? (
                <Text style={styles.overflow}>+{overflow} more later today</Text>
              ) : null}
            </View>
          )}
        </View>

        {Platform.OS === 'web' ? (
          <Text style={styles.webHint}>Web preview · timed MP3 needs a device</Text>
        ) : null}

        <View style={styles.bottomNav}>
          <View style={styles.navSide}>
            <Text style={[styles.navIcon, styles.navActive]}>⌂</Text>
            <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
          </View>

          <Link href="/add-reminder" asChild>
            <Pressable style={styles.fab} accessibilityLabel="Add reminder">
              <Text style={styles.fabPlus}>+</Text>
            </Pressable>
          </Link>

          <View style={styles.navSide}>
            <Text style={styles.navIcon}>▦</Text>
            <Text style={styles.navLabel}>Calendar</Text>
          </View>
        </View>
      </View>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.white,
  },
  header: {
    backgroundColor: palette.accent,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerDate: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  listArea: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  list: {
    gap: 10,
  },
  overflow: {
    textAlign: 'center',
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  muted: {
    color: palette.muted,
    fontSize: 13,
  },
  error: {
    color: palette.danger,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retry: {
    color: palette.accentDark,
    fontWeight: '700',
  },
  webHint: {
    textAlign: 'center',
    fontSize: 11,
    color: palette.muted,
    paddingBottom: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingTop: 8,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  navSide: {
    width: 72,
    alignItems: 'center',
    gap: 2,
    paddingBottom: 4,
  },
  navIcon: {
    fontSize: 20,
    color: palette.muted,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
  },
  navActive: {
    color: palette.accent,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPlus: {
    color: palette.white,
    fontSize: 36,
    fontWeight: '400',
    marginTop: -2,
  },
});
