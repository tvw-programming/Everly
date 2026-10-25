import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getReliabilityStatus,
  openBatterySettings,
  openExactAlarmSettings,
  type ReliabilityStatus,
} from '@/lib/alarms/native';
import { ensureNotificationPermissions } from '@/lib/notifications';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function AlarmReliabilityScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ReliabilityStatus | null>(null);

  const refresh = useCallback(() => {
    void getReliabilityStatus().then(setStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>← Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.ink }]}>Reminder reliability</Text>
      <Text style={[styles.sub, { color: theme.muted }]}>
        Exact alarms and a short playback service are required for full-song ringing when the app
        is closed. Expo Go cannot do this — use a sideloaded APK.
      </Text>

      {status ? (
        <View style={styles.list}>
          <Row
            label="Notifications"
            ok={status.notifications}
            theme={theme}
            detail="Needed so you see Stop / Snooze / Done."
          />
          <Row
            label="Exact alarms"
            ok={status.exactAlarms}
            theme={theme}
            detail="Lets Android wake the device on time."
          />
          <Row
            label="Native alarm module"
            ok={status.nativeModule}
            theme={theme}
            detail={status.message}
          />
          <Text style={[styles.hint, { color: theme.muted }]}>{status.batteryHint}</Text>
          {status.lastTestAt ? (
            <Text style={[styles.hint, { color: theme.muted }]}>
              Last test: {new Date(status.lastTestAt).toLocaleString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        style={[styles.btn, { backgroundColor: theme.accent }]}
        onPress={async () => {
          const ok = await ensureNotificationPermissions();
          if (!ok) {
            Alert.alert(
              'Notifications blocked',
              'Enable notifications in system settings so alarm actions appear.'
            );
          }
          refresh();
        }}
      >
        <Text style={[styles.btnText, { color: theme.onAccent }]}>Enable notifications</Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: theme.border }]}
        onPress={() => void openExactAlarmSettings()}
      >
        <Text style={[styles.btnOutlineText, { color: theme.ink }]}>Open alarm settings</Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: theme.border }]}
        onPress={() => void openBatterySettings()}
      >
        <Text style={[styles.btnOutlineText, { color: theme.ink }]}>Open battery settings</Text>
      </Pressable>
      <Pressable onPress={refresh}>
        <Text style={{ textAlign: 'center', color: theme.accent, fontWeight: '800' }}>Refresh</Text>
      </Pressable>
    </View>
  );
}

function Row({
  label,
  ok,
  detail,
  theme,
}: {
  label: string;
  ok: boolean;
  detail: string;
  theme: { ink: string; muted: string; soft: string; danger: string; accent: string };
}) {
  return (
    <View style={[styles.row, { backgroundColor: theme.soft }]}>
      <Text style={{ color: ok ? theme.accent : theme.danger, fontWeight: '900' }}>
        {ok ? 'OK' : 'NEED'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: '800' }}>{label}</Text>
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, lineHeight: 19 },
  list: { gap: 8, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
  hint: { fontSize: 12, lineHeight: 17 },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontWeight: '900' },
  btnOutline: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnOutlineText: { fontWeight: '800' },
});
