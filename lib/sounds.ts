export type BundledSound = {
  key: string;
  name: string;
  description: string;
  source: number;
};

/** Bundled demo MP3s — keys are stored in Reminder.sound.assetUri when not a file URI */
export const BUNDLED_SOUNDS: BundledSound[] = [
  {
    key: 'chime',
    name: 'Chime',
    description: 'Bright single tone',
    source: require('../assets/sounds/chime.mp3'),
  },
  {
    key: 'soft-bell',
    name: 'Soft bell',
    description: 'Gentle longer tone',
    source: require('../assets/sounds/soft_bell.mp3'),
  },
  {
    key: 'alert-tone',
    name: 'Alert tone',
    description: 'Clear attention cue',
    source: require('../assets/sounds/alert_tone.mp3'),
  },
];

export function isBundledSoundKey(uri: string): boolean {
  return BUNDLED_SOUNDS.some((s) => s.key === uri);
}

export function resolveSoundSource(assetUri: string): number | { uri: string } {
  const bundled = BUNDLED_SOUNDS.find((s) => s.key === assetUri);
  if (bundled) return bundled.source;
  return { uri: assetUri };
}

export function getBundledSoundName(key: string): string | undefined {
  return BUNDLED_SOUNDS.find((s) => s.key === key)?.name;
}
