import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import {
  getReliabilityStatus,
  openBatterySettings,
  openExactAlarmSettings,
  type ReliabilityStatus,
} from '@/lib/alarms/native';
import { ensureNotificationPermissions } from '@/lib/notifications';
import { useTheme } from '@/lib/theme/ThemeContext';
import { LEGEND_SURFACE, RADIUS, SPACE } from '@/lib/theme/tokens';

/**
 * Reminder reliability, as a Settings section.
 * Exact alarms plus a short playback service are what let a full song ring
 * while the app is closed — neither is possible in Expo Go.
 */
export function ReliabilitySection() {
  const { theme } = useTheme();
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
    <View style={styles.wrap}>
      <Text variant="bodySmall" style={{ color: theme.muted, lineHeight: 18 }}>
        Exact alarms and a short playback service are required for full-song ringing when the app
        is closed. Expo Go cannot do this — use a sideloaded APK.
      </Text>

      {status ? (
        <View style={styles.list}>
          <Row
            label="Notifications"
            ok={status.notifications}
            detail="Needed so you see Stop / Snooze / Done."
          />
          <Row
            label="Exact alarms"
            ok={status.exactAlarms}
            detail="Lets Android wake the device on time."
          />
          <Row label="Native alarm module" ok={status.nativeModule} detail={status.message} />
          <Text variant="bodySmall" style={{ color: theme.muted, lineHeight: 17 }}>
            {status.batteryHint}
          </Text>
          {status.lastTestAt ? (
            <Text variant="bodySmall" style={{ color: theme.muted }}>
              Last test: {new Date(status.lastTestAt).toLocaleString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Button
        mode="contained"
        style={styles.action}
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
        Enable notifications
      </Button>
      <Button mode="outlined" style={styles.action} onPress={() => void openExactAlarmSettings()}>
        Open alarm settings
      </Button>
      <Button mode="outlined" style={styles.action} onPress={() => void openBatterySettings()}>
        Open battery settings
      </Button>
      <Button mode="text" onPress={refresh}>
        Refresh status
      </Button>
    </View>
  );
}

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: LEGEND_SURFACE[theme.mode] }]}>
      <Text
        variant="labelMedium"
        style={{ color: ok ? theme.accent : theme.danger, fontWeight: '900' }}
      >
        {ok ? 'OK' : 'NEED'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" style={{ color: theme.ink, fontWeight: '800' }}>
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.muted, marginTop: 2 }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE[1] },
  list: { gap: SPACE[1] },
  row: {
    flexDirection: 'row',
    gap: SPACE[1],
    padding: SPACE[2],
    borderRadius: RADIUS.md,
    alignItems: 'flex-start',
  },
  action: { borderRadius: RADIUS.pill },
});
