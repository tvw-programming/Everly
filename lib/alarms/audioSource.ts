import type { AlarmReminder } from './types';

/**
 * Bundled tone used whenever the chosen audio cannot be reached — a moved or
 * deleted music file, or the system alarm tone, which JS cannot open.
 */
export const FALLBACK_TONE = 'chime';

/**
 * The asset the player should open for this reminder, in the form
 * `resolveSoundSource` understands: a bundled key, or a file URI.
 * `null` means play nothing.
 */
export function alarmAudioUri(audio: AlarmReminder['audio']): string | null {
  if (audio.source === 'silent') return null;
  if (audio.source === 'local_file') {
    return audio.managedPath?.trim() ? audio.managedPath : FALLBACK_TONE;
  }
  if (audio.source === 'bundled') {
    return audio.bundledKey?.trim() ? audio.bundledKey : FALLBACK_TONE;
  }
  return FALLBACK_TONE;
}
