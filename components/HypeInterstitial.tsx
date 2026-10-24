import { useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { palette } from '@/constants/Colors';
import { buildHypeScript, truncateScript } from '@/lib/companion/scripts';
import type { ReminderTask } from '@/lib/types';

type Props = {
  task: ReminderTask | null;
  onDismiss: () => void;
};

export function HypeInterstitial({ task, onDismiss }: Props) {
  useEffect(() => {
    if (!task) return;
    const line = truncateScript(buildHypeScript(task), 12);
    Speech.stop();
    Speech.speak(line, { rate: 0.92, pitch: 1.02 });

    if (Platform.OS !== 'web') {
      void (async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await new Promise((r) => setTimeout(r, 420));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await new Promise((r) => setTimeout(r, 420));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // haptics optional
        }
      })();
    }

    const t = setTimeout(() => {
      Speech.stop();
      onDismiss();
    }, 12_000);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [task, onDismiss]);

  if (!task) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Focus anchor · 30s</Text>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.body}>{truncateScript(buildHypeScript(task), 12)}</Text>
          <Pressable
            style={styles.skip}
            onPress={() => {
              Speech.stop();
              onDismiss();
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,20,22,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 22,
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: { fontSize: 20, fontWeight: '800', color: palette.ink },
  body: { fontSize: 15, lineHeight: 22, color: palette.muted },
  skip: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.soft,
  },
  skipText: { fontWeight: '700', color: palette.ink },
});
