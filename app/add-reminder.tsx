import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { AddReminderForm } from '@/components/AddReminderForm';
import { palette } from '@/constants/Colors';
import { scheduleReminderNotification } from '@/lib/notifications';
import { createId } from '@/lib/schedule';
import { upsertReminder } from '@/lib/storage';
import type { Reminder } from '@/lib/types';

export default function AddReminderScreen() {
  const styles = useThemedStyles(createStyles);
  async function handleSave(
    payload: Omit<Reminder, 'id' | 'createdAt' | 'notificationId'>
  ) {
    const reminder: Reminder = {
      ...payload,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    try {
      reminder.notificationId = await scheduleReminderNotification(reminder);
      await upsertReminder(reminder);
      router.back();
    } catch (e) {
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : 'Something went wrong while saving this reminder.'
      );
      throw e;
    }
  }

  return (
    <View style={styles.root}>
      {Platform.OS === 'android' ? <StatusBar style="dark" /> : null}
      <AddReminderForm onSave={handleSave} onCancel={() => router.back()} />
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.surfaces.base,
  },
});
