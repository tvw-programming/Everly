import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

let voiceSound: AudioPlayer | null = null;
let toneSound: AudioPlayer | null = null;
/**
 * Bumped by every stop. A play that started before the bump is stale: leaving
 * the screen mid-play must not leave an orphaned player running (and must not
 * hand a released player to the next stop).
 */
let generation = 0;

/** Release a player once; a released one throws if touched again. */
function release(player: AudioPlayer | null): void {
  if (!player) return;
  try {
    player.pause();
  } catch {
    // already released
  }
  try {
    player.remove();
  } catch {
    // already released
  }
}
let webToneCtx: AudioContext | null = null;
let webOsc: OscillatorNode | null = null;
let webGain: GainNode | null = null;

/** Release everything without claiming a new generation. */
function releaseAll(): void {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
  release(voiceSound);
  voiceSound = null;
  release(toneSound);
  toneSound = null;
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

/** Stop playback and invalidate any play still in flight. */
export async function stopManifestAudio(): Promise<void> {
  generation += 1;
  releaseAll();
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

function playNativeTone(hz: number, volume: number, loop: boolean, era: number) {
  const asset = TONE_ASSETS[hz] ?? TONE_ASSETS[432];
  if (!asset) return;
  const sound = createAudioPlayer(asset);
  if (era !== generation) {
    release(sound);
    return;
  }
  sound.loop = loop;
  sound.volume = Math.max(0.05, Math.min(1, volume));
  sound.play();
  toneSound = sound;
}

/** Dual-stem: user voice (or TTS) + Solfeggio / binaural carrier */
export async function playPillarAffirmation(
  pillar: ManifestPillar,
  voiceMix = 0.3
): Promise<void> {
  // Claim the slot before awaiting anything, so a stop that lands mid-play
  // (leaving the tab, say) is detected rather than racing us.
  const era = ++generation;
  releaseAll();

  // Playback is best-effort: a failure here must never reach the caller as an
  // unhandled rejection, because every call site fires it with `void`.
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
    }).catch(() => undefined);

    if (era !== generation) return;

    const ambientVol = 1 - voiceMix;

    if (Platform.OS === 'web') {
      startWebTone(pillar.frequencyHz, ambientVol);
    } else {
      playNativeTone(pillar.frequencyHz, ambientVol, true, era);
    }

    if (era !== generation) return;

    if (pillar.voiceUri) {
      const sound = createAudioPlayer({ uri: pillar.voiceUri });
      if (era !== generation) {
        release(sound);
        return;
      }
      sound.loop = true;
      sound.volume = voiceMix;
      sound.play();
      voiceSound = sound;
    } else {
      Speech.speak(pillar.voiceScript || pillar.identityScript, {
        rate: 0.9,
        pitch: 1.0,
      });
    }
  } catch {
    // leave the deck silent rather than crashing the screen
    await stopManifestAudio();
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
