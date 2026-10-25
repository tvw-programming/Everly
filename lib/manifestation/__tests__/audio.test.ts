import { playPillarAffirmation, stopManifestAudio } from '../audio';
import type { ManifestPillar } from '../types';

type FakePlayer = {
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
  loop: boolean;
  volume: number;
  removed: boolean;
};

const mockPlayers: FakePlayer[] = [];
let mockCreateFails = false;
let mockAudioModeGate: Promise<void> = Promise.resolve();

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => {
    if (mockCreateFails) throw new Error('player could not be created');
    const player: FakePlayer = {
      loop: false,
      volume: 1,
      removed: false,
      play: jest.fn(),
      pause: jest.fn(function (this: FakePlayer) {
        // expo-audio throws when a released player is touched again
        if (player.removed) throw new Error('Unable to find the SharedObject');
      }),
      remove: jest.fn(() => {
        if (player.removed) throw new Error('Unable to find the SharedObject');
        player.removed = true;
      }),
    };
    mockPlayers.push(player);
    return player;
  }),
  setAudioModeAsync: jest.fn(() => mockAudioModeGate),
}));

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const pillar = {
  id: 'personal',
  label: 'Personal',
  identityScript: 'script',
  voiceScript: 'voice script',
  frequencyHz: 528,
  companionHook: 'hook',
  accent: '#FFFFFF',
} as unknown as ManifestPillar;

beforeEach(async () => {
  await stopManifestAudio();
  mockPlayers.length = 0;
  mockCreateFails = false;
  mockAudioModeGate = Promise.resolve();
});

describe('manifestation audio', () => {
  it('releases every player it created', async () => {
    await playPillarAffirmation(pillar, 0.3);
    expect(mockPlayers.length).toBeGreaterThan(0);

    await stopManifestAudio();

    expect(mockPlayers.every((p) => p.removed)).toBe(true);
  });

  it('survives being stopped twice', async () => {
    await playPillarAffirmation(pillar, 0.3);
    await stopManifestAudio();

    await expect(stopManifestAudio()).resolves.toBeUndefined();
  });

  it('leaves nothing playing when a stop lands mid-play', async () => {
    let openGate = () => undefined as void;
    mockAudioModeGate = new Promise<void>((resolve) => {
      openGate = () => resolve();
    });

    const playing = playPillarAffirmation(pillar, 0.3);
    await stopManifestAudio();
    openGate();
    await playing;

    expect(mockPlayers.every((p) => p.removed)).toBe(true);
  });

  it('does not reject when the player cannot be created', async () => {
    mockCreateFails = true;

    await expect(playPillarAffirmation(pillar, 0.3)).resolves.toBeUndefined();
  });
});
