import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import type { ManifestPillar } from './types';

const TONE_ASSETS: Record<number, number> = {
  40: require('../../assets/manifestation/tones/hz40.wav'),
  528: require('../../assets/manifestation/tones/hz528.wav'),
  639: require('../../assets/manifestation/tones/hz639.wav'),
  888: require('../../assets/manifestation/tones/hz888.wav'),
  // nearest bundled carrier for 432 Hz abundance lock-ins
  432: require('../../assets/manifestation/tones/hz888.wav'),
};

let voiceSound: Audio.Sound | null = null;
let toneSound: Audio.Sound | null = null;
let webToneCtx: AudioContext | null = null;
let webOsc: OscillatorNode | null = null;
let webGain: GainNode | null = null;

export async function stopManifestAudio(): Promise<void> {
  Speech.stop();
  if (voiceSound) {
    try {
      await voiceSound.stopAsync();
      await voiceSound.unloadAsync();
    } catch {
      // ignore
    }
    voiceSound = null;
  }
  if (toneSound) {
    try {
      await toneSound.stopAsync();
      await toneSound.unloadAsync();
    } catch {
      // ignore
    }
    toneSound = null;
  }
  if (webOsc) {
    try {
      webOsc.stop();
      webOsc.disconnect();
    } catch {
      // ignore
    }
    webOsc = null;
  }
  if (webGain) {
    try {
      webGain.disconnect();
    } catch {
      // ignore
    }
    webGain = null;
  }
}

function startWebTone(hz: number, volume: number) {
  const AC =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      : null;
  if (!AC) return;
  if (!webToneCtx) webToneCtx = new AC();
  const ctx = webToneCtx;
  webOsc = ctx.createOscillator();
  webGain = ctx.createGain();
  webOsc.type = 'sine';
  webOsc.frequency.value = hz;
  webGain.gain.value = Math.max(0.02, Math.min(0.35, volume * 0.28));
  webOsc.connect(webGain);
  webGain.connect(ctx.destination);
  webOsc.start();
}

async function playNativeTone(hz: number, volume: number, loop: boolean) {
  const asset = TONE_ASSETS[hz] ?? TONE_ASSETS[432];
  if (!asset) return;
  const { sound } = await Audio.Sound.createAsync(asset, {
    shouldPlay: true,
    isLooping: loop,
    volume: Math.max(0.05, Math.min(1, volume)),
  });
  toneSound = sound;
}

/** Dual-stem: user voice (or TTS) + Solfeggio / binaural carrier */
export async function playPillarAffirmation(
  pillar: ManifestPillar,
  voiceMix = 0.3
): Promise<void> {
  await stopManifestAudio();
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
  }).catch(() => undefined);

  const ambientVol = 1 - voiceMix;

  if (Platform.OS === 'web') {
    startWebTone(pillar.frequencyHz, ambientVol);
  } else {
    await playNativeTone(pillar.frequencyHz, ambientVol, true);
  }

  if (pillar.voiceUri) {
    const { sound } = await Audio.Sound.createAsync(
      { uri: pillar.voiceUri },
      { shouldPlay: true, volume: voiceMix, isLooping: true }
    );
    voiceSound = sound;
  } else {
    Speech.speak(pillar.voiceScript || pillar.identityScript, {
      rate: 0.9,
      pitch: 1.0,
    });
  }
}

/** Alias used by older call sites */
export const playPillarDualStem = playPillarAffirmation;

export async function playRealityLockAudio(
  pillar: ManifestPillar,
  voiceMix = 0.3,
  onCompanionLine?: () => void
): Promise<() => void> {
  await playPillarAffirmation(pillar, voiceMix);
  const t = setTimeout(() => {
    onCompanionLine?.();
  }, 50_000);
  return () => {
    clearTimeout(t);
    void stopManifestAudio();
  };
}
