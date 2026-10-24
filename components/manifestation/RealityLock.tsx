import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { palette } from '@/constants/Colors';
import { playRealityLockAudio, stopManifestAudio } from '@/lib/manifestation/audio';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  voiceMix: number;
  onComplete: () => void;
  onSkip: () => void;
};

const COMPANION_LINE = 'It is already yours. Now open your eyes and execute.';

export function RealityLock({ pillar, voiceMix, onComplete, onSkip }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [companionSaid, setCompanionSaid] = useState(false);

  useEffect(() => {
    if (!pillar) return;
    setSeconds(0);
    setCompanionSaid(false);
    let cleanupAudio: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      cleanupAudio = await playRealityLockAudio(pillar, voiceMix, () => {
        if (cancelled) return;
        setCompanionSaid(true);
        Speech.speak(COMPANION_LINE, { rate: 0.95, pitch: 1.05 });
      });
    })();

    const tick = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    const end = setTimeout(async () => {
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // optional
        }
      }
      await stopManifestAudio();
      onComplete();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(end);
      cleanupAudio?.();
      void stopManifestAudio();
      Speech.stop();
    };
  }, [pillar, voiceMix, onComplete]);

  if (!pillar) return null;

  return (
    <Modal visible animationType="fade" onRequestClose={onSkip}>
      <View style={styles.root}>
        <ImageBackground source={{ uri: pillar.stillUri }} style={styles.bg} imageStyle={{ opacity: 0.45 }}>
          <View style={styles.overlay}>
            <Text style={[styles.pillar, { color: pillar.accent }]}>{pillar.label}</Text>
            <Text style={styles.script}>{pillar.identityScript}</Text>
            <Text style={styles.timer}>{Math.min(60, seconds)}s / 60s</Text>
            {companionSaid ? <Text style={styles.companion}>{COMPANION_LINE}</Text> : null}
            <Pressable
              style={styles.skip}
              onPress={async () => {
                await stopManifestAudio();
                Speech.stop();
                onSkip();
              }}
            >
              <Text style={styles.skipText}>Skip → Execute</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 28,
    justifyContent: 'center',
    gap: 16,
  },
  pillar: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  script: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: palette.white,
  },
  timer: { color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 13 },
  companion: {
    marginTop: 8,
    color: palette.accent,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  skip: {
    marginTop: 20,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: palette.white, fontWeight: '800' },
});
