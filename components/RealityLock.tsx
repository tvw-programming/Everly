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
import { playPillarDualStem, stopManifestAudio } from '@/lib/manifestation/audio';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  onDone: () => void;
};

export function RealityLock({ pillar, onDone }: Props) {
  const [second, setSecond] = useState(0);

  useEffect(() => {
    if (!pillar) return;
    setSecond(0);
    void playPillarDualStem(pillar, { loop: true });

    const tick = setInterval(() => setSecond((s) => s + 1), 1000);
    return () => {
      clearInterval(tick);
      void stopManifestAudio();
      Speech.stop();
    };
  }, [pillar]);

  useEffect(() => {
    if (!pillar) return;
    if (second === 50) {
      Speech.speak('It is already yours. Now open your eyes and execute.', {
        rate: 0.9,
        pitch: 1.05,
      });
    }
    if (second >= 60) {
      void (async () => {
        if (Platform.OS !== 'web') {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            // optional
          }
        }
        await stopManifestAudio();
        onDone();
      })();
    }
  }, [second, pillar, onDone]);

  if (!pillar) return null;

  const source = pillar.customStillUri
    ? { uri: pillar.customStillUri }
    : pillar.stillAsset;

  return (
    <Modal visible animationType="fade" onRequestClose={onDone}>
      <ImageBackground source={source} style={styles.fill} imageStyle={{ opacity: 0.45 }}>
        <View style={styles.dim}>
          <Text style={[styles.kicker, { color: pillar.accent }]}>60-Second Reality Lock</Text>
          <Text style={styles.label}>{pillar.label}</Text>
          <Text style={styles.identity}>{pillar.identity}</Text>
          <Text style={styles.timer}>{Math.max(0, 60 - second)}s</Text>
          <Pressable
            style={styles.skip}
            onPress={async () => {
              Speech.stop();
              await stopManifestAudio();
              onDone();
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  dim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 28,
    justifyContent: 'center',
    gap: 14,
  },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  label: { fontSize: 16, color: palette.white, fontWeight: '700' },
  identity: { fontSize: 22, lineHeight: 30, color: palette.white, fontWeight: '700' },
  timer: { marginTop: 20, fontSize: 48, fontWeight: '200', color: palette.white },
  skip: {
    alignSelf: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: palette.white, fontWeight: '700' },
});
