import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** Copy a picked audio URI into app documents so moves/renames don't break alarms. */
export async function persistAlarmAudio(
  alarmId: string,
  sourceUri: string,
  displayName?: string
): Promise<string> {
  if (Platform.OS === 'web') return sourceUri;

  const base = FileSystem.documentDirectory;
  if (!base) return sourceUri;

  const dir = `${base}alarms/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const ext = guessExt(displayName ?? sourceUri);
  const dest = `${dir}${alarmId}${ext}`;
  try {
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
  } catch {
    // ignore
  }
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

function guessExt(nameOrUri: string): string {
  const m = nameOrUri.toLowerCase().match(/\.(mp3|m4a|wav|ogg|aac|flac)(\?|$)/);
  return m ? `.${m[1]}` : '.mp3';
}
