export type TaskCategory = 'personal' | 'social' | 'professional' | 'financial';
export type TaskPriority = 'p1' | 'p2' | 'p3';

export type SubCategory =
  | 'hydration'
  | 'medication'
  | 'exercise'
  | 'manifestation'
  | 'content_post'
  | 'networking'
  | 'idea_capture'
  | 'trading'
  | 'dev_sprint'
  | 'client_ops'
  | 'general';

export type SoundMode = 'mp3' | 'tts';

export type ReminderSchedule = {
  time: string; // HH:mm
  daysOfWeek: number[]; // 0–6; empty + date = one-shot
  date?: string;
};

export type ReminderSound = {
  mode: SoundMode;
  assetUri: string;
  assetName: string;
};

/** Primary task model — aligns with FastAPI TaskItemBase */
export type ReminderTask = {
  id: string;
  title: string;
  notes?: string;
  category: TaskCategory;
  subCategory: SubCategory;
  priority: TaskPriority;
  schedule: ReminderSchedule;
  dueAt: string | null;
  contextTrigger?: string;
  sound: ReminderSound;
  enabled: boolean;
  completed: boolean;
  createdAt: string;
  notificationId?: string;
};

/** @deprecated alias kept for gradual migration */
export type Reminder = ReminderTask;
export type ReminderCategory = TaskCategory;
export type CategoryFilter = TaskCategory;

export type CategorySummary = {
  category: TaskCategory;
  accentColor: string;
  activeCount: number;
  completedCount: number;
  topTasks: ReminderTask[];
  overflowCount: number;
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  personal: 'Personal',
  social: 'Social',
  professional: 'Professional',
  financial: 'Financial',
};

export const CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  personal: 'Health, hydration, manifestation',
  social: 'Outreach, publishing, ideas',
  professional: 'Work, engineering, business',
  financial: 'Money, trading, bills, investments',
};

export const SUBCATEGORY_LABELS: Record<SubCategory, string> = {
  hydration: 'Hydration',
  medication: 'Medication',
  exercise: 'Exercise',
  manifestation: 'Manifestation',
  content_post: 'Content post',
  networking: 'Networking',
  idea_capture: 'Idea capture',
  trading: 'Trading',
  dev_sprint: 'Dev sprint',
  client_ops: 'Client ops',
  general: 'General',
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  p1: 0,
  p2: 1,
  p3: 2,
};
