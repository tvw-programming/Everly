import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddReminderFab } from '@/components/AddReminderFab';
import { AmbientAvatar } from '@/components/AmbientAvatar';
import { CategoryAlarmGroup } from '@/components/alarms/CategoryAlarmGroup';
import { DecompressionRoom } from '@/components/DecompressionRoom';
import { HypeInterstitial } from '@/components/HypeInterstitial';
import { PhoneShell } from '@/components/PhoneShell';
import { SyncScoreBadge } from '@/components/SyncScoreBadge';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { useDockInset } from '@/components/glass/GlassDock';
import {
  clearMissedAlarms,
  loadMissedAlarms,
  syncAlarmsOnLaunch,
  type MissedAlarm,
} from '@/lib/alarms/bootstrap';
import { groupAlarmsByCategory, visibleAlarmCategories } from '@/lib/alarms/group';
import { cancelAlarmSchedule, syncAlarmSchedule, testAlarm } from '@/lib/alarms/native';
import { deleteAlarm, upsertAlarm } from '@/lib/alarms/storage';
import type { AlarmReminder } from '@/lib/alarms/types';
import {
  bumpSync,
  claimHypeDelivery,
  findHypeCandidates,
  inferMood,
  loadSyncScore,
  markMemoryDelivered,
  moodFromTranscript,
  persistBio,
  pickRitualForNow,
  popDueMemories,
  shouldDeliverRitual,
  snapshotFromSignals,
} from '@/lib/companion/engine';
import {
  buildCoHabitLine,
  buildLateNightBoundary,
  buildRitualScript,
  buildStressAck,
} from '@/lib/companion/scripts';
import type { CompanionLine } from '@/lib/companion/scripts';
import type { CompanionMood, CompanionVisualState, SyncScore } from '@/lib/companion/types';
import type { ParsedTaskDraft } from '@/lib/parser';
import { setAuraScore } from '@/lib/manifestation/storage';
import { createId, formatHeaderDate } from '@/lib/schedule';
import { scheduleReminderNotification } from '@/lib/notifications';
import { loadReminders, upsertMany } from '@/lib/storage';
import type { ReminderTask } from '@/lib/types';

export default function RemindersDashboard() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dockInset = useDockInset();
  const [alarms, setAlarms] = useState<AlarmReminder[]>([]);
  const [missed, setMissed] = useState<MissedAlarm[]>([]);
  const [reminders, setReminders] = useState<ReminderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<CompanionVisualState>('idle');
  const [inboundScript, setInboundScript] = useState<CompanionLine | string | null>(null);
  const [mood, setMood] = useState<CompanionMood>('grounded');
  const [hypeTask, setHypeTask] = useState<ReminderTask | null>(null);
  const [decompressOpen, setDecompressOpen] = useState(false);
  const [sync, setSync] = useState<SyncScore>({
    sharedStreakDays: 0,
    hydrationSyncs: 0,
    movementSyncs: 0,
    unlockTier: 0,
  });

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [{ alarms: alarmList, missed: missedList }, list, score] = await Promise.all([
        syncAlarmsOnLaunch(),
        loadReminders(),
        loadSyncScore(),
      ]);
      setAlarms(alarmList);
      setMissed(missedList);
      setReminders(list);
      setSync(score);
      const aura = Math.min(
        100,
        55 + score.hydrationSyncs + score.movementSyncs * 2 + alarmList.filter((a) => a.enabled).length
      );
      await setAuraScore(aura);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders');
      setAlarms([]);
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

  useEffect(() => {
    if (hypeTask) return;
    setAvatarState(inboundScript ? 'speaking' : 'idle');
  }, [inboundScript, hypeTask]);

  // Rituals
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const ritual = pickRitualForNow();
      if (!ritual) return;
      const ok = await shouldDeliverRitual(ritual);
      if (!ok || cancelled) return;
      const bio = snapshotFromSignals({ hour: new Date().getHours() });
      await persistBio(bio);
      const m = inferMood(bio);
      setMood(m);
      if (!cancelled) setInboundScript(buildRitualScript(ritual, reminders, m));
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, reminders]);

  // Hype interstitial poll
  useEffect(() => {
    if (loading) return;
    const tick = async () => {
      const candidates = findHypeCandidates(reminders);
      for (const task of candidates) {
        const claimed = await claimHypeDelivery(task.id);
        if (claimed) {
          setHypeTask(task);
          break;
        }
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 30_000);
    return () => clearInterval(id);
  }, [loading, reminders]);

  // Follow-through memories
  useEffect(() => {
    if (loading) return;
    const tick = async () => {
      const due = await popDueMemories();
      for (const mem of due) {
        setInboundScript(mem.prompt);
        await markMemoryDelivered(mem.id, false);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 20_000);
    return () => clearInterval(id);
  }, [loading]);

  // Late-night boundary
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 0 && h < 5 && !loading) {
      setMood('soothing');
      setInboundScript((prev: CompanionLine | string | null) => prev ?? buildLateNightBoundary());
    }
  }, [loading]);

  const byCategory = useMemo(() => groupAlarmsByCategory(alarms), [alarms]);
  const visibleCategories = useMemo(() => visibleAlarmCategories(byCategory), [byCategory]);

  async function draftsToTasks(items: ParsedTaskDraft[]): Promise<ReminderTask[]> {
    const created: ReminderTask[] = items.map((item) => {
      const time =
        item.time ??
        (item.dueAt
          ? `${String(new Date(item.dueAt).getHours()).padStart(2, '0')}:${String(
              new Date(item.dueAt).getMinutes()
            ).padStart(2, '0')}`
          : '09:00');
      return {
        id: createId(),
        title: item.title,
        notes: item.notes,
        category: item.category,
        subCategory: item.subCategory,
        priority: item.priority,
        schedule: { time, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        dueAt: item.dueAt,
        contextTrigger: item.contextTrigger,
        sound: { mode: 'mp3', assetUri: 'chime', assetName: 'Chime' },
        enabled: true,
        completed: false,
        createdAt: new Date().toISOString(),
      };
    });
    for (const rem of created) {
      rem.notificationId = await scheduleReminderNotification(rem);
    }
    return created;
  }

  async function onToggleAlarm(alarm: AlarmReminder, enabled: boolean) {
    const next = { ...alarm, enabled };
    next.nextFireAt = await syncAlarmSchedule(next);
    setAlarms(await upsertAlarm(next));
  }

  async function onTestAlarm(alarm: AlarmReminder) {
    const res = await testAlarm(alarm);
    Alert.alert(
      res.mode === 'native' ? 'Test alarm queued' : 'Preview playing',
      res.mode === 'native'
        ? 'The native alarm service will fire shortly.'
        : 'Playing a bundled preview (4s). Full closed-app playback needs the APK.'
    );
  }

  function onDeleteAlarm(alarm: AlarmReminder) {
    Alert.alert('Delete reminder?', alarm.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelAlarmSchedule(alarm.id);
          setAlarms(await deleteAlarm(alarm.id));
        },
      },
    ]);
  }

  async function onCoHabit(kind: 'hydration' | 'movement') {
    const score = await bumpSync(kind);
    setSync(score);
    setInboundScript(buildCoHabitLine(kind));
    setAvatarState('reacting');
  }

  return (
    <PhoneShell>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: 18 + insets.top }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
            <Link href="/settings" asChild>
              <Pressable style={styles.headerAction} accessibilityLabel="Settings">
                <Text style={styles.headerActionIcon}>⚙</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.presence}>
          <AmbientAvatar
            state={avatarState}
            onPress={() => {
              const hour = new Date().getHours();
              if (hour >= 0 && hour < 5) {
                setDecompressOpen(true);
                return;
              }
              const ritual = pickRitualForNow() ?? 'morning';
              setInboundScript(buildRitualScript(ritual, reminders, mood));
            }}
            onLongPress={() => setDecompressOpen(true)}
          />
          <SyncScoreBadge
            score={sync}
            onHydration={() => void onCoHabit('hydration')}
            onMovement={() => void onCoHabit('movement')}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
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
        ) : (
          <ScrollView
            style={styles.board}
            contentContainerStyle={[styles.boardContent, { paddingBottom: dockInset + 72 }]}
            showsVerticalScrollIndicator={false}
          >
            {missed.length > 0 ? (
              <View style={styles.missed}>
                <Text style={styles.missedTitle}>Missed while away ({missed.length})</Text>
                <Text style={styles.missedBody}>
                  {missed
                    .slice(0, 3)
                    .map((m) => m.title)
                    .join(' · ')}
                  {missed.length > 3 ? '…' : ''} — not auto-played.
                </Text>
                <Pressable
                  onPress={async () => {
                    await clearMissedAlarms();
                    setMissed(await loadMissedAlarms());
                  }}
                >
                  <Text style={styles.missedAction}>Dismiss</Text>
                </Pressable>
              </View>
            ) : null}

            {visibleCategories.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Nothing scheduled</Text>
                <Text style={styles.emptyBody}>
                  Tap + to add a reminder — pick a 12-hour time, a repeat and the music it should
                  ring with.
                </Text>
              </View>
            ) : (
              visibleCategories.map((category) => (
                <CategoryAlarmGroup
                  key={category}
                  category={category}
                  alarms={byCategory[category]}
                  onToggle={(alarm, enabled) => void onToggleAlarm(alarm, enabled)}
                  onEdit={(alarm) =>
                    router.push({ pathname: '/alarm-edit', params: { id: alarm.id } })
                  }
                  onTest={(alarm) => void onTestAlarm(alarm)}
                  onDelete={onDeleteAlarm}
                />
              ))
            )}
          </ScrollView>
        )}

        <WarmInboundBubble
          script={inboundScript}
          onSkip={() => setInboundScript(null)}
          onFinished={() => setInboundScript(null)}
        />

        <AddReminderFab />

        <HypeInterstitial task={hypeTask} onDismiss={() => setHypeTask(null)} />

        <DecompressionRoom
          visible={decompressOpen}
          onClose={() => setDecompressOpen(false)}
          onExtract={async (items) => {
            const created = await draftsToTasks(items);
            const list = await upsertMany(created);
            setReminders(list);
            setInboundScript('Parked those worries as tasks. Rest—I have the board.');
          }}
        />
      </View>
    </PhoneShell>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.surfaces.base },
    header: {
      backgroundColor: t.accent,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionIcon: { fontSize: 20, color: t.onAccent },
    headerDate: { fontSize: 22, fontWeight: '800', color: t.onAccent, letterSpacing: -0.4 },
    presence: { paddingTop: 4, paddingBottom: 2, alignItems: 'center', gap: 2 },
    board: { flex: 1, minHeight: 0 },
    boardContent: { paddingHorizontal: 12, paddingTop: 4 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    error: { color: t.danger, textAlign: 'center', paddingHorizontal: 16 },
    retry: { color: t.accentDark, fontWeight: '700' },
    missed: {
      backgroundColor: t.soft,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    missedTitle: { fontWeight: '900', fontSize: 13, color: t.ink },
    missedBody: { fontSize: 12, lineHeight: 17, marginTop: 4, color: t.muted },
    missedAction: { color: t.accent, fontWeight: '800', marginTop: 6 },
    emptyWrap: { paddingTop: 40, paddingHorizontal: 20, alignItems: 'center', gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: t.ink },
    emptyBody: { fontSize: 13, lineHeight: 19, color: t.muted, textAlign: 'center' },
  });
