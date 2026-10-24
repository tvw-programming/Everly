import type { SubCategory, TaskCategory, TaskPriority } from './types';

export type ParsedTaskDraft = {
  title: string;
  category: TaskCategory;
  subCategory: SubCategory;
  priority: TaskPriority;
  dueAt: string | null;
  time?: string;
  contextTrigger?: string;
  notes?: string;
};

export type ParseResult = {
  parsedItems: ParsedTaskDraft[];
  unresolvedNotes?: string;
};

const PERSONAL_HINTS: { re: RegExp; sub: SubCategory; priority?: TaskPriority }[] = [
  { re: /\b(water|hydrat|ml|liter|drink)\b/i, sub: 'hydration', priority: 'p2' },
  { re: /\b(meds?|medication|pill|dose|blood pressure)\b/i, sub: 'medication', priority: 'p1' },
  { re: /\b(workout|exercise|gym|run|yoga)\b/i, sub: 'exercise' },
  { re: /\b(manifest|mindset|affirm|zen|focus check)\b/i, sub: 'manifestation' },
];

const SOCIAL_HINTS: { re: RegExp; sub: SubCategory }[] = [
  { re: /\b(post|tweet|x\.com|linkedin|publish|clip|demo)\b/i, sub: 'content_post' },
  { re: /\b(outreach|network|call .+|message .+|follow up)\b/i, sub: 'networking' },
  { re: /\b(idea|thought|note to self|capture)\b/i, sub: 'idea_capture' },
];

const PRO_HINTS: { re: RegExp; sub: SubCategory; priority?: TaskPriority; trigger?: string }[] = [
  {
    re: /\b(nifty|trading|trade|options?|market|sensex|stocks?)\b/i,
    sub: 'trading',
    priority: 'p1',
    trigger: 'market_open_minus_15',
  },
  { re: /\b(deploy|sprint|pr\b|engineering|code|build|agent)\b/i, sub: 'dev_sprint', priority: 'p2' },
  { re: /\b(client|invoice|business|ops|meeting)\b/i, sub: 'client_ops' },
];

function extractTime(text: string): string | undefined {
  const ampm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = ampm[2] ? Number(ampm[2]) : 0;
    const period = ampm[3].toLowerCase();
    if (period === 'pm' && h < 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const twentyFour = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (twentyFour) {
    return `${String(Number(twentyFour[1])).padStart(2, '0')}:${twentyFour[2]}`;
  }
  return undefined;
}

function classifyChunk(chunk: string): ParsedTaskDraft {
  const title = chunk.replace(/\s+/g, ' ').trim().replace(/^[,.\s]+|[,.\s]+$/g, '');
  for (const hint of PERSONAL_HINTS) {
    if (hint.re.test(chunk)) {
      return {
        title,
        category: 'personal',
        subCategory: hint.sub,
        priority: hint.priority ?? 'p3',
        dueAt: null,
        time: extractTime(chunk),
      };
    }
  }
  for (const hint of SOCIAL_HINTS) {
    if (hint.re.test(chunk)) {
      return {
        title,
        category: 'social',
        subCategory: hint.sub,
        priority: 'p3',
        dueAt: null,
        time: extractTime(chunk),
      };
    }
  }
  for (const hint of PRO_HINTS) {
    if (hint.re.test(chunk)) {
      return {
        title,
        category: 'professional',
        subCategory: hint.sub,
        priority: hint.priority ?? 'p2',
        dueAt: null,
        time: extractTime(chunk),
        contextTrigger: hint.trigger,
      };
    }
  }
  return {
    title,
    category: 'personal',
    subCategory: 'general',
    priority: 'p3',
    dueAt: null,
    time: extractTime(chunk),
  };
}

/** Split multi-intent voice transcripts into atomic tasks (offline heuristic). */
export function parseTranscriptLocally(rawTranscript: string): ParseResult {
  const cleaned = rawTranscript.trim();
  if (!cleaned) return { parsedItems: [], unresolvedNotes: undefined };

  const parts = cleaned
    .split(/\band then\b|\band also\b|\balso\b|, and |,(?=\s)|;|\n/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);

  const chunks = parts.length > 1 ? parts : [cleaned];
  const parsedItems = chunks.map(classifyChunk).filter((i) => i.title.length > 0);

  return {
    parsedItems,
    unresolvedNotes: parsedItems.length === 0 ? cleaned : undefined,
  };
}
