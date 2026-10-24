import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

import { resolveSoundSource } from './sounds';

let currentSound: Audio.Sound | null = null;

export async function configureAudioMode(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // Audio mode is best-effort; never block the UI on it
  }
}

export async function stopSound(): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
  } catch {
    // ignore unload races
  }
  currentSound = null;
}

export async function playSound(assetUri: string): Promise<void> {
  await configureAudioMode();
  await stopSound();

  const source = resolveSoundSource(assetUri);
  const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, isLooping: false });
  currentSound = sound;

  sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      void stopSound();
    }
  });
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
