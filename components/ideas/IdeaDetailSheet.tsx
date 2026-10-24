import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import {
  IDEA_CATEGORY_META,
  IDEA_KIND_LABEL,
  IDEA_STATUS_LABEL,
  type IdeaNote,
  type IdeaStatus,
} from '@/lib/ideas/types';

type Props = {
  idea: IdeaNote | null;
  onClose: () => void;
  onStatus: (status: IdeaStatus) => void;
  onConvertReminder: () => void;
  onLinkManifest: () => void;
  onDelete: () => void;
  onArchive: () => void;
};

export function IdeaDetailSheet({
  idea,
  onClose,
  onStatus,
  onConvertReminder,
  onLinkManifest,
  onDelete,
  onArchive,
}: Props) {
  if (!idea) return null;
  const meta = IDEA_CATEGORY_META[idea.category];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.back}>← Close</Text>
          </Pressable>
          <Text style={[styles.badge, { color: meta.accent }]}>
            {meta.label} · {IDEA_KIND_LABEL[idea.kind]}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.meta}>
            {IDEA_STATUS_LABEL[idea.status]} · {new Date(idea.createdAt).toLocaleString()} ·{' '}
            {idea.priority} priority
          </Text>

          <Pressable
            style={styles.wave}
            onPress={() => Speech.speak(idea.transcript, { rate: 0.95 })}
          >
            <Text style={styles.waveTitle}>▶ Play voice / transcript</Text>
            <Text style={styles.waveSub}>
              {Math.floor(idea.durationSec / 60)}:
              {String(idea.durationSec % 60).padStart(2, '0')} · 1x (TTS preview on web)
            </Text>
          </Pressable>

          <Text style={styles.section}>AI Summary</Text>
          <Text style={styles.p}>{idea.summary}</Text>

          <Text style={styles.section}>Key Points</Text>
          {idea.bullets.map((b, i) => (
            <Text key={i} style={styles.bullet}>
              · {b}
            </Text>
          ))}

          <Text style={styles.section}>Suggested Actions</Text>
          {idea.actions.map((a, i) => (
            <Text key={i} style={styles.bullet}>
              · {a}
            </Text>
          ))}

          {idea.contentHook ? (
            <>
              <Text style={styles.section}>Suggested Hook</Text>
              <Text style={styles.p}>{idea.contentHook}</Text>
              {idea.contentFormats?.length ? (
                <Text style={styles.muted}>Formats: {idea.contentFormats.join(' · ')}</Text>
              ) : null}
              {idea.platforms?.length ? (
                <Text style={styles.muted}>Platforms: {idea.platforms.join(', ')}</Text>
              ) : null}
            </>
          ) : null}

          {idea.tradeSafeguard ? (
            <View style={styles.warn}>
              <Text style={styles.warnTitle}>Trade Research Safeguard</Text>
              <Text style={styles.p}>
                This stays a research card — fill thesis, stop, target, and size before any
                execution.
              </Text>
            </View>
          ) : null}

          {idea.companionLine ? (
            <>
              <Text style={styles.section}>Companion</Text>
              <Text style={styles.companion}>{idea.companionLine}</Text>
            </>
          ) : null}

          <Text style={styles.section}>Tags</Text>
          <Text style={styles.muted}>{idea.tags.map((t) => `#${t}`).join('  ')}</Text>

          <Text style={styles.section}>Transcript</Text>
          <Text style={styles.transcript}>{idea.transcript}</Text>

          <View style={styles.statusRow}>
            {(['exploring', 'planned', 'executing', 'completed'] as IdeaStatus[]).map((s) => (
              <Pressable key={s} style={styles.statusChip} onPress={() => onStatus(s)}>
                <Text style={styles.statusText}>{IDEA_STATUS_LABEL[s]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={onConvertReminder}>
            <Text style={styles.primaryText}>Convert to reminder</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onLinkManifest}>
            <Text style={styles.secondaryText}>Add to manifestation</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable style={styles.ghost} onPress={onArchive}>
              <Text style={styles.ghostText}>Archive</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={onDelete}>
              <Text style={styles.dangerText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B12' },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  back: { color: '#5EEAD4', fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '800' },
  body: { padding: 16, paddingBottom: 24, gap: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#F8FAFC', marginTop: 4 },
  meta: { fontSize: 12, color: 'rgba(248,250,252,0.55)', marginBottom: 8 },
  wave: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  waveTitle: { color: '#F8FAFC', fontWeight: '800' },
  waveSub: { color: 'rgba(248,250,252,0.55)', fontSize: 12, marginTop: 2 },
  section: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '900',
    color: '#5EEAD4',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  p: { color: 'rgba(248,250,252,0.88)', fontSize: 14, lineHeight: 20 },
  bullet: { color: 'rgba(248,250,252,0.8)', fontSize: 13, lineHeight: 19 },
  muted: { color: 'rgba(148,163,184,0.95)', fontSize: 12 },
  companion: {
    color: '#FDE68A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  transcript: {
    color: 'rgba(248,250,252,0.65)',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  warn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  warnTitle: { color: '#F59E0B', fontWeight: '900', marginBottom: 4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },
  actions: {
    padding: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primary: {
    backgroundColor: '#0EA5A8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#042F2E', fontWeight: '900' },
  secondary: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryText: { color: '#F8FAFC', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  ghost: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ghostText: { color: '#CBD5E1', fontWeight: '700' },
  danger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  dangerText: { color: '#FCA5A5', fontWeight: '800' },
});
