import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/Colors';
import { parseVoiceTranscript } from '@/lib/api';
import { buildVentValidation } from '@/lib/companion/scripts';
import type { ParsedTaskDraft } from '@/lib/parser';
import { CATEGORY_LABELS } from '@/lib/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onExtract: (items: ParsedTaskDraft[]) => Promise<void>;
};

export function DecompressionRoom({ visible, onClose, onExtract }: Props) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const [vent, setVent] = useState('');
  const [phase, setPhase] = useState<'vent' | 'validate' | 'preview'>('vent');
  const [validation, setValidation] = useState('');
  const [preview, setPreview] = useState<ParsedTaskDraft[]>([]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setVent('');
    setPhase('vent');
    setValidation('');
    setPreview([]);
    setBusy(false);
  }

  async function listenDone() {
    if (!vent.trim()) return;
    setValidation(buildVentValidation(vent));
    setPhase('validate');
  }

  async function extractTasks() {
    setBusy(true);
    try {
      const result = await parseVoiceTranscript(vent.trim());
      const items = result.parsedItems.slice(0, 3);
      setPreview(items);
      setPhase('preview');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      if (preview.length) await onExtract(preview);
      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Decompression Room</Text>
          <Text style={styles.hint}>
            Unfiltered vent. I will validate first—tasks only if you ask.
          </Text>

          {phase === 'vent' ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                placeholder="Say what is weighing on you…"
                placeholderTextColor={theme.muted}
                value={vent}
                onChangeText={setVent}
                textAlignVertical="top"
              />
              <View style={styles.row}>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                >
                  <Text style={styles.secondaryText}>Close</Text>
                </Pressable>
                <Pressable style={styles.primary} onPress={listenDone}>
                  <Text style={styles.primaryText}>I am done talking</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {phase === 'validate' ? (
            <>
              <Text style={styles.validate}>{validation}</Text>
              <View style={styles.row}>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                >
                  <Text style={styles.secondaryText}>Just rest</Text>
                </Pressable>
                <Pressable style={styles.primary} onPress={extractTasks} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={theme.surfaces.base} />
                  ) : (
                    <Text style={styles.primaryText}>Make 3 tasks</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : null}

          {phase === 'preview' ? (
            <>
              <Text style={styles.previewLabel}>Tomorrow’s queue</Text>
              {preview.map((item, i) => (
                <Text key={`${item.title}-${i}`} style={styles.previewItem}>
                  · {CATEGORY_LABELS[item.category]} — {item.title}
                </Text>
              ))}
              <View style={styles.row}>
                <Pressable style={styles.secondary} onPress={() => setPhase('validate')}>
                  <Text style={styles.secondaryText}>Back</Text>
                </Pressable>
                <Pressable style={styles.primary} onPress={confirm} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={theme.surfaces.base} />
                  ) : (
                    <Text style={styles.primaryText}>Park & sleep</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.surfaces.base,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
    maxHeight: '85%',
  },
  title: { fontSize: 20, fontWeight: '800', color: t.ink },
  hint: { fontSize: 13, color: t.muted, lineHeight: 18 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: t.ink,
    backgroundColor: t.soft,
  },
  validate: { fontSize: 15, lineHeight: 22, color: t.ink, fontWeight: '500' },
  previewLabel: { fontWeight: '800', color: t.ink },
  previewItem: { fontSize: 13, color: t.ink },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '700', color: t.ink },
  primary: {
    flex: 1.3,
    backgroundColor: t.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { fontWeight: '700', color: t.onAccent },
});
