import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AmbientAvatar } from '@/components/AmbientAvatar';
import { CategoryQuadrant } from '@/components/CategoryQuadrant';
import { PhoneShell } from '@/components/PhoneShell';
import { VoiceCapture } from '@/components/VoiceCapture';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { categoryAccent, palette } from '@/constants/Colors';
import {
  inferMood,
  pickRitualForNow,
  shouldDeliverRitual,
  snapshotFromSignals,
} from '@/lib/companion/engine';
import { buildReactionLine, buildRitualScript } from '@/lib/companion/scripts';
import type { CompanionVisualState } from '@/lib/companion/types';
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

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await Promise.race([
        loadReminders(),
        new Promise<ReminderTask[]>((_, reject) =>
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

  useEffect(() => {
    setAvatarState(listening ? 'listening' : inboundScript ? 'speaking' : 'idle');
  }, [listening, inboundScript]);

  // Proactive morning / evening ritual (once per day each)
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const ritual = pickRitualForNow();
      if (!ritual) return;
      const ok = await shouldDeliverRitual(ritual);
      if (!ok || cancelled) return;
      const mood = inferMood(snapshotFromSignals({ hour: new Date().getHours() }));
      const script = buildRitualScript(ritual, reminders, mood);
      if (!cancelled) setInboundScript(script);
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, reminders]);

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

  async function handleToggle(id: string, completed: boolean) {
    const current = reminders.find((r) => r.id === id);
    if (!current) return;
    const list = await upsertReminder({ ...current, completed });
    setReminders(list);
    if (completed) {
      setAvatarState('reacting');
      setInboundScript(buildReactionLine({ ...current, completed: true }));
      setTimeout(() => setAvatarState('idle'), 700);
    }
  }

  async function handleVoiceParsed(items: ParsedTaskDraft[]) {
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
    setAvatarState('reacting');
    setInboundScript(
      created.length === 1
        ? `Got it—I routed that into ${created[0].category}.`
        : `Routed ${created.length} thoughts into your buckets. Nice capture.`
    );
  }

  return (
    <PhoneShell>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
          <Text style={styles.headerSub}>Companion · zero-scroll executive board</Text>
        </View>

        <View style={styles.presence}>
          <AmbientAvatar
            state={avatarState}
            onPress={() => {
              const ritual = pickRitualForNow() ?? 'morning';
              const mood = inferMood(snapshotFromSignals({ hour: new Date().getHours() }));
              setInboundScript(buildRitualScript(ritual, reminders, mood));
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
          onParsed={handleVoiceParsed}
          onOpenChange={(open) => setListening(open)}
        />

        <View style={styles.bottomNav}>
          <View style={styles.navSide}>
            <Text style={[styles.navIcon, styles.navActive]}>⌂</Text>
            <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
          </View>
          <Link href="/add-reminder" asChild>
            <Pressable style={styles.fab} accessibilityLabel="Add reminder manually">
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
  root: { flex: 1, backgroundColor: palette.white },
  header: {
    backgroundColor: palette.accent,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerDate: {
    fontSize: 24,
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
  presence: {
    paddingVertical: 6,
    alignItems: 'center',
  },
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
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  navSide: { width: 72, alignItems: 'center', gap: 2, paddingBottom: 4 },
  navIcon: { fontSize: 18, color: palette.muted },
  navLabel: { fontSize: 11, fontWeight: '600', color: palette.muted },
  navActive: { color: palette.accent },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  fabPlus: { color: palette.white, fontSize: 30, marginTop: -2 },
});
