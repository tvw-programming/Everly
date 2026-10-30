import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ensurePracticeSeeded,
  getStatement,
  upsertStatement,
} from '@/lib/practice/storage';
import type { PracticeStatement } from '@/lib/practice/types';
import { useTheme } from '@/lib/theme/ThemeContext';

/** F9 — hold-to-record per statement, local only, optional. */
export default function PracticeVoiceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [list, setList] = useState<PracticeStatement[]>([]);
  const [selected, setSelected] = useState<PracticeStatement | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    void (async () => {
      const all = await ensurePracticeSeeded();
      setList(all.filter((s) => s.active || s.onBench));
      if (id) setSelected(await getStatement(id));
    })();
  }, [id]);

  async function start() {
    if (Platform.OS === 'web') {
      Alert.alert('Device build needed', 'Voice recording requires a native build.');
      return;
    }
    if (!selected) {
      Alert.alert('Pick a line first');
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }

  async function stop() {
    if (!selected) return;
    try {
      await recorder.stop();
      setRecording(false);
      const uri = recorder.uri;
      if (!uri) return;
      const next = {
        ...selected,
        audioUri: uri,
        updatedAt: new Date().toISOString(),
      };
      await upsertStatement(next);
      setSelected(next);
      Alert.alert('Saved', `Clip attached to ${selected.code}`);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown');
      setRecording(false);
    }
  }

  async function clearClip() {
    if (!selected) return;
    const next = { ...selected, audioUri: null, updatedAt: new Date().toISOString() };
    await upsertStatement(next);
    setSelected(next);
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>← Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.ink }]}>Own voice</Text>
      <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18 }}>
        Optional. Hold record up to ~60s. Clips stay on device and export with the practice bundle.
      </Text>

      {selected ? (
        <View style={[styles.selected, { backgroundColor: theme.soft }]}>
          <Text style={{ color: theme.accent, fontWeight: '900' }}>{selected.code}</Text>
          <Text style={{ color: theme.ink }}>{selected.body}</Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            {selected.audioUri ? 'Clip attached' : 'No clip yet'}
          </Text>
          <View style={styles.row}>
            {!recording ? (
              <Pressable
                onPressIn={() => void start()}
                style={[styles.btn, { backgroundColor: theme.accent }]}
              >
                <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Hold to record</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void stop()}
                style={[styles.btn, { backgroundColor: theme.danger }]}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>Stop and save</Text>
              </Pressable>
            )}
            {selected.audioUri ? (
              <Pressable onPress={() => void clearClip()}>
                <Text style={{ color: theme.muted, fontWeight: '800' }}>Delete clip</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={[
              styles.item,
              {
                backgroundColor: selected?.id === item.id ? theme.accent + '22' : theme.soft,
              },
            ]}
          >
            <Text style={{ color: theme.accent, fontWeight: '800' }}>{item.code}</Text>
            <Text style={{ color: theme.ink }} numberOfLines={2}>
              {item.body}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 10 },
  title: { fontSize: 24, fontWeight: '900' },
  selected: { borderRadius: 14, padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  item: { borderRadius: 12, padding: 10, marginBottom: 8, gap: 4 },
});
