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
import { Audio } from 'expo-av';

import { palette } from '@/constants/Colors';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (uri: string) => Promise<void>;
};

export function VoiceEchoSheet({ pillar, visible, onClose, onSaved }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
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
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
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
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <Text style={styles.primaryText}>Record</Text>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.primary} onPress={stopAndSave} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={palette.white} />
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

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink },
  script: { fontSize: 14, lineHeight: 20, color: palette.ink, fontWeight: '600' },
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
    flex: 1.2,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { fontWeight: '700', color: palette.white },
});
