import { alarmAudioUri, FALLBACK_TONE } from '../audioSource';
import type { AlarmReminder } from '../types';

type Audio = AlarmReminder['audio'];

describe('alarmAudioUri', () => {
  it('plays nothing for a silent reminder', () => {
    const audio: Audio = { source: 'silent', displayName: 'Silent' };
    expect(alarmAudioUri(audio)).toBeNull();
  });

  it('returns the bundled key so the packaged tone is used', () => {
    const audio: Audio = { source: 'bundled', bundledKey: 'soft-bell', displayName: 'Soft bell' };
    expect(alarmAudioUri(audio)).toBe('soft-bell');
  });

  it('returns the managed copy for a picked music file', () => {
    const audio: Audio = {
      source: 'local_file',
      managedPath: 'file:///data/alarms/a1.mp3',
      displayName: 'Morning Music',
    };
    expect(alarmAudioUri(audio)).toBe('file:///data/alarms/a1.mp3');
  });

  /** Acceptance criterion: missing audio falls back to a bundled tone. */
  it('falls back to a bundled tone when the managed file reference is gone', () => {
    const audio: Audio = { source: 'local_file', displayName: 'Morning Music' };
    expect(alarmAudioUri(audio)).toBe(FALLBACK_TONE);
  });

  it('falls back when a bundled reminder has no key recorded', () => {
    const audio: Audio = { source: 'bundled', displayName: 'Chime' };
    expect(alarmAudioUri(audio)).toBe(FALLBACK_TONE);
  });

  /** JS cannot reach the device's own alarm tone, so use a bundled one. */
  it('uses a bundled tone for the system default alarm source', () => {
    const audio: Audio = { source: 'default_alarm', displayName: 'Default alarm' };
    expect(alarmAudioUri(audio)).toBe(FALLBACK_TONE);
  });

  it('never returns an empty string', () => {
    const audio: Audio = { source: 'local_file', managedPath: '', displayName: 'Broken' };
    expect(alarmAudioUri(audio)).toBe(FALLBACK_TONE);
  });
});
