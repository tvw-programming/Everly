import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/Colors';
import { parseVoiceTranscript } from '@/lib/api';
import type { ParsedTaskDraft } from '@/lib/parser';
import { CATEGORY_LABELS } from '@/lib/types';

type Props = {
  onParsed: (items: ParsedTaskDraft[]) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
};

export function VoiceCapture({ onParsed, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);

  function setSheet(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ParsedTaskDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runParse() {
    if (!transcript.trim()) {
      setError('Speak or paste a thought first');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await parseVoiceTranscript(transcript.trim());
      if (!result.parsedItems.length) {
        setError(result.unresolvedNotes || 'Could not extract tasks');
        setPreview([]);
        return;
      }
      setPreview(result.parsedItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSave() {
    setBusy(true);
    try {
      await onParsed(preview);
      setSheet(false);
      setTranscript('');
      setPreview([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable
        style={styles.micFab}
        onPress={() => setSheet(true)}
        accessibilityLabel="Voice capture"
      >
        <Text style={styles.micIcon}>🎙</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setSheet(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Contextual Second Brain</Text>
            <Text style={styles.hint}>
              {Platform.OS === 'web'
                ? 'Paste or type a multi-intent thought. Device builds will stream mic audio to STT.'
                : 'Dictate or type. One stream can create Personal, Social, and Professional tasks.'}
            </Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder='e.g. Took 500ml water, check Nifty options at 9:15 AM, post the AI demo on X at 6 PM'
              placeholderTextColor={palette.muted}
              value={transcript}
              onChangeText={setTranscript}
              textAlignVertical="top"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {preview.length > 0 ? (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Routed tasks</Text>
                {preview.map((item, idx) => (
                  <Text key={`${item.title}-${idx}`} style={styles.previewItem}>
                    · {CATEGORY_LABELS[item.category]} — {item.title}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.secondary} onPress={() => setSheet(false)} disabled={busy}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              {preview.length === 0 ? (
                <Pressable style={styles.primary} onPress={runParse} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <Text style={styles.primaryText}>Route</Text>
                  )}
                </Pressable>
              ) : (
                <Pressable style={styles.primary} onPress={confirmSave} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <Text style={styles.primaryText}>Add {preview.length}</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  micFab: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  micIcon: { fontSize: 22 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '800', color: palette.ink },
  hint: { fontSize: 13, color: palette.muted, lineHeight: 18 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: palette.ink,
    backgroundColor: palette.soft,
  },
  error: { color: palette.danger, fontSize: 13 },
  preview: { gap: 4, backgroundColor: palette.soft, borderRadius: 12, padding: 10 },
  previewLabel: { fontWeight: '700', color: palette.ink, marginBottom: 2 },
  previewItem: { fontSize: 13, color: palette.ink },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { fontWeight: '700', color: palette.white, fontSize: 16 },
});
