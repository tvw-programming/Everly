import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { AddReminderForm } from '@/components/AddReminderForm';
import { palette } from '@/constants/Colors';
import { scheduleReminderNotification } from '@/lib/notifications';
import { createId } from '@/lib/schedule';
import { upsertReminder } from '@/lib/storage';
import type { Reminder } from '@/lib/types';

export default function AddReminderScreen() {
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
      <AddReminderForm onSave={handleSave} onCancel={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.paper,
  },
});
