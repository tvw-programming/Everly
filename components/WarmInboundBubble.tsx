import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

import { palette } from '@/constants/Colors';
import type { CompanionLine } from '@/lib/companion/scripts';
import { truncateScript } from '@/lib/companion/scripts';

type Props = {
  /** A plain string is both shown and spoken; a CompanionLine speaks its romanisation. */
  script: CompanionLine | string | null;
  onSkip: () => void;
  onFinished: () => void;
};

export function WarmInboundBubble({ script, onSkip, onFinished }: Props) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const shown = typeof script === 'string' ? script : script?.text ?? null;
  const spoken = typeof script === 'string' ? script : script?.speech ?? null;

  const utterance = useRef(0);

  useEffect(() => {
    if (!spoken) {
      setVisible(false);
      Speech.stop();
      return;
    }

    // Callbacks from the utterance we are replacing arrive after this one
    // starts; ignore them, or the new bubble hides itself immediately.
    const era = ++utterance.current;
    const isCurrent = () => era === utterance.current;

    const line = truncateScript(spoken, 12);
    setVisible(true);
    Speech.stop();

    // The bubble is readable even where speech is unavailable, so it stays up
    // for its own minimum beat rather than depending on a TTS callback.
    const minimumBeat = setTimeout(() => {
      if (isCurrent()) {
        setVisible(false);
        onFinished();
      }
    }, 9000);

    const finish = () => {
      if (!isCurrent()) return;
      clearTimeout(minimumBeat);
      setVisible(false);
      onFinished();
    };

    try {
      Speech.speak(line, {
        rate: 0.95,
        pitch: 1.05,
        onDone: finish,
        onError: finish,
      });
    } catch {
      // no speech engine here; the bubble still shows
    }

    return () => {
      clearTimeout(minimumBeat);
      Speech.stop();
    };
  }, [spoken, onFinished]);

  if (!visible || !shown) return null;

  return (
    <View style={[styles.wrap, { top: 96 + insets.top }]} pointerEvents="box-none">
      <View style={styles.bubble}>
        <Text style={styles.label}>Companion</Text>
        <Text style={styles.body} numberOfLines={4}>
          {truncateScript(shown, 12)}
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

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 96,
    zIndex: 30,
  },
  bubble: {
    backgroundColor: t.inverseSurface,
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
    color: t.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  body: { color: t.onInverseSurface, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: t.onInverseSurface, fontWeight: '700', fontSize: 12 },
});
