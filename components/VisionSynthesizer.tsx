import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  onSave: (prompt: string) => Promise<void>;
  onClose: () => void;
};

/** Stub studio — stores prompt; real gen API plugs in later. */
export function VisionSynthesizer({ pillar, onSave, onClose }: Props) {
  const [prompt, setPrompt] = useState(pillar?.visionPrompt ?? '');

  if (!pillar) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Vision Synthesizer · {pillar.label}</Text>
          <Text style={styles.hint}>
            Describe the cinematic still. v1 saves the prompt and keeps the pillar canvas; image/video
            generation hooks in next.
          </Text>
          <TextInput
            style={styles.input}
            multiline
            value={prompt}
            onChangeText={setPrompt}
            placeholder='e.g. Me on a SF terrace with an approved acquisition term sheet, golden hour'
            placeholderTextColor={palette.muted}
            textAlignVertical="top"
          />
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              onPress={async () => {
                await onSave(prompt.trim());
                onClose();
              }}
            >
              <Text style={styles.primaryText}>Pin Vision</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink },
  hint: { fontSize: 12, color: palette.muted, lineHeight: 17 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: palette.ink,
    backgroundColor: palette.soft,
  },
  row: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '700', color: palette.ink },
  primary: {
    flex: 1.2,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { fontWeight: '700', color: palette.white },
});
