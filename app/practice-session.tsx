import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoldConfirmButton } from '@/components/practice/HoldConfirmButton';
import { emitPracticeEvent } from '@/lib/practice/events';
import {
  confirmManifestRep,
  getDueManifestLines,
  markDidntLand,
} from '@/lib/practice/rotation';
import { markSessionCompleteToday } from '@/lib/practice/storage';
import type { PracticeStatement } from '@/lib/practice/types';
import { useTheme } from '@/lib/theme/ThemeContext';

type Phase = 'line' | 'silence' | 'done';

export default function PracticeSessionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState<PracticeStatement[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('line');
  const playerRef = useRef<AudioPlayer | null>(null);

  const load = useCallback(async () => {
    const due = await getDueManifestLines(3);
    setLines(due);
    setIndex(0);
    setPhase(due.length ? 'line' : 'done');
  }, []);

  useEffect(() => {
    void load();
    return () => {
      try {
        playerRef.current?.remove();
      } catch {
        // ignore
      }
    };
  }, [load]);

  const current = lines[index];

  async function playVoice() {
    if (!current?.audioUri) return;
    try {
      try {
        playerRef.current?.remove();
      } catch {
        // ignore
      }
      const player = createAudioPlayer({ uri: current.audioUri });
      playerRef.current = player;
      player.play();
    } catch {
      // optional feature
    }
  }

  async function onSaid() {
    if (!current) return;
    await confirmManifestRep(current.id);
    setPhase('silence');
    setTimeout(() => {
      if (index + 1 >= lines.length) {
        void finish();
      } else {
        setIndex((i) => i + 1);
        setPhase('line');
      }
    }, 4000);
  }

  async function onDidntLand() {
    if (!current) return;
    await markDidntLand(current.id);
    if (index + 1 >= lines.length) {
      await finish();
    } else {
      setIndex((i) => i + 1);
      setPhase('line');
    }
  }

  async function finish() {
    await markSessionCompleteToday();
    emitPracticeEvent('session_complete');
    setPhase('done');
    setTimeout(() => router.replace('/practice'), 600);
  }

  if (phase === 'silence') {
    return <View style={[styles.silence, { paddingTop: insets.top }]} />;
  }

  if (phase === 'done' || !current) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: theme.canvas, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={[styles.kicker, { color: theme.accent }]}>Evening practice</Text>
        <Text style={[styles.body, { color: theme.ink }]}>
          {lines.length === 0 ? 'Nothing due tonight.' : 'Day marked complete.'}
        </Text>
        <Pressable onPress={() => router.replace('/practice')}>
          <Text style={{ color: theme.accent, fontWeight: '800' }}>Back to Practice</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Text style={[styles.kicker, { color: theme.accent }]}>
        {current.code} · {index + 1}/{lines.length}
      </Text>
      <Text
        style={[
          styles.line,
          {
            color: theme.ink,
            fontFamily: undefined,
            lineHeight: current.language === 'mr' ? 44 : 36,
          },
        ]}
      >
        {current.body}
      </Text>
      <Text style={[styles.hint, { color: theme.muted }]}>
        Say it aloud. Then hold. Silence follows.
      </Text>

      <HoldConfirmButton
        label="Said it"
        color={theme.accent}
        onAccent={theme.onAccent}
        onConfirm={() => void onSaid()}
      />

      <View style={styles.row}>
        <Pressable onPress={() => void playVoice()} disabled={!current.audioUri}>
          <Text
            style={{
              color: current.audioUri ? theme.accent : theme.muted,
              fontWeight: '800',
            }}
          >
            Play my voice
          </Text>
        </Pressable>
        <Pressable onPress={() => void onDidntLand()}>
          <Text style={{ color: theme.danger, fontWeight: '800' }}>Didn&apos;t land</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 18 },
  silence: { flex: 1, backgroundColor: '#05080F' },
  kicker: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  line: { fontSize: 28, fontWeight: '800' },
  body: { fontSize: 20, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
