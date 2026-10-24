export type ManifestPillarId = 'personal' | 'social' | 'economical' | 'professional';

export type ManifestPillar = {
  id: ManifestPillarId;
  label: string;
  accent: string;
  /** Present-tense primary identity declaration shown on the tile */
  identityScript: string;
  /** Short strip under the identity line */
  microStrip: string;
  /** Spoken Voice Echo script (recorded or TTS fallback) */
  voiceScript: string;
  /** Photoreal still used behind glassmorphism */
  stillUri: string;
  /** Optional looping micro-video URI */
  videoUri?: string;
  /** User-recorded affirmation URI */
  voiceUri?: string;
  /** Solfeggio / binaural carrier (Hz) */
  frequencyHz: number;
  companionHook: string;
  goalLabel?: string;
  visionPrompt?: string;
};

export type ManifestDeckState = {
  identityCode: string;
  auraScore: number;
  pillars: Record<ManifestPillarId, ManifestPillar>;
  /** 0–1 share for user voice vs ambient tone (default 0.3) */
  voiceMix: number;
};
