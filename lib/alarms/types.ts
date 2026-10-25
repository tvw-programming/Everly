export type AlarmCategory = 'personal' | 'social' | 'professional' | 'financial';

export type AlarmFrequency = 'once' | 'daily' | 'weekly';

export type AlarmAudioSource = 'default_alarm' | 'bundled' | 'local_file' | 'silent';

export type AlarmReminder = {
  id: string;
  title: string;
  description?: string;
  category: AlarmCategory;
  /** 1–12 */
  hour12: number;
  /** 0–59 */
  minute: number;
  period: 'AM' | 'PM';
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  frequency: AlarmFrequency;
  /** 0=Sun … 6=Sat; required when weekly */
  weekdays: number[];
  enabled: boolean;
  audio: {
    source: AlarmAudioSource;
    bundledKey?: string;
    displayName: string;
    managedPath?: string;
    durationMs?: number;
  };
  playback: {
    mode: 'once' | 'loop_until_stopped';
    maxRingMinutes: 1 | 5 | 10 | 30;
  };
  vibration: boolean;
  snoozeMinutes: 5 | 10 | 15 | 30;
  createdAt: string;
  updatedAt: string;
  /** Cached next fire (epoch ms) */
  nextFireAt?: number | null;
};

export const ALARM_CATEGORY_LABELS: Record<AlarmCategory, string> = {
  personal: 'Personal',
  social: 'Social',
  professional: 'Professional',
  financial: 'Financial',
};

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
