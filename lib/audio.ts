import { AudioPlayer, AudioStatus, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { resolveSoundSource } from './sounds';

let currentSound: AudioPlayer | null = null;

export async function configureAudioMode(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    // Audio mode is best-effort; never block the UI on it
  }
}

export async function stopSound(): Promise<void> {
  if (!currentSound) return;
  try {
    currentSound.pause();
    currentSound.remove();
  } catch {
    // ignore unload races
  }
  currentSound = null;
}

export async function playSound(assetUri: string): Promise<void> {
  await configureAudioMode();
  await stopSound();

  const source = resolveSoundSource(assetUri);
  const sound = createAudioPlayer(source);
  currentSound = sound;

  sound.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish && currentSound === sound) {
      void stopSound();
    }
  });
  sound.play();
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
