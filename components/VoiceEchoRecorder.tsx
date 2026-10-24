import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { startVoiceEchoRecording, stopVoiceEchoRecording } from '@/lib/manifestation/audio';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  onSaved: (uri: string) => Promise<void>;
  onClose: () => void;
};

export function VoiceEchoRecorder({ pillar, onSaved, onClose }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pillar) return null;

  async function toggle() {
    setError(null);
    try {
      if (!recording) {
        await startVoiceEchoRecording();
        setRecording(true);
        return;
      }
      setBusy(true);
      const uri = await stopVoiceEchoRecording();
      setRecording(false);
      if (uri) await onSaved(uri);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recording failed');
      setRecording(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Voice Echo · {pillar.label}</Text>
          <Text style={styles.script}>{pillar.voiceScript}</Text>
          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Recording requires a device build. You can still run Reality Lock with frequency tones.'
              : 'Read the script aloud. We will loop your voice under the frequency bed.'}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
            <Pressable
              style={[styles.primary, recording && styles.rec]}
              onPress={toggle}
              disabled={busy || Platform.OS === 'web'}
            >
              {busy ? (
                <ActivityIndicator color={palette.white} />
              ) : (
                <Text style={styles.primaryText}>{recording ? 'Stop & Save' : 'Hold Script · Record'}</Text>
              )}
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
  script: { fontSize: 15, lineHeight: 22, color: palette.ink, fontWeight: '500' },
  hint: { fontSize: 12, color: palette.muted, lineHeight: 17 },
  error: { color: palette.danger, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
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
    flex: 1.4,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rec: { backgroundColor: palette.danger },
  primaryText: { fontWeight: '700', color: palette.white, fontSize: 13 },
});
