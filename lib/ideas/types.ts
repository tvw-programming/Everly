export type IdeaCategory = 'personal' | 'social' | 'professional';

export type IdeaFilter = 'all' | IdeaCategory;

/** Full lifecycle — cards may show a shortened label */
export type IdeaStatus =
  | 'captured'
  | 'clarified'
  | 'exploring'
  | 'planned'
  | 'executing'
  | 'completed'
  | 'archived';

export type IdeaKind =
  | 'habit'
  | 'health'
  | 'routine_experiment'
  | 'mood'
  | 'manifestation'
  | 'content_idea'
  | 'relationship'
  | 'networking'
  | 'product_requirement'
  | 'architecture'
  | 'trade_research'
  | 'customer_feedback'
  | 'meeting'
  | 'research'
  | 'general';

export type IdeaNote = {
  id: string;
  category: IdeaCategory;
  kind: IdeaKind;
  title: string;
  summary: string;
  transcript: string;
  bullets: string[];
  actions: string[];
  tags: string[];
  status: IdeaStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  /** Seconds; 0 if text-only */
  durationSec: number;
  audioUri?: string;
  /** Social content extras */
  contentHook?: string;
  contentFormats?: string[];
  platforms?: string[];
  /** Professional / trading extras */
  projectName?: string;
  tradeSafeguard?: boolean;
  suggestedReminderAt?: string | null;
  linkedReminderIds?: string[];
  linkedManifestPillar?: 'personal' | 'social' | 'economical' | 'professional';
  relatedIdeaIds?: string[];
  companionLine?: string;
  excludeFromAi?: boolean;
  privateMode?: boolean;
};

export const IDEA_CATEGORY_META: Record<
  IdeaCategory,
  { label: string; accent: string; icon: string }
> = {
  personal: { label: 'Personal', accent: '#22D3EE', icon: '◉' },
  social: { label: 'Social', accent: '#F59E0B', icon: '◈' },
  professional: { label: 'Professional', accent: '#10B981', icon: '▣' },
};

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  captured: 'Captured',
  clarified: 'Clarified',
  exploring: 'Exploring',
  planned: 'Planned',
  executing: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

export const IDEA_KIND_LABEL: Record<IdeaKind, string> = {
  habit: 'Habit Idea',
  health: 'Health Observation',
  routine_experiment: 'Routine Experiment',
  mood: 'Mood Reflection',
  manifestation: 'Manifestation Insight',
  content_idea: 'Content Idea',
  relationship: 'Relationship Note',
  networking: 'Networking',
  product_requirement: 'Product Requirement',
  architecture: 'Architecture',
  trade_research: 'Trade Research',
  customer_feedback: 'Customer Feedback',
  meeting: 'Meeting Note',
  research: 'Research',
  general: 'General Idea',
};
