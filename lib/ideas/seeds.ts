import type { IdeaNote } from './types';

export function createSeedIdeas(): IdeaNote[] {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  return [
    {
      id: 'seed_arch',
      category: 'professional',
      kind: 'architecture',
      title: 'Improve agent memory architecture',
      summary:
        'Use short-term Redis memory plus PostgreSQL long-term memory for customer context.',
      transcript:
        'For agent memory we should use Redis for short-term conversation context and PostgreSQL for durable customer knowledge with embeddings for retrieval.',
      bullets: [
        'Use Redis for short-term active conversation context.',
        'Use PostgreSQL for durable customer and project knowledge.',
        'Add embeddings for semantic retrieval.',
        'Track memory cost per user and workflow.',
      ],
      actions: [
        'Create architecture document.',
        'Add task to backend sprint.',
        'Create benchmark test for response quality.',
      ],
      tags: ['LangChain', 'Architecture', 'HighPriority', 'AI-Agents', 'PostgreSQL'],
      status: 'clarified',
      priority: 'high',
      createdAt: iso(80),
      updatedAt: iso(80),
      durationSec: 48,
      projectName: 'Agent Memory Layer',
      companionLine: 'High potential — ready for a 30-minute architecture focus block?',
      linkedReminderIds: [],
      linkedManifestPillar: 'professional',
    },
    {
      id: 'seed_linkedin',
      category: 'social',
      kind: 'content_idea',
      title: 'LinkedIn: solo founders with AI agents',
      summary: 'Post about how one developer can run a company with AI agents.',
      transcript:
        'I have an idea for LinkedIn. I should post about how one developer can now run a company with AI agents.',
      bullets: [
        'Validate demand before scaling headcount.',
        'Use AI agents for repetitive execution.',
        'Keep humans on strategy and customer insight.',
      ],
      actions: ['Draft hook', 'Choose LinkedIn vs X thread', 'Schedule publish'],
      tags: ['LinkedIn', 'Content', 'AI-Agents'],
      status: 'exploring',
      priority: 'medium',
      createdAt: iso(200),
      updatedAt: iso(200),
      durationSec: 32,
      contentHook:
        'AI startups do not need a 20-person engineering team before finding product-market fit.',
      contentFormats: ['LinkedIn opinion post', 'X thread', '60-second vertical video'],
      platforms: ['LinkedIn', 'X'],
      companionLine: 'Want a founder-authority draft of this hook?',
      linkedReminderIds: [],
      linkedManifestPillar: 'social',
    },
    {
      id: 'seed_morning',
      category: 'personal',
      kind: 'routine_experiment',
      title: 'No-phone first hour after waking',
      summary: 'Avoid phone use during the first hour after waking for clearer energy.',
      transcript:
        'I feel more energetic when I stop using my phone for the first hour after waking up.',
      bullets: [
        'Park phone outside the bedroom.',
        'Hydrate and move before screens.',
        'Journal one intention before unlocking.',
      ],
      actions: ['Start a 7-day morning focus experiment', 'Set morning reminder'],
      tags: ['Health', 'Habit', 'Manifestation'],
      status: 'planned',
      priority: 'medium',
      createdAt: iso(1400),
      updatedAt: iso(1400),
      durationSec: 21,
      companionLine: 'Would you like to test this routine for 7 days?',
      suggestedReminderAt: new Date(now + 24 * 3600_000).toISOString(),
      linkedReminderIds: [],
      linkedManifestPillar: 'personal',
    },
  ];
}
