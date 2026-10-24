import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AmbientAvatar } from '@/components/AmbientAvatar';
import { BottomDock } from '@/components/BottomDock';
import { CategoryQuadrant } from '@/components/CategoryQuadrant';
import { DecompressionRoom } from '@/components/DecompressionRoom';
import { HypeInterstitial } from '@/components/HypeInterstitial';
import { PhoneShell } from '@/components/PhoneShell';
import { SyncScoreBadge } from '@/components/SyncScoreBadge';
import { VoiceCapture } from '@/components/VoiceCapture';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { categoryAccent, palette } from '@/constants/Colors';
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
import type { CompanionMood, CompanionVisualState, SyncScore } from '@/lib/companion/types';
import type { ParsedTaskDraft } from '@/lib/parser';
import {
  createId,
  formatHeaderDate,
  isScheduledToday,
  sortByPriority,
} from '@/lib/schedule';
import { scheduleReminderNotification } from '@/lib/notifications';
import { loadReminders, upsertMany, upsertReminder } from '@/lib/storage';
import type { ReminderTask, TaskCategory } from '@/lib/types';

const CATEGORIES: TaskCategory[] = ['personal', 'social', 'professional'];

export default function RemindersDashboard() {
  const [reminders, setReminders] = useState<ReminderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<CompanionVisualState>('idle');
  const [inboundScript, setInboundScript] = useState<string | null>(null);
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
    setAvatarState(listening ? 'listening' : inboundScript ? 'speaking' : 'idle');
  }, [listening, inboundScript]);

  // Rituals
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        setInboundScript(buildLateNightBoundary());
        setMood('soothing');
        return;
      }
      const ritual = pickRitualForNow();
      if (!ritual) return;
      const ok = await shouldDeliverRitual(ritual);
      if (!ok || cancelled) return;
      const nextMood = inferMood(snapshotFromSignals({ hour }));
      setMood(nextMood);
      setInboundScript(buildRitualScript(ritual, reminders, nextMood));
    })();
    return () => {
      cancelled = true;
    };
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps -- once per mount/load

  // Hype window poll + follow-up memories
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
      const due = await popDueMemories();
      if (due[0] && !inboundScript) {
        setInboundScript(due[0].prompt);
        await markMemoryDelivered(due[0].id);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 20_000);
    return () => clearInterval(id);
  }, [loading, reminders, inboundScript]);

  const byCategory = useMemo(() => {
    const today = reminders.filter((r) => r.enabled && isScheduledToday(r.schedule));
    const map: Record<TaskCategory, ReminderTask[]> = {
      personal: [],
      social: [],
      professional: [],
    };
    for (const r of today) map[r.category].push(r);
    for (const c of CATEGORIES) map[c] = map[c].sort(sortByPriority);
    return map;
  }, [reminders]);

  async function createFromDrafts(items: ParsedTaskDraft[]) {
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
    const list = await upsertMany(created);
    setReminders(list);
    return created;
  }

  async function handleToggle(id: string, completed: boolean) {
    const current = reminders.find((r) => r.id === id);
    if (!current) return;
    const list = await upsertReminder({ ...current, completed });
    setReminders(list);
    if (completed) {
      const count = await recordCompletion();
      const snap = snapshotFromSignals({ completionsLastHour: count });
      await persistBio(snap);
      const nextMood = inferMood(snap);
      setMood(nextMood);
      setAvatarState('reacting');
      setInboundScript(buildReactionLine({ ...current, completed: true }, nextMood));
      await scheduleFollowUpFast({ ...current, completed: true }, buildFollowUpScript(current));
      setTimeout(() => setAvatarState('idle'), 700);
    }
  }

  async function handleVoiceParsed(items: ParsedTaskDraft[], raw?: string) {
    if (raw) {
      const snap = moodFromTranscript(raw);
      await persistBio(snap);
      const nextMood = inferMood(snap);
      setMood(nextMood);
      if (snap.signals.includes('rapid_speech')) {
        setInboundScript(buildStressAck(raw));
      }
    }
    const created = await createFromDrafts(items);
    setAvatarState('reacting');
    if (!inboundScript) {
      setInboundScript(
        created.length === 1
          ? `Got it—I routed that into ${created[0].category}.`
          : `Routed ${created.length} thoughts into your buckets.`
      );
    }
  }

  return (
    <PhoneShell>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
          <Text style={styles.headerSub}>
            Companion · mood {mood} · zero-scroll board
          </Text>
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
            onHydration={async () => {
              const s = await bumpSync('hydration');
              setSync(s);
              setInboundScript(buildCoHabitLine('hydration'));
            }}
            onMovement={async () => {
              const s = await bumpSync('movement');
              setSync(s);
              setInboundScript(buildCoHabitLine('movement'));
            }}
          />
        </View>

        <View style={styles.board}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.accent} />
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
            CATEGORIES.map((cat) => (
              <CategoryQuadrant
                key={cat}
                category={cat}
                accent={categoryAccent[cat]}
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
          onParsed={(items) => handleVoiceParsed(items)}
          onOpenChange={(open) => setListening(open)}
          onTranscriptMood={(text) => {
            const snap = moodFromTranscript(text);
            void persistBio(snap);
            setMood(inferMood(snap));
          }}
        />

        <HypeInterstitial task={hypeTask} onDismiss={() => setHypeTask(null)} />
        <DecompressionRoom
          visible={decompressOpen}
          onClose={() => setDecompressOpen(false)}
          onExtract={async (items) => {
            await createFromDrafts(items);
            setInboundScript('Parked. Sleep—tomorrow’s board is ready.');
          }}
        />

        <BottomDock active="home" />
      </View>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.white },
  header: {
    backgroundColor: palette.accent,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerDate: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.4,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  presence: { paddingVertical: 4, alignItems: 'center', gap: 2 },
  board: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 6,
    overflow: 'hidden',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  error: { color: palette.danger, textAlign: 'center', paddingHorizontal: 16 },
  retry: { color: palette.accentDark, fontWeight: '700' },
});
