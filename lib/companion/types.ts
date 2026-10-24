export type CompanionMood = 'calm' | 'hype' | 'soothing' | 'grounded';
export type CompanionVisualState = 'idle' | 'listening' | 'reacting' | 'speaking';

export type CompanionMemoryKind =
  | 'follow_up'
  | 'ritual'
  | 'vent'
  | 'celebration'
  | 'boundary';

export type CompanionMemoryEvent = {
  id: string;
  kind: CompanionMemoryKind;
  relatedTaskId?: string;
  prompt: string;
  scheduledFor: string;
  deliveredAt?: string;
  skipped?: boolean;
};

export type BioStateSnapshot = {
  at: string;
  stressScore: number;
  signals: Array<'rapid_speech' | 'late_night' | 'completion_streak' | 'idle_gap'>;
};

export type SyncScore = {
  sharedStreakDays: number;
  hydrationSyncs: number;
  movementSyncs: number;
  unlockTier: number;
};

export type CompanionRitual = 'morning' | 'evening';
