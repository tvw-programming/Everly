import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { persistAlarmAudio } from '@/lib/alarms/audioFiles';
import { cancelAlarmSchedule, syncAlarmSchedule } from '@/lib/alarms/native';
import {
  buildAlarmSummary,
  createAlarmId,
  defaultAlarmDraft,
  formatAlarmTime,
  toHour24,
} from '@/lib/alarms/schedule';
import { getAlarm, upsertAlarm } from '@/lib/alarms/storage';
import type { AlarmCategory, AlarmFrequency, AlarmReminder } from '@/lib/alarms/types';
import { ALARM_CATEGORY_LABELS, WEEKDAY_SHORT } from '@/lib/alarms/types';
import { playSound, stopSound } from '@/lib/audio';
import { BUNDLED_SOUNDS } from '@/lib/sounds';
import { useTheme } from '@/lib/theme/ThemeContext';

type Draft = Omit<AlarmReminder, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
};

export default function AlarmEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft>(defaultAlarmDraft());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const existing = await getAlarm(id);
      if (existing) setDraft(existing);
    })();
  }, [id]);

  const pickerDate = useMemo(() => {
    const d = new Date();
    d.setHours(toHour24(draft.hour12, draft.period), draft.minute, 0, 0);
    return d;
  }, [draft.hour12, draft.minute, draft.period]);

  const summary = buildAlarmSummary({
    ...(draft as AlarmReminder),
    id: draft.id ?? 'tmp',
    createdAt: draft.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  function patch(p: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function onTimeChange(_: unknown, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!date) return;
    const h24 = date.getHours();
    const minute = date.getMinutes();
    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let hour12 = h24 % 12;
    if (hour12 === 0) hour12 = 12;
    patch({ hour12, minute, period });
  }

  async function save() {
    if (!draft.title.trim()) {
      Alert.alert('Title required');
      return;
    }
    if (draft.frequency === 'weekly' && draft.weekdays.length === 0) {
      Alert.alert('Pick at least one weekday');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = draft.id ?? createAlarmId();
      let audio = draft.audio;
      if (audio.source === 'local_file' && audio.managedPath) {
        try {
          const managed = await persistAlarmAudio(id, audio.managedPath, audio.displayName);
          audio = { ...audio, managedPath: managed };
        } catch {
          // Keep picker URI — native may still play content:// on some devices
        }
      }
      const alarm: AlarmReminder = {
        ...draft,
        id,
        audio,
        title: draft.title.trim(),
        createdAt: draft.createdAt ?? now,
        updatedAt: now,
      } as AlarmReminder;
      const nextFire = await syncAlarmSchedule(alarm);
      alarm.nextFireAt = nextFire;
      await upsertAlarm(alarm);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.canvas }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
        gap: 12,
      }}
    >
      <Text style={[styles.heading, { color: theme.ink }]}>
        {id ? 'Edit reminder' : 'Add reminder'}
      </Text>

      <Field label="Title" themeInk={theme.ink} themeMuted={theme.muted}>
        <TextInput
          style={[styles.input, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
          value={draft.title}
          onChangeText={(title) => patch({ title })}
          placeholder="Morning focus"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <Field label="Description" themeInk={theme.ink} themeMuted={theme.muted}>
        <TextInput
          style={[styles.input, styles.area, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
          value={draft.description}
          onChangeText={(description) => patch({ description })}
          placeholder="Optional notes"
          placeholderTextColor={theme.muted}
          multiline
        />
      </Field>

      <Field label="Category" themeInk={theme.ink} themeMuted={theme.muted}>
        <View style={styles.rowWrap}>
          {(Object.keys(ALARM_CATEGORY_LABELS) as AlarmCategory[]).map((c) => (
            <Chip
              key={c}
              label={ALARM_CATEGORY_LABELS[c]}
              active={draft.category === c}
              onPress={() => patch({ category: c })}
              accent={theme.accent}
              ink={theme.ink}
              soft={theme.soft}
              onAccent={theme.onAccent}
            />
          ))}
        </View>
      </Field>

      <Field label="Time (12-hour)" themeInk={theme.ink} themeMuted={theme.muted}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.timeBtn, { borderColor: theme.border, backgroundColor: theme.soft }]}
        >
          <Text style={[styles.timeText, { color: theme.ink }]}>
            {formatAlarmTime(draft.hour12, draft.minute, draft.period)}
          </Text>
          <Text style={{ color: theme.muted, fontWeight: '700' }}>AM/PM via picker</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        ) : null}
      </Field>

      <Field label="Frequency" themeInk={theme.ink} themeMuted={theme.muted}>
        <View style={styles.rowWrap}>
          {(['once', 'daily', 'weekly'] as AlarmFrequency[]).map((f) => (
            <Chip
              key={f}
              label={f === 'once' ? 'One-time' : f[0].toUpperCase() + f.slice(1)}
              active={draft.frequency === f}
              onPress={() => patch({ frequency: f })}
              accent={theme.accent}
              ink={theme.ink}
              soft={theme.soft}
              onAccent={theme.onAccent}
            />
          ))}
        </View>
      </Field>

      {draft.frequency === 'weekly' ? (
        <Field label="Repeat days" themeInk={theme.ink} themeMuted={theme.muted}>
          <View style={styles.rowWrap}>
            {WEEKDAY_SHORT.map((label, day) => {
              const on = draft.weekdays.includes(day);
              return (
                <Chip
                  key={label}
                  label={label}
                  active={on}
                  onPress={() => {
                    const set = new Set(draft.weekdays);
                    if (on) set.delete(day);
                    else set.add(day);
                    patch({ weekdays: Array.from(set).sort() });
                  }}
                  accent={theme.accent}
                  ink={theme.ink}
                  soft={theme.soft}
                  onAccent={theme.onAccent}
                />
              );
            })}
          </View>
        </Field>
      ) : null}

      <Field label="Audio" themeInk={theme.ink} themeMuted={theme.muted}>
        <View style={styles.rowWrap}>
          <Chip
            label="Silent"
            active={draft.audio.source === 'silent'}
            onPress={() =>
              patch({ audio: { source: 'silent', displayName: 'Silent' } })
            }
            accent={theme.accent}
            ink={theme.ink}
            soft={theme.soft}
            onAccent={theme.onAccent}
          />
          {BUNDLED_SOUNDS.map((s) => (
            <Chip
              key={s.key}
              label={s.name}
              active={draft.audio.source === 'bundled' && draft.audio.bundledKey === s.key}
              onPress={() =>
                patch({
                  audio: { source: 'bundled', bundledKey: s.key, displayName: s.name },
                })
              }
              accent={theme.accent}
              ink={theme.ink}
              soft={theme.soft}
              onAccent={theme.onAccent}
            />
          ))}
          <Chip
            label="Local file"
            active={draft.audio.source === 'local_file'}
            onPress={async () => {
              const res = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
              });
              if (res.canceled || !res.assets?.[0]) return;
              const asset = res.assets[0];
              patch({
                audio: {
                  source: 'local_file',
                  displayName: asset.name || 'Local audio',
                  managedPath: asset.uri,
                  durationMs: undefined,
                },
              });
            }}
            accent={theme.accent}
            ink={theme.ink}
            soft={theme.soft}
            onAccent={theme.onAccent}
          />
        </View>
        <View style={styles.rowWrap}>
          <Pressable
            onPress={() => {
              if (draft.audio.source === 'silent') return;
              const key = draft.audio.managedPath ?? draft.audio.bundledKey ?? 'chime';
              void playSound(key);
            }}
          >
            <Text style={{ color: theme.accent, fontWeight: '800' }}>Play preview</Text>
          </Pressable>
          <Pressable onPress={() => void stopSound()}>
            <Text style={{ color: theme.muted, fontWeight: '800' }}>Stop</Text>
          </Pressable>
        </View>
      </Field>

      <Field label="Playback" themeInk={theme.ink} themeMuted={theme.muted}>
        <View style={styles.rowWrap}>
          <Chip
            label="Play once"
            active={draft.playback.mode === 'once'}
            onPress={() => patch({ playback: { ...draft.playback, mode: 'once' } })}
            accent={theme.accent}
            ink={theme.ink}
            soft={theme.soft}
            onAccent={theme.onAccent}
          />
          <Chip
            label="Loop until stopped"
            active={draft.playback.mode === 'loop_until_stopped'}
            onPress={() =>
              patch({ playback: { ...draft.playback, mode: 'loop_until_stopped' } })
            }
            accent={theme.accent}
            ink={theme.ink}
            soft={theme.soft}
            onAccent={theme.onAccent}
          />
        </View>
        <Text style={{ color: theme.muted, fontWeight: '700', marginTop: 4 }}>Max ring</Text>
        <View style={styles.rowWrap}>
          {([1, 5, 10, 30] as const).map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              active={draft.playback.maxRingMinutes === m}
              onPress={() => patch({ playback: { ...draft.playback, maxRingMinutes: m } })}
              accent={theme.accent}
              ink={theme.ink}
              soft={theme.soft}
              onAccent={theme.onAccent}
            />
          ))}
        </View>
      </Field>

      <Field label="Snooze" themeInk={theme.ink} themeMuted={theme.muted}>
        <View style={styles.rowWrap}>
          {([5, 10, 15, 30] as const).map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              active={draft.snoozeMinutes === m}
              onPress={() => patch({ snoozeMinutes: m })}
              accent={theme.accent}
              ink={theme.ink}
              soft={theme.soft}
              onAccent={theme.onAccent}
            />
          ))}
        </View>
      </Field>

      <View style={styles.switchRow}>
        <Text style={{ color: theme.ink, fontWeight: '700' }}>Vibration</Text>
        <Switch
          value={draft.vibration}
          onValueChange={(vibration) => patch({ vibration })}
          trackColor={{ true: theme.accent, false: theme.border }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: theme.ink, fontWeight: '700' }}>Enabled</Text>
        <Switch
          value={draft.enabled}
          onValueChange={(enabled) => patch({ enabled })}
          trackColor={{ true: theme.accent, false: theme.border }}
        />
      </View>

      <View style={[styles.summaryBox, { backgroundColor: theme.soft, borderColor: theme.border }]}>
        <Text style={[styles.summaryLabel, { color: theme.accent }]}>Summary</Text>
        <Text style={{ color: theme.ink, lineHeight: 20, fontWeight: '600' }}>{summary}</Text>
      </View>

      <Pressable
        style={[styles.save, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={[styles.saveText, { color: theme.onAccent }]}>
          {saving ? 'Saving…' : 'Save reminder'}
        </Text>
      </Pressable>

      {id ? (
        <Pressable
          onPress={async () => {
            await cancelAlarmSchedule(id);
            router.back();
          }}
        >
          <Text style={{ textAlign: 'center', color: theme.muted, fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function Field({
  label,
  children,
  themeInk,
  themeMuted,
}: {
  label: string;
  children: React.ReactNode;
  themeInk: string;
  themeMuted: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: themeMuted, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  accent,
  ink,
  soft,
  onAccent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
  ink: string;
  soft: string;
  onAccent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? accent : soft,
        borderWidth: 1,
        borderColor: active ? accent : 'transparent',
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 12, color: active ? onAccent : ink }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  area: { minHeight: 72, textAlignVertical: 'top' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  timeText: { fontSize: 28, fontWeight: '900' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  summaryLabel: { fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  save: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveText: { fontWeight: '900', fontSize: 16 },
});
