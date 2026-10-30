export type PracticeLanguage = 'mr' | 'en';
export type PracticeStatementType = 'manifest' | 'if-then' | 'reactive';
export type RotationBox = 1 | 2 | 3 | 4 | 5;

export type ScoreboardMetric =
  | 'deepWorkBlocks'
  | 'applications'
  | 'networkMessages'
  | 'demosPosted'
  | 'repoPushes'
  | 'saasSlices'
  | 'rejections';

export type PracticeStatement = {
  id: string;
  code: string; // M1, H1, R1…
  language: PracticeLanguage;
  type: PracticeStatementType;
  body: string;
  /** Cue text for if-then ("When I sit at my desk…") */
  cueText?: string;
  /** Then action for if-then */
  thenText?: string;
  sourcePath: string;
  active: boolean;
  onBench: boolean;
  rotationBox: RotationBox;
  nextDueAt: string | null; // ISO
  audioUri?: string | null;
  ladderRung?: 1 | 2 | 3 | 4 | null;
  ladderCondition?: string | null;
  cadence?: 'daily' | 'weekly' | 'reactive';
  weekdays?: number[]; // 0=Sun…6=Sat for weekly cues
  timerMinutes?: number | null;
  scoreMetric?: ScoreboardMetric | null;
  repCount: number;
  didntLandCount: number;
  retiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActiveSetCaps = {
  manifest: number;
  ifThen: number;
  reactive: number;
};

export const ACTIVE_CAPS: ActiveSetCaps = {
  manifest: 10,
  ifThen: 10,
  reactive: 3,
};

export type PracticeRep = {
  id: string;
  statementId: string;
  kind: 'manifest' | 'cue_start' | 'didnt_land' | 'silence' | 'voice_play';
  at: string;
};

export type ScoreboardWeek = {
  weekId: string; // YYYY-Www
  deepWorkBlocks: number;
  applications: number;
  networkMessages: number;
  demosPosted: number;
  repoPushes: number;
  saasSlices: number;
  rejections: number;
};

export const WEEKLY_TARGETS: Record<Exclude<ScoreboardMetric, 'rejections'>, number> = {
  deepWorkBlocks: 5,
  applications: 25,
  networkMessages: 10,
  demosPosted: 2,
  repoPushes: 1,
  saasSlices: 1,
};

export type WinsEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  createdAt: string;
};

export type WoopRecord = {
  id: string;
  createdAt: string;
  wish: string;
  outcome: string;
  obstacle: string;
  planIf: string;
  planThen: string;
  addedToActive?: boolean;
};

export type PracticeTriggerId =
  | 'MT1'
  | 'MT2'
  | 'MT6'
  | 'MT7'
  | 'MT8'
  | 'HT1'
  | 'HT2'
  | 'HT3'
  | 'HT4'
  | 'HT5'
  | 'HT6'
  | 'HT7'
  | 'HT8'
  | 'HT9'
  | 'HT10'
  | 'HT11'
  | 'HT12'
  | 'HT13';

export type ScheduledPracticeJob = {
  id: PracticeTriggerId;
  title: string; // notification title only
  hour: number;
  minute: number;
  weekdays?: number[] | null; // null/undefined = daily
  route: string;
  notificationId?: string;
};

export const ROTATION_INTERVAL_DAYS: Record<RotationBox, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};
