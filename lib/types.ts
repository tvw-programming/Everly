export type ReminderCategory = 'health' | 'daily_routine' | 'communication';

export type SoundMode = 'mp3' | 'tts';

export type ReminderSchedule = {
  time: string; // HH:mm
  daysOfWeek: number[]; // 0–6 (Sun–Sat); empty + date = one-shot
  date?: string; // YYYY-MM-DD for one-shot
};

export type ReminderSound = {
  mode: SoundMode;
  /** Bundled asset key (e.g. "chime") or a file:// URI from the device */
  assetUri: string;
  assetName: string;
};

export type Reminder = {
  id: string;
  title: string;
  notes?: string;
  category: ReminderCategory;
  schedule: ReminderSchedule;
  sound: ReminderSound;
  enabled: boolean;
  createdAt: string;
  notificationId?: string;
};

export type CategoryFilter = 'all' | ReminderCategory;

export const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  health: 'Health',
  daily_routine: 'Daily routine',
  communication: 'Communication',
};

export const CATEGORY_DESCRIPTIONS: Record<ReminderCategory, string> = {
  health: 'Medications, hydration, appointments',
  daily_routine: 'Wake-up, meals, chores, habits',
  communication: 'Calls, messages, check-ins',
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
