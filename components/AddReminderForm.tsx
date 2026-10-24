import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/Colors';
import { playSound, stopSound } from '@/lib/audio';
import { formatScheduleSummary, formatTime12h } from '@/lib/schedule';
import { BUNDLED_SOUNDS } from '@/lib/sounds';
import type { Reminder, ReminderCategory } from '@/lib/types';
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, DAY_LABELS } from '@/lib/types';

export type ReminderDraft = {
  title: string;
  notes: string;
  category: ReminderCategory | null;
  time: string;
  repeatMode: 'once' | 'weekdays' | 'everyday' | 'custom';
  daysOfWeek: number[];
  date: string;
  soundKey: string | null;
  customSoundUri: string | null;
  customSoundName: string | null;
};

type Props = {
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'>) => Promise<void>;
  onCancel: () => void;
};

const SECTIONS = ['Basics', 'When', 'Sound', 'Review'] as const;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AddReminderForm({ onSave, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [previewing, setPreviewing] = useState(false);

  const [draft, setDraft] = useState<ReminderDraft>({
    title: '',
    notes: '',
    category: null,
    time: nowTime(),
    repeatMode: 'everyday',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    date: todayISO(),
    soundKey: 'chime',
    customSoundUri: null,
    customSoundName: null,
  });

  const schedulePreview = useMemo(() => {
    const daysOfWeek =
      draft.repeatMode === 'once'
        ? []
        : draft.repeatMode === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : draft.repeatMode === 'everyday'
            ? [0, 1, 2, 3, 4, 5, 6]
            : draft.daysOfWeek;
    return formatScheduleSummary({
      time: draft.time,
      daysOfWeek,
      date: draft.repeatMode === 'once' ? draft.date : undefined,
    });
  }, [draft]);

  function update<K extends keyof ReminderDraft>(key: K, value: ReminderDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateStep(index: number): boolean {
    const nextErrors: Record<string, string> = {};
    if (index === 0) {
      if (!draft.title.trim()) nextErrors.title = 'Title is required';
      if (!draft.category) nextErrors.category = 'Pick a category';
    }
    if (index === 1) {
      if (!/^\d{2}:\d{2}$/.test(draft.time)) nextErrors.time = 'Pick a valid time';
      if (draft.repeatMode === 'once' && !draft.date) nextErrors.date = 'Pick a date';
      if (draft.repeatMode === 'custom' && draft.daysOfWeek.length === 0) {
        nextErrors.daysOfWeek = 'Select at least one day';
      }
    }
    if (index === 2) {
      if (!draft.soundKey && !draft.customSoundUri) {
        nextErrors.sound = 'Choose a bundled sound or pick an MP3 file';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, SECTIONS.length - 1));
  }

  function goBack() {
    if (step === 0) {
      onCancel();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handlePreview(uriOrKey: string) {
    try {
      setPreviewing(true);
      await playSound(uriOrKey);
    } finally {
      setTimeout(() => setPreviewing(false), 1800);
    }
  }

  async function pickCustomMp3() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/mp3', 'audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    update('customSoundUri', asset.uri);
    update('customSoundName', asset.name || 'Custom MP3');
    update('soundKey', null);
  }

  async function handleSave() {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setStep(0);
      return;
    }
    if (!draft.category) return;

    const daysOfWeek =
      draft.repeatMode === 'once'
        ? []
        : draft.repeatMode === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : draft.repeatMode === 'everyday'
            ? [0, 1, 2, 3, 4, 5, 6]
            : [...draft.daysOfWeek].sort((a, b) => a - b);

    const usingCustom = Boolean(draft.customSoundUri);
    const payload: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'> = {
      title: draft.title.trim(),
      notes: draft.notes.trim() || undefined,
      category: draft.category,
      schedule: {
        time: draft.time,
        daysOfWeek,
        date: draft.repeatMode === 'once' ? draft.date : undefined,
      },
      sound: {
        mode: 'mp3',
        assetUri: usingCustom ? draft.customSoundUri! : draft.soundKey!,
        assetName: usingCustom
          ? draft.customSoundName || 'Custom MP3'
          : BUNDLED_SOUNDS.find((s) => s.key === draft.soundKey)?.name || 'Sound',
      },
      enabled: true,
    };

    setSaving(true);
    try {
      await stopSound();
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  function onTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) update('time', dateToTime(selected));
  }

  function toggleDay(day: number) {
    const set = new Set(draft.daysOfWeek);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    update('daysOfWeek', Array.from(set).sort((a, b) => a - b));
    update('repeatMode', 'custom');
  }

  return (
    <View style={styles.root}>
      <View style={styles.steps}>
        {SECTIONS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  (active || done) && styles.stepDotActive,
                ]}
              >
                <Text style={[styles.stepDotText, (active || done) && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>What should we remind you about?</Text>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              value={draft.title}
              onChangeText={(t) => update('title', t)}
              placeholder="e.g. Take blood pressure meds"
              placeholderTextColor={palette.muted}
              style={[styles.input, errors.title && styles.inputError]}
            />
            {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={draft.notes}
              onChangeText={(t) => update('notes', t)}
              placeholder="Extra context for yourself"
              placeholderTextColor={palette.muted}
              style={[styles.input, styles.multiline]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            {(Object.keys(CATEGORY_LABELS) as ReminderCategory[]).map((cat) => {
              const selected = draft.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => update('category', cat)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <Text style={[styles.optionBody, selected && styles.optionBodySelected]}>
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </Text>
                </Pressable>
              );
            })}
            {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.heading}>When should it fire?</Text>
            <Text style={styles.fieldLabel}>Time · {formatTime12h(draft.time)}</Text>
            {Platform.OS === 'android' && (
              <Pressable style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timeButtonText}>Change time</Text>
              </Pressable>
            )}
            {(Platform.OS === 'ios' || showTimePicker) && Platform.OS !== 'web' && (
              <DateTimePicker
                value={timeToDate(draft.time)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
            {Platform.OS === 'web' && (
              <TextInput
                value={draft.time}
                onChangeText={(t) => update('time', t)}
                placeholder="HH:mm"
                placeholderTextColor={palette.muted}
                style={styles.input}
              />
            )}
            {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

            <Text style={styles.fieldLabel}>Repeat</Text>
            {(
              [
                ['once', 'Once'],
                ['weekdays', 'Weekdays'],
                ['everyday', 'Every day'],
                ['custom', 'Custom days'],
              ] as const
            ).map(([mode, label]) => (
              <Pressable
                key={mode}
                onPress={() => update('repeatMode', mode)}
                style={[styles.option, draft.repeatMode === mode && styles.optionSelected]}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    draft.repeatMode === mode && styles.optionTitleSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}

            {draft.repeatMode === 'once' && (
              <>
                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={draft.date}
                  onChangeText={(t) => update('date', t)}
                  placeholder={todayISO()}
                  placeholderTextColor={palette.muted}
                  style={[styles.input, errors.date && styles.inputError]}
                />
                {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}
              </>
            )}

            {draft.repeatMode === 'custom' && (
              <>
                <Text style={styles.fieldLabel}>Days</Text>
                <View style={styles.daysRow}>
                  {DAY_LABELS.map((label, day) => {
                    const on = draft.daysOfWeek.includes(day);
                    return (
                      <Pressable
                        key={label}
                        onPress={() => toggleDay(day)}
                        style={[styles.dayChip, on && styles.dayChipOn]}
                      >
                        <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.daysOfWeek ? (
                  <Text style={styles.error}>{errors.daysOfWeek}</Text>
                ) : null}
              </>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Pick the sound that plays</Text>
            <Text style={styles.hint}>
              Local MP3 only for now. Text-to-speech can plug in later via sound mode.
            </Text>
            {BUNDLED_SOUNDS.map((sound) => {
              const selected = draft.soundKey === sound.key && !draft.customSoundUri;
              return (
                <Pressable
                  key={sound.key}
                  onPress={() => {
                    update('soundKey', sound.key);
                    update('customSoundUri', null);
                    update('customSoundName', null);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.soundRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.optionTitle, selected && styles.optionTitleSelected]}
                      >
                        {sound.name}
                      </Text>
                      <Text
                        style={[styles.optionBody, selected && styles.optionBodySelected]}
                      >
                        {sound.description}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handlePreview(sound.key)}
                      style={styles.previewBtn}
                    >
                      <Text style={styles.previewBtnText}>
                        {previewing && selected ? '…' : 'Preview'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              onPress={pickCustomMp3}
              style={[
                styles.option,
                draft.customSoundUri ? styles.optionSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.optionTitle,
                  draft.customSoundUri && styles.optionTitleSelected,
                ]}
              >
                Use my own MP3
              </Text>
              <Text
                style={[
                  styles.optionBody,
                  draft.customSoundUri && styles.optionBodySelected,
                ]}
              >
                {draft.customSoundName || 'Pick a file from this device'}
              </Text>
            </Pressable>
            {draft.customSoundUri ? (
              <Pressable
                style={styles.previewBtn}
                onPress={() => handlePreview(draft.customSoundUri!)}
              >
                <Text style={styles.previewBtnText}>Preview custom file</Text>
              </Pressable>
            ) : null}
            {errors.sound ? <Text style={styles.error}>{errors.sound}</Text> : null}
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Review & save</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Title" value={draft.title.trim() || '—'} />
              <ReviewRow
                label="Category"
                value={draft.category ? CATEGORY_LABELS[draft.category] : '—'}
              />
              <ReviewRow label="Schedule" value={schedulePreview} />
              <ReviewRow
                label="Sound"
                value={
                  draft.customSoundName ||
                  BUNDLED_SOUNDS.find((s) => s.key === draft.soundKey)?.name ||
                  '—'
                }
              />
              {draft.notes.trim() ? <ReviewRow label="Notes" value={draft.notes.trim()} /> : null}
            </View>
            <Text style={styles.hint}>
              On a phone or simulator, a local notification will fire at the next matching time and
              play this MP3. Web preview saves reminders but cannot schedule native notifications.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={goBack} style={styles.secondaryBtn} disabled={saving}>
          <Text style={styles.secondaryBtnText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        {step < SECTIONS.length - 1 ? (
          <Pressable onPress={goNext} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleSave} style={styles.primaryBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Save reminder</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignSelf: 'stretch', backgroundColor: palette.paper },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.white,
  },
  stepItem: { alignItems: 'center', flex: 1, gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mist,
  },
  stepDotActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  stepDotText: { fontSize: 12, fontWeight: '700', color: palette.muted },
  stepDotTextActive: { color: palette.white },
  stepLabel: { fontSize: 11, color: palette.muted, fontWeight: '600' },
  stepLabelActive: { color: palette.tealDark },
  content: { padding: 20, paddingBottom: 40 },
  section: { gap: 10 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 8,
  },
  fieldLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.ink,
  },
  multiline: { minHeight: 88 },
  inputError: { borderColor: palette.danger },
  error: { color: palette.danger, fontSize: 13 },
  option: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  optionSelected: {
    borderColor: palette.teal,
    backgroundColor: '#E6F4F3',
  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: palette.ink },
  optionTitleSelected: { color: palette.tealDark },
  optionBody: { fontSize: 13, color: palette.muted, lineHeight: 18 },
  optionBodySelected: { color: palette.tealDark },
  timeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.mist,
  },
  timeButtonText: { fontWeight: '700', color: palette.tealDark },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  dayChipOn: { backgroundColor: palette.teal, borderColor: palette.teal },
  dayChipText: { fontWeight: '700', color: palette.ink, fontSize: 13 },
  dayChipTextOn: { color: palette.white },
  hint: { fontSize: 14, color: palette.muted, lineHeight: 20 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.mist,
  },
  previewBtnText: { fontWeight: '700', color: palette.tealDark, fontSize: 13 },
  reviewCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 12,
  },
  reviewRow: { gap: 2 },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
  },
  reviewValue: { fontSize: 16, color: palette.ink, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '700', color: palette.ink },
  primaryBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnText: { fontWeight: '700', color: palette.white, fontSize: 16 },
});
