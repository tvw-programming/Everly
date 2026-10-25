import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientAvatar } from '@/components/AmbientAvatar';
import { CategoryQuadrant } from '@/components/CategoryQuadrant';
import { DecompressionRoom } from '@/components/DecompressionRoom';
import { HypeInterstitial } from '@/components/HypeInterstitial';
import { PhoneShell } from '@/components/PhoneShell';
import { SyncScoreBadge } from '@/components/SyncScoreBadge';
import { VoiceCapture } from '@/components/VoiceCapture';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { categoryColors } from '@/lib/theme/categories';
import {
  bumpSync,
  claimHypeDelivery,
  completionsThisHour,
  findHypeCandidates,
  inferMood,
  loadSyncScore,
  markMemoryDelivered,
  moodFromTranscript,
  persistBio,
  pickRitualForNow,
  popDueMemories,
  recordCompletion,
  scheduleFollowUpFast,
  shouldDeliverRitual,
  snapshotFromSignals,
} from '@/lib/companion/engine';
import {
  buildCoHabitLine,
  buildFollowUpScript,
  buildLateNightBoundary,
  buildReactionLine,
  buildRitualScript,
  buildStressAck,
} from '@/lib/companion/scripts';
import type { CompanionLine } from '@/lib/companion/scripts';
import type { CompanionMood, CompanionVisualState, SyncScore } from '@/lib/companion/types';
import type { ParsedTaskDraft } from '@/lib/parser';
import { setAuraScore } from '@/lib/manifestation/storage';
import {
  createId,
  formatHeaderDate,
  isScheduledToday,
  sortByPriority,
} from '@/lib/schedule';
import { scheduleReminderNotification } from '@/lib/notifications';
import { loadReminders, upsertMany, upsertReminder } from '@/lib/storage';
import type { ReminderTask, TaskCategory } from '@/lib/types';

const CATEGORIES: TaskCategory[] = ['personal', 'social', 'professional', 'financial'];

export default function RemindersDashboard() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [reminders, setReminders] = useState<ReminderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<CompanionVisualState>('idle');
  const [inboundScript, setInboundScript] = useState<CompanionLine | string | null>(null);
  const [listening, setListening] = useState(false);
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
      const [list, score] = await Promise.all([loadReminders(), loadSyncScore()]);
      setReminders(list);
      setSync(score);
      const aura = Math.min(
        100,
        55 + score.hydrationSyncs + score.movementSyncs * 2 + list.filter((t) => t.completed).length
      );
      await setAuraScore(aura);
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

  useEffect(() => {
    if (hypeTask) return;
    setAvatarState(listening ? 'listening' : inboundScript ? 'speaking' : 'idle');
  }, [listening, inboundScript, hypeTask]);

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

  const byCategory = useMemo(() => {
    const today = reminders.filter((r) => r.enabled && isScheduledToday(r.schedule));
    const map: Record<TaskCategory, ReminderTask[]> = {
      personal: [],
      social: [],
      professional: [],
      financial: [],
    };
    for (const r of today) map[r.category].push(r);
    for (const c of CATEGORIES) map[c] = map[c].sort(sortByPriority);
    return map;
  }, [reminders]);

  /** A category with nothing scheduled today is left off the board entirely. */
  const visibleCategories = useMemo(
    () => CATEGORIES.filter((cat) => byCategory[cat].some((t) => !t.completed)),
    [byCategory]
  );

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

  async function handleToggle(id: string, completed: boolean) {
    const current = reminders.find((r) => r.id === id);
    if (!current) return;
    const list = await upsertReminder({ ...current, completed });
    setReminders(list);
    if (completed) {
      const count = await recordCompletion();
      const bio = snapshotFromSignals({ completionsLastHour: count });
      await persistBio(bio);
      const m = inferMood(bio);
      setMood(m);
      setAvatarState('reacting');
      setInboundScript(buildReactionLine({ ...current, completed: true }, m));
      await scheduleFollowUpFast(current, buildFollowUpScript(current));
      setTimeout(() => setAvatarState('idle'), 700);
    }
  }

  async function handleVoiceParsed(items: ParsedTaskDraft[], raw?: string) {
    if (raw) {
      const bio = moodFromTranscript(raw);
      await persistBio(bio);
      const m = inferMood(bio);
      setMood(m);
      if (m === 'soothing' && bio.signals.includes('rapid_speech')) {
        setInboundScript(buildStressAck(raw));
      }
    }
    const created = await draftsToTasks(items);
    const list = await upsertMany(created);
    setReminders(list);
    setAvatarState('reacting');
    setInboundScript(
      created.length === 1
        ? `Got it—I routed that into ${created[0].category}.`
        : `Routed ${created.length} thoughts into your buckets.`
    );
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
              <Pressable style={styles.headerAction} accessibilityLabel="Theme settings">
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

        <View style={styles.board}>
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
            visibleCategories.map((cat) => (
              <CategoryQuadrant
                key={cat}
                category={cat}
                accent={categoryColors(cat, theme.mode).accent}

                tasks={byCategory[cat]}
                onToggle={handleToggle}
              />
            ))
          )}
        </View>

        <WarmInboundBubble
          script={inboundScript}
          onSkip={() => setInboundScript(null)}
          onFinished={() => setInboundScript(null)}
        />

        <VoiceCapture
          onParsed={handleVoiceParsed}
          onOpenChange={(open) => setListening(open)}
          onTranscriptMood={(text) => {
            const bio = moodFromTranscript(text);
            void persistBio(bio).then(() => setMood(inferMood(bio)));
          }}
        />

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
  headerDate: {
    fontSize: 22,
    fontWeight: '800',
    color: t.onAccent,
    letterSpacing: -0.4,
  },
  presence: { paddingTop: 4, paddingBottom: 2, alignItems: 'center', gap: 2 },
  board: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 6,
    overflow: 'hidden',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  error: { color: t.danger, textAlign: 'center', paddingHorizontal: 16 },
  retry: { color: t.accentDark, fontWeight: '700' },
});
