import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneShell } from '@/components/PhoneShell';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { PillarCard } from '@/components/manifestation/PillarCard';
import { RealityLock } from '@/components/manifestation/RealityLock';
import { VoiceEchoSheet } from '@/components/manifestation/VoiceEchoSheet';
import { palette } from '@/constants/Colors';
import { playPillarAffirmation, stopManifestAudio } from '@/lib/manifestation/audio';
import {
  loadDeck,
  setIdentityCode,
  setVoiceMix,
  updatePillar,
} from '@/lib/manifestation/storage';
import type { ManifestDeckState, ManifestPillar, ManifestPillarId } from '@/lib/manifestation/types';

export default function ManifestationScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ pillar?: string }>();
  const [deck, setDeck] = useState<ManifestDeckState | null>(null);
  const [activeId, setActiveId] = useState<ManifestPillarId | null>(null);
  const [lockPillar, setLockPillar] = useState<ManifestPillar | null>(null);
  const [echoPillar, setEchoPillar] = useState<ManifestPillar | null>(null);
  const [visionOpen, setVisionOpen] = useState(false);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [inbound, setInbound] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState(false);

  const refresh = useCallback(async () => {
    const d = await loadDeck();
    setDeck(d);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Tab screens stay mounted, so stop the deck when it loses focus rather than
  // on unmount — otherwise the affirmation keeps playing over another tab.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveId(null);
        void stopManifestAudio();
      };
    }, [])
  );

  useEffect(() => {
    if (!deck) return;
    const p = params.pillar as ManifestPillarId | undefined;
    if (p && deck.pillars[p]) {
      setActiveId(p);
      setInbound(deck.pillars[p].companionHook);
    } else if (!inbound) {
      setInbound(
        `Ready for your manifestation sync? I've queued your ${deck.pillars.economical.label} reel.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- welcome once when deck loads
  }, [params.pillar, deck?.identityCode]);

  const ambient = useMemo(() => {
    if (!deck || !activeId) return '#070B12';
    return deck.pillars[activeId].accent + '22';
  }, [deck, activeId]);

  if (!deck) {
    return (
      <PhoneShell>
        <View style={styles.root} />
      </PhoneShell>
    );
  }

  async function playPillar(id: ManifestPillarId) {
    const current = deck;
    if (!current) return;
    const pillar = current.pillars[id];
    setActiveId(id);
    setInbound(pillar.companionHook);
    await playPillarAffirmation(pillar, current.voiceMix);
  }

  const voicePct = Math.round(deck.voiceMix * 100);
  const tonePct = 100 - voicePct;
  const activeHz = activeId ? deck.pillars[activeId].frequencyHz : 432;

  return (
    <PhoneShell>
      <View style={[styles.root, { backgroundColor: ambient }]}>
        <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Today&apos;s Identity Code</Text>
            {editingCode ? (
              <TextInput
                style={styles.codeInput}
                value={deck.identityCode}
                onChangeText={(t) => setDeck({ ...deck, identityCode: t })}
                onBlur={async () => {
                  const next = await setIdentityCode(deck.identityCode);
                  setDeck(next);
                  setEditingCode(false);
                }}
                autoFocus
                multiline
              />
            ) : (
              <Pressable onPress={() => setEditingCode(true)}>
                <Text style={styles.code} numberOfLines={2}>
                  {deck.identityCode}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.aura}>
            <Text style={styles.auraLabel}>Aura</Text>
            <Text style={styles.auraScore}>{deck.auraScore}%</Text>
          </View>
        </View>

        <View style={styles.matrix}>
          <View style={styles.row}>
            <PillarCard
              pillar={deck.pillars.personal}
              active={activeId === 'personal'}
              onPress={() => void playPillar('personal')}
              onLongPress={() => setLockPillar(deck.pillars.personal)}
            />
            <PillarCard
              pillar={deck.pillars.social}
              active={activeId === 'social'}
              onPress={() => void playPillar('social')}
              onLongPress={() => setLockPillar(deck.pillars.social)}
            />
          </View>
          <View style={styles.row}>
            <PillarCard
              pillar={deck.pillars.economical}
              active={activeId === 'economical'}
              onPress={() => void playPillar('economical')}
              onLongPress={() => setLockPillar(deck.pillars.economical)}
            />
            <PillarCard
              pillar={deck.pillars.professional}
              active={activeId === 'professional'}
              onPress={() => void playPillar('professional')}
              onLongPress={() => setLockPillar(deck.pillars.professional)}
            />
          </View>
        </View>

        <Pressable
          style={styles.holdBar}
          onLongPress={() => {
            const id = activeId ?? 'economical';
            setLockPillar(deck.pillars[id]);
          }}
          onPress={() => {
            const id = activeId ?? 'personal';
            void playPillar(id);
          }}
        >
          <Text style={styles.holdTitle}>◉ Tap & Hold: Identity Shift</Text>
          <Text style={styles.holdSub}>
            Ambient {activeHz} Hz · {voicePct}% voice / {tonePct}% tone · Hold = 60s Reality Lock
          </Text>
        </Pressable>

        <View style={styles.mixRow}>
          <Text style={styles.mixLabel}>Voice mix</Text>
          {[0.2, 0.3, 0.5].map((m) => (
            <Pressable
              key={m}
              style={[styles.mixChip, deck.voiceMix === m && styles.mixChipOn]}
              onPress={async () => {
                const next = await setVoiceMix(m);
                setDeck(next);
              }}
            >
              <Text style={[styles.mixChipText, deck.voiceMix === m && styles.mixChipTextOn]}>
                {Math.round(m * 100)}%
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.mixChip}
            onPress={() => {
              void stopManifestAudio();
              setActiveId(null);
            }}
          >
            <Text style={styles.mixChipText}>Silence</Text>
          </Pressable>
        </View>

        <View style={styles.tools}>
          <Pressable
            style={styles.toolBtn}
            onPress={() => setEchoPillar(deck.pillars[activeId ?? 'personal'])}
          >
            <Text style={styles.toolText}>Voice Echo</Text>
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            onPress={() => {
              setVisionPrompt(deck.pillars[activeId ?? 'professional'].visionPrompt ?? '');
              setVisionOpen(true);
            }}
          >
            <Text style={styles.toolText}>Vision Synth</Text>
          </Pressable>
        </View>

        <WarmInboundBubble
          script={inbound}
          onSkip={() => setInbound(null)}
          onFinished={() => setInbound(null)}
        />


        <RealityLock
          pillar={lockPillar}
          voiceMix={deck.voiceMix}
          onSkip={() => setLockPillar(null)}
          onComplete={() => {
            setLockPillar(null);
            router.replace('/');
          }}
        />

        <VoiceEchoSheet
          pillar={echoPillar}
          visible={Boolean(echoPillar)}
          onClose={() => setEchoPillar(null)}
          onSaved={async (uri) => {
            if (!echoPillar) return;
            const next = await updatePillar(echoPillar.id, { voiceUri: uri });
            setDeck(next);
            setInbound(`Voice Echo locked for ${echoPillar.label}. Your subconscious will hear you.`);
          }}
        />

        {visionOpen ? (
          <View style={[styles.visionSheet, { paddingBottom: 16 + insets.bottom }]}>
            <Text style={styles.visionTitle}>Vision Synthesizer</Text>
            <Text style={styles.visionHint}>
              Describe the scene. v1 stores the prompt and pins it to the active pillar. Connect
              EXPO_PUBLIC_VISION_API_URL for generative fill.
            </Text>
            <TextInput
              style={styles.visionInput}
              multiline
              value={visionPrompt}
              onChangeText={setVisionPrompt}
              placeholder="Me on an SF terrace with an approved acquisition term sheet…"
              placeholderTextColor={theme.muted}
            />
            <View style={styles.tools}>
              <Pressable style={styles.toolBtn} onPress={() => setVisionOpen(false)}>
                <Text style={styles.toolText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.toolBtn, { backgroundColor: theme.accent }]}
                onPress={async () => {
                  const id = activeId ?? 'professional';
                  const next = await updatePillar(id, { visionPrompt });
                  setDeck(next);
                  setInbound(
                    'Vision locked into the pillar. We will render when the synth API is connected.'
                  );
                  setVisionOpen(false);
                }}
              >
                <Text style={[styles.toolText, { color: theme.onAccent }]}>Save Prompt</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </PhoneShell>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: t.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  code: { fontSize: 15, fontWeight: '800', color: t.ink, marginTop: 2 },
  codeInput: {
    fontSize: 15,
    fontWeight: '700',
    color: t.ink,
    marginTop: 2,
    padding: 0,
  },
  aura: {
    backgroundColor: t.inverseSurface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  auraLabel: { color: t.onInverseMuted, fontSize: 9, fontWeight: '700' },
  auraScore: { color: t.onInverseSurface, fontSize: 16, fontWeight: '900' },
  matrix: { flex: 1, minHeight: 0, paddingHorizontal: 10, gap: 8, paddingBottom: 4 },
  row: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 0 },
  holdBar: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: t.inverseSurface,
  },
  holdTitle: { color: t.onInverseSurface, fontWeight: '800', fontSize: 14 },
  holdSub: { color: t.onInverseMuted, fontSize: 11, marginTop: 3 },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  mixLabel: { fontSize: 11, fontWeight: '700', color: t.muted, marginRight: 2 },
  mixChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: t.soft,
    borderWidth: 1,
    borderColor: t.border,
  },
  mixChipOn: { backgroundColor: t.inverseSurface, borderColor: t.inverseSurface },
  mixChipText: { fontSize: 11, fontWeight: '700', color: t.ink },
  mixChipTextOn: { color: t.onInverseSurface },
  tools: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 6 },
  toolBtn: {
    flex: 1,
    backgroundColor: t.soft,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.border,
  },
  toolText: { fontWeight: '700', color: t.ink, fontSize: 12 },
  visionSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: t.surfaces.base,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderColor: t.border,
  },
  visionTitle: { fontWeight: '800', fontSize: 16, color: t.ink },
  visionHint: { fontSize: 12, color: t.muted, lineHeight: 17 },
  visionInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 12,
    padding: 10,
    color: t.ink,
  },
});
