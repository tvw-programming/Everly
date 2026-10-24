import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import type { ManifestPillar } from './types';

let toneSound: Audio.Sound | null = null;
let voiceSound: Audio.Sound | null = null;

export async function stopManifestAudio(): Promise<void> {
  for (const s of [toneSound, voiceSound]) {
    if (!s) continue;
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {
      // ignore
    }
  }
  toneSound = null;
  voiceSound = null;
}

/** Dual-stem: ambient tone + optional recorded voice (defaults 70/30). */
export async function playPillarDualStem(
  pillar: ManifestPillar,
  opts?: { voiceVolume?: number; toneVolume?: number; loop?: boolean }
): Promise<void> {
  await stopManifestAudio();
  if (Platform.OS !== 'web') {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }

  const toneVol = opts?.toneVolume ?? 0.7;
  const voiceVol = opts?.voiceVolume ?? 0.3;
  const loop = opts?.loop ?? true;

  const tone = new Audio.Sound();
  await tone.loadAsync(pillar.toneAsset, { shouldPlay: true, isLooping: loop, volume: toneVol });
  toneSound = tone;

  if (pillar.voiceUri) {
    const voice = new Audio.Sound();
    await voice.loadAsync(
      { uri: pillar.voiceUri },
      { shouldPlay: true, isLooping: loop, volume: voiceVol }
    );
    voiceSound = voice;
  }
}

let recording: Audio.Recording | null = null;

export async function startVoiceEchoRecording(): Promise<void> {
  await stopManifestAudio();
  if (Platform.OS === 'web') {
    throw new Error('Voice Echo recording needs a device build (not available on web preview).');
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const rec = new Audio.Recording();
  await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await rec.startAsync();
  recording = rec;
}

export async function stopVoiceEchoRecording(): Promise<string | null> {
  if (!recording) return null;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  return uri;
}
