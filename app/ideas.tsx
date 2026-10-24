import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { PhoneShell } from '@/components/PhoneShell';
import { IdeaCaptureSheet } from '@/components/ideas/IdeaCaptureSheet';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { IdeaDetailSheet } from '@/components/ideas/IdeaDetailSheet';
import { IdeaFilters } from '@/components/ideas/IdeaFilters';
import { IdeaMicFab, type MicState } from '@/components/ideas/IdeaMicFab';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { organizeTranscript, weekInsight } from '@/lib/ideas/organize';
import {
  deleteIdea,
  loadIdeas,
  linkReminder,
  setIdeaStatus,
  updateIdea,
  upsertIdeas,
} from '@/lib/ideas/storage';
import type { IdeaFilter, IdeaNote, IdeaStatus } from '@/lib/ideas/types';
import { createId } from '@/lib/schedule';
import { scheduleReminderNotification } from '@/lib/notifications';
import { upsertReminder } from '@/lib/storage';
import type { ReminderTask, TaskCategory } from '@/lib/types';
import { updatePillar } from '@/lib/manifestation/storage';

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<IdeaNote[]>([]);
  const [filter, setFilter] = useState<IdeaFilter>('all');
  const [selected, setSelected] = useState<IdeaNote | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [micState, setMicState] = useState<MicState>('idle');
  const [busy, setBusy] = useState(false);
  const [inbound, setInbound] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIdeas(await loadIdeas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const visible = useMemo(() => {
    const base =
      filter === 'all' ? ideas : ideas.filter((i) => i.category === filter && i.status !== 'archived');
    return base.filter((i) => (filter === 'all' ? i.status !== 'archived' : true));
  }, [ideas, filter]);

  const insight = useMemo(() => weekInsight(ideas), [ideas]);

  async function handleOrganize(transcript: string) {
    setBusy(true);
    setMicState('processing');
    try {
      const organized = organizeTranscript(transcript);
      const next = await upsertIdeas(organized);
      setIdeas(next);
      setMicState('saved');
      const line =
        organized.length === 1
          ? organized[0].companionLine ?? 'Idea organized.'
          : `Split into ${organized.length} ideas across your vault.`;
      setInbound(line);
      setCaptureOpen(false);
      setTimeout(() => setMicState('idle'), 1600);
    } finally {
      setBusy(false);
    }
  }

  async function convertToReminder(idea: IdeaNote) {
    const category = idea.category as TaskCategory;
    const rem: ReminderTask = {
      id: createId(),
      title: idea.title,
      notes: idea.summary,
      category,
      subCategory:
        category === 'personal'
          ? 'manifestation'
          : category === 'social'
            ? 'idea_capture'
            : 'dev_sprint',
      priority: idea.priority === 'high' ? 'p1' : idea.priority === 'medium' ? 'p2' : 'p3',
      schedule: { time: '09:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
      dueAt: idea.suggestedReminderAt ?? null,
      contextTrigger: idea.kind === 'trade_research' ? 'trade_research_only' : undefined,
      sound: { mode: 'mp3', assetUri: 'chime', assetName: 'Chime' },
      enabled: true,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    rem.notificationId = await scheduleReminderNotification(rem);
    await upsertReminder(rem);
    const next = await linkReminder(idea.id, rem.id);
    setIdeas(next);
    setSelected(null);
    setInbound(`Routed “${idea.title}” into ${category} reminders.`);
  }

  async function linkManifest(idea: IdeaNote) {
    const pillar = idea.linkedManifestPillar ?? 'personal';
    await updatePillar(pillar, {
      visionPrompt: `${idea.title}. ${idea.summary}`,
    });
    const next = await updateIdea(idea.id, { status: 'planned' });
    setIdeas(next);
    setSelected(null);
    setInbound(`Pinned to ${pillar} manifestation pillar.`);
    router.push('/manifestation');
  }

  return (
    <PhoneShell>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Ideas · Voice-first Second Brain</Text>
          <Text style={styles.insight}>{insight}</Text>
        </View>

        <IdeaFilters value={filter} onChange={setFilter} />

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          style={styles.listFlex}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No ideas in this filter</Text>
              <Text style={styles.emptyBody}>Tap the mic — speak once, I will organize it.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <IdeaCard
              idea={item}
              onPress={() => setSelected(item)}
              onPlay={() => Speech.speak(item.transcript, { rate: 0.95 })}
            />
          )}
        />

        <IdeaMicFab
          state={micState}
          onPress={() => {
            setMicState('listening');
            setCaptureOpen(true);
          }}
        />

        <IdeaCaptureSheet
          visible={captureOpen}
          busy={busy}
          onClose={() => {
            setCaptureOpen(false);
            setMicState('idle');
          }}
          onSubmit={handleOrganize}
        />

        <IdeaDetailSheet
          idea={selected}
          onClose={() => setSelected(null)}
          onStatus={async (status: IdeaStatus) => {
            if (!selected) return;
            const next = await setIdeaStatus(selected.id, status);
            setIdeas(next);
            setSelected(next.find((i) => i.id === selected.id) ?? null);
          }}
          onConvertReminder={() => selected && void convertToReminder(selected)}
          onLinkManifest={() => selected && void linkManifest(selected)}
          onArchive={async () => {
            if (!selected) return;
            const next = await setIdeaStatus(selected.id, 'archived');
            setIdeas(next);
            setSelected(null);
          }}
          onDelete={async () => {
            if (!selected) return;
            const next = await deleteIdea(selected.id);
            setIdeas(next);
            setSelected(null);
          }}
        />

        <WarmInboundBubble
          script={inbound}
          onSkip={() => setInbound(null)}
          onFinished={() => setInbound(null)}
        />

        <View style={styles.bottomNav}>
          <Link href="/" asChild>
            <Pressable style={styles.navSide}>
              <Text style={styles.navIcon}>⌂</Text>
              <Text style={styles.navLabel}>Home</Text>
            </Pressable>
          </Link>
          <View style={styles.navSide}>
            <Text style={[styles.navIcon, styles.navActive]}>💡</Text>
            <Text style={[styles.navLabel, styles.navActive]}>Ideas</Text>
          </View>
          <Link href="/manifestation" asChild>
            <Pressable style={styles.navSide}>
              <Text style={styles.navIcon}>✦</Text>
              <Text style={styles.navLabel}>Manifest</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B12' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 4 },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2DD4BF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insight: { fontSize: 14, fontWeight: '600', color: '#E2E8F0', lineHeight: 20 },
  listFlex: { flex: 1, minHeight: 0 },
  list: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 100, gap: 10 },
  empty: { padding: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { color: '#F8FAFC', fontWeight: '800' },
  emptyBody: { color: '#94A3B8', textAlign: 'center', fontSize: 13 },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7,11,18,0.92)',
  },
  navSide: { width: 80, alignItems: 'center', gap: 2, paddingBottom: 4 },
  navIcon: { fontSize: 18, color: '#64748B' },
  navLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  navActive: { color: '#2DD4BF' },
});
