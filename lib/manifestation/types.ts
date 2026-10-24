export type ManifestPillarId = 'personal' | 'social' | 'economical' | 'professional';

export type ManifestPillar = {
  id: ManifestPillarId;
  label: string;
  accent: string;
  identity: string;
  microStrip: string;
  voiceScript: string;
  companionHook: string;
  frequencyHz: number;
  toneAsset: number;
  stillAsset: number;
  /** Optional local recorded voice URI */
  voiceUri?: string;
  /** Optional custom still URI / remote */
  customStillUri?: string;
  visionPrompt?: string;
};

export type RealityLockSession = {
  pillarId: ManifestPillarId;
  startedAt: string;
};
