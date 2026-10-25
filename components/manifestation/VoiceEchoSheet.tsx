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
  View,
} from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';

import { palette } from '@/constants/Colors';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (uri: string) => Promise<void>;
};

export function VoiceEchoSheet({ pillar, visible, onClose, onSaved }: Props) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (Platform.OS === 'web') {
      setError('Voice Echo recording needs a device build. Use Reality Lock TTS for now on web.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is needed to record Voice Echo.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start recording');
    } finally {
      setBusy(false);
    }
  }

  async function stopAndSave() {
    if (!recording) return;
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setRecording(false);
      if (uri) await onSaved(uri);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save recording');
    } finally {
      setBusy(false);
    }
  }

  if (!pillar) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Voice Echo · {pillar.label}</Text>
          <Text style={styles.script}>{pillar.voiceScript}</Text>
          <Text style={styles.hint}>
            Read this 60-second identity script in your own voice. We clean, loop, and layer it under{' '}
            {pillar.frequencyHz} Hz.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onClose} disabled={busy}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
            {!recording ? (
              <Pressable style={styles.primary} onPress={start} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={theme.surfaces.base} />
                ) : (
                  <Text style={styles.primaryText}>Record</Text>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.primary} onPress={stopAndSave} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={theme.surfaces.base} />
                ) : (
                  <Text style={styles.primaryText}>Stop & Save</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: t.surfaces.base,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: t.ink },
  script: { fontSize: 14, lineHeight: 20, color: t.ink, fontWeight: '600' },
  hint: { fontSize: 12, color: t.muted, lineHeight: 17 },
  error: { color: t.danger, fontSize: 13 },
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
    flex: 1.2,
    backgroundColor: t.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { fontWeight: '700', color: t.onAccent },
});
