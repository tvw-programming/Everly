import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';

import { BottomDock } from '@/components/BottomDock';
import { PhoneShell } from '@/components/PhoneShell';
import { PillarTile } from '@/components/PillarTile';
import { RealityLock } from '@/components/RealityLock';
import { VisionSynthesizer } from '@/components/VisionSynthesizer';
import { VoiceEchoRecorder } from '@/components/VoiceEchoRecorder';
import { WarmInboundBubble } from '@/components/WarmInboundBubble';
import { palette } from '@/constants/Colors';
import { loadSyncScore } from '@/lib/companion/engine';
import { playPillarDualStem, stopManifestAudio } from '@/lib/manifestation/audio';
import { DEFAULT_IDENTITY_CODE } from '@/lib/manifestation/seed';
import {
  loadIdentityCode,
  loadPillars,
  saveIdentityCode,
  savePillarPatch,
} from '@/lib/manifestation/storage';
import type { ManifestPillar, ManifestPillarId } from '@/lib/manifestation/types';

export default function ManifestScreen() {
  const [pillars, setPillars] = useState<ManifestPillar[]>([]);
  const [identity, setIdentity] = useState(DEFAULT_IDENTITY_CODE);
  const [activeId, setActiveId] = useState<ManifestPillarId | null>(null);
  const [lockPillar, setLockPillar] = useState<ManifestPillar | null>(null);
  const [recordPillar, setRecordPillar] = useState<ManifestPillar | null>(null);
  const [visionPillar, setVisionPillar] = useState<ManifestPillar | null>(null);
  const [companionLine, setCompanionLine] = useState<string | null>(null);
  const [aura, setAura] = useState(88);

  const refresh = useCallback(async () => {
    const [p, id, sync] = await Promise.all([
      loadPillars(),
      loadIdentityCode(),
      loadSyncScore(),
    ]);
    setPillars(p);
    setIdentity(id);
    const total = sync.hydrationSyncs + sync.movementSyncs + sync.unlockTier * 3;
    setAura(Math.min(99, 72 + total));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        void stopManifestAudio();
        Speech.stop();
      };
    }, [refresh])
  );

  useEffect(() => {
    // Companion welcome once when landing on tab
    const economical = pillars.find((p) => p.id === 'economical');
    if (economical) {
      setCompanionLine(
        `Ready for your manifestation sync? I have queued your ${economical.label} reel.`
      );
    }
  }, [pillars.length]);

  const active = useMemo(
    () => pillars.find((p) => p.id === activeId) ?? null,
    [pillars, activeId]
  );

  async function playIdentityShift(pillar: ManifestPillar) {
    setActiveId(pillar.id);
    await playPillarDualStem(pillar);
    if (!pillar.voiceUri) {
      Speech.speak(pillar.voiceScript, { rate: 0.92, pitch: 1.02 });
    }
    setCompanionLine(pillar.companionHook);
  }

  return (
    <PhoneShell>
      <View
        style={[
          styles.root,
          active ? { backgroundColor: `${active.accent}14` } : null,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.kicker}>Today&apos;s Identity Code</Text>
            <Text style={styles.aura}>Aura {aura}%</Text>
          </View>
          <TextInput
            style={styles.identity}
            value={identity}
            onChangeText={setIdentity}
            onEndEditing={() => void saveIdentityCode(identity.trim() || DEFAULT_IDENTITY_CODE)}
            multiline
            accessibilityLabel="Today's identity code"
          />
        </View>

        <View style={styles.matrix}>
          <View style={styles.row}>
            {pillars.slice(0, 2).map((p) => (
              <PillarTile
                key={p.id}
                pillar={p}
                active={activeId === p.id}
                onPress={() => void playIdentityShift(p)}
                onLongPress={() => setLockPillar(p)}
              />
            ))}
          </View>
          <View style={styles.row}>
            {pillars.slice(2, 4).map((p) => (
              <PillarTile
                key={p.id}
                pillar={p}
                active={activeId === p.id}
                onPress={() => void playIdentityShift(p)}
                onLongPress={() => setLockPillar(p)}
              />
            ))}
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={styles.holdBtn}
            onPress={() => {
              const p = active ?? pillars[0];
              if (p) void playIdentityShift(p);
            }}
            onLongPress={() => {
              const p = active ?? pillars[0];
              if (p) setRecordPillar(p);
            }}
          >
            <Text style={styles.holdTitle}>◉ Identity Shift</Text>
            <Text style={styles.holdSub}>
              Tap play · Long-press record Voice Echo · Long-press tile = Reality Lock
            </Text>
          </Pressable>
          <View style={styles.miniRow}>
            <Pressable
              style={styles.mini}
              onPress={() => setVisionPillar(active ?? pillars[0] ?? null)}
            >
              <Text style={styles.miniText}>Vision Studio</Text>
            </Pressable>
            <Pressable
              style={styles.mini}
              onPress={() => {
                void stopManifestAudio();
                Speech.stop();
                setActiveId(null);
              }}
            >
              <Text style={styles.miniText}>Silence</Text>
            </Pressable>
          </View>
        </View>

        <WarmInboundBubble
          script={companionLine}
          onSkip={() => setCompanionLine(null)}
          onFinished={() => setCompanionLine(null)}
        />

        <BottomDock active="manifest" />

        <RealityLock pillar={lockPillar} onDone={() => setLockPillar(null)} />
        <VoiceEchoRecorder
          pillar={recordPillar}
          onClose={() => setRecordPillar(null)}
          onSaved={async (uri) => {
            if (!recordPillar) return;
            await savePillarPatch(recordPillar.id, { voiceUri: uri });
            await refresh();
          }}
        />
        <VisionSynthesizer
          pillar={visionPillar}
          onClose={() => setVisionPillar(null)}
          onSave={async (prompt) => {
            if (!visionPillar) return;
            await savePillarPatch(visionPillar.id, { visionPrompt: prompt });
            await refresh();
            setCompanionLine(`Vision pinned to ${visionPillar.label}. Generative fill comes next.`);
          }}
        />
      </View>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1214' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 6,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aura: { fontSize: 12, fontWeight: '800', color: '#FDE68A' },
  identity: {
    fontSize: 15,
    lineHeight: 21,
    color: palette.white,
    fontWeight: '600',
    padding: 0,
  },
  matrix: { flex: 1, minHeight: 0, paddingHorizontal: 12, gap: 8, paddingBottom: 6 },
  row: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 0 },
  controls: { paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  holdBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  holdTitle: { color: palette.white, fontWeight: '800', fontSize: 14 },
  holdSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 3 },
  miniRow: { flexDirection: 'row', gap: 8 },
  mini: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  miniText: { color: palette.white, fontWeight: '700', fontSize: 12 },
});
