import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
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

import { impact } from '@/lib/haptics';
import { CaptureMenu } from '@/components/CaptureMenu';
import { SymbolView } from 'expo-symbols';

import { useDockInset } from '@/components/glass/GlassDock';

import { palette } from '@/constants/Colors';
import { parseVoiceTranscript } from '@/lib/api';
import type { ParsedTaskDraft } from '@/lib/parser';
import { CATEGORY_LABELS } from '@/lib/types';
import type { TaskCategory } from '@/lib/types';
import { categoryColors } from '@/lib/theme/categories';
import { pickOnColor } from '@/lib/theme/color';

const CATEGORY_IDS: TaskCategory[] = ['personal', 'social', 'professional', 'financial'];

type Props = {
  onParsed: (items: ParsedTaskDraft[], raw?: string) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  onTranscriptMood?: (text: string) => void;
};

export function VoiceCapture({ onParsed, onOpenChange, onTranscriptMood }: Props) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const dockInset = useDockInset();
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);

  function setSheet(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }
  const [transcript, setTranscript] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ParsedTaskDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runParse() {
    if (!transcript.trim()) {
      setError('Type what you want to be reminded of');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onTranscriptMood?.(transcript.trim());
      const result = await parseVoiceTranscript(transcript.trim());
      if (!result.parsedItems.length) {
        setError(result.unresolvedNotes || 'Could not extract tasks');
        setPreview([]);
        return;
      }
      // The picked category wins over the parser's guess: the user chose it.
      setPreview(result.parsedItems.map((item) => ({ ...item, category })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSave() {
    setBusy(true);
    try {
      await onParsed(preview, transcript.trim());
      setSheet(false);
      setTranscript('');
      setPreview([]);
      setCategory('personal');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable
        style={[styles.micFab, { bottom: dockInset + 8 }]}
        onPress={() => setSheet(true)}
        onLongPress={() => {
          impact('light');
          setMenuOpen(true);
        }}
        accessibilityLabel="Add reminder"
        accessibilityHint="Long press for more ways to add"
      >
        <SymbolView
          name={Platform.OS === 'ios' ? ('plus' as never) : ('add' as never)}
          tintColor={theme.onAccent}
          size={26}
          fallback={<Text style={[styles.micIcon, { color: theme.onAccent }]}>+</Text>}
        />
      </Pressable>

      <CaptureMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorBottom={dockInset + 72}
      />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setSheet(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>New reminder</Text>
            <Text style={styles.hint}>
              Pick a category, then type what you need. One line can hold several tasks.
            </Text>

            <View
              style={styles.categoryRow}
              accessibilityRole="radiogroup"
              accessibilityLabel="Category"
            >
              {CATEGORY_IDS.map((id) => {
                const selected = category === id;
                const { accent } = categoryColors(id, theme.mode);
                return (
                  <Pressable
                    key={id}
                    onPress={() => setCategory(id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={CATEGORY_LABELS[id]}
                    style={[
                      styles.categoryButton,
                      { borderColor: accent },
                      selected && { backgroundColor: accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: selected ? pickOnColor(accent) : accent },
                      ]}
                      numberOfLines={1}
                    >
                      {CATEGORY_LABELS[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              multiline
              placeholder='e.g. Take 500ml water at 4pm'
              placeholderTextColor={theme.muted}
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
                    <ActivityIndicator color={theme.surfaces.base} />
                  ) : (
                    <Text style={styles.primaryText}>Route</Text>
                  )}
                </Pressable>
              ) : (
                <Pressable style={styles.primary} onPress={confirmSave} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={theme.surfaces.base} />
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

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  micFab: {
    position: 'absolute',
    right: 18,
    bottom: 88,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: t.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  micIcon: { fontSize: 28, fontWeight: '300', marginTop: -2 },
  categoryRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  categoryButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryText: { fontSize: 12, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.surfaces.base,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '800', color: t.ink },
  hint: { fontSize: 13, color: t.muted, lineHeight: 18 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    color: t.ink,
    backgroundColor: t.soft,
  },
  error: { color: t.danger, fontSize: 13 },
  preview: { gap: 4, backgroundColor: t.soft, borderRadius: 12, padding: 10 },
  previewLabel: { fontWeight: '700', color: t.ink, marginBottom: 2 },
  previewItem: { fontSize: 13, color: t.ink },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
    flex: 1.2,
    backgroundColor: t.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { fontWeight: '700', color: t.onAccent, fontSize: 16 },
});
