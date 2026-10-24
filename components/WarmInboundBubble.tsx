import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { palette } from '@/constants/Colors';
import { truncateScript } from '@/lib/companion/scripts';

type Props = {
  script: string | null;
  onSkip: () => void;
  onFinished: () => void;
};

export function WarmInboundBubble({ script, onSkip, onFinished }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!script) {
      setVisible(false);
      Speech.stop();
      return;
    }
    const line = truncateScript(script, 12);
    setVisible(true);
    Speech.stop();
    Speech.speak(line, {
      rate: 0.95,
      pitch: 1.05,
      onDone: () => {
        setVisible(false);
        onFinished();
      },
      onStopped: () => {
        setVisible(false);
      },
      onError: () => {
        setVisible(false);
        onFinished();
      },
    });
    return () => {
      Speech.stop();
    };
  }, [script, onFinished]);

  if (!visible || !script) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bubble}>
        <Text style={styles.label}>Companion</Text>
        <Text style={styles.body} numberOfLines={4}>
          {truncateScript(script, 12)}
        </Text>
        <Pressable
          style={styles.skip}
          onPress={() => {
            Speech.stop();
            setVisible(false);
            onSkip();
          }}
          accessibilityLabel="Skip voice note"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 96,
    zIndex: 30,
  },
  bubble: {
    backgroundColor: palette.ink,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: { color: palette.white, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: palette.white, fontWeight: '700', fontSize: 12 },
});
