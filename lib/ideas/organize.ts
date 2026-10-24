import type { IdeaCategory, IdeaKind, IdeaNote } from './types';

function uid(): string {
  return `idea_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function splitIntents(raw: string): string[] {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/\band also\b|\balso\b|;|\.(?=\s+[A-Z])|,(?=\s+(?:I |remind|also|and ))/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 8);
  return parts.length ? parts : [cleaned];
}

function detectCategory(text: string): IdeaCategory {
  if (
    /\b(linkedin|tweet|thread|youtube|post|content|video|hook|carousel|network|follow.?up|relationship)\b/i.test(
      text
    )
  ) {
    return 'social';
  }
  if (
    /\b(postgres|redis|fastapi|agent|architecture|sprint|dashboard|client|trading|stock|buy|sell|revenue|saas|backend|frontend|deploy)\b/i.test(
      text
    )
  ) {
    return 'professional';
  }
  if (
    /\b(water|hydrat|workout|exercise|sleep|phone|morning|mood|calm|manifest|meditat|habit|nutrition)\b/i.test(
      text
    )
  ) {
    return 'personal';
  }
  if (/\b(idea for|should post|make a video)\b/i.test(text)) return 'social';
  if (/\b(we should|product|feature|customer)\b/i.test(text)) return 'professional';
  return 'personal';
}

function detectKind(text: string, category: IdeaCategory): IdeaKind {
  if (category === 'social') {
    if (/\b(rohit|follow.?up|message|check.?in|networking)\b/i.test(text)) return 'relationship';
    return 'content_idea';
  }
  if (category === 'professional') {
    if (/\b(buy|sell|stock|nifty|options?|breakout|trade)\b/i.test(text)) return 'trade_research';
    if (/\b(architecture|redis|postgres|memory|latency|pool)\b/i.test(text)) return 'architecture';
    if (/\b(customer|feedback|onboarding)\b/i.test(text)) return 'customer_feedback';
    if (/\b(meeting|standup)\b/i.test(text)) return 'meeting';
    return 'product_requirement';
  }
  if (/\b(manifest|confident|calm|affirm)\b/i.test(text)) return 'manifestation';
  if (/\b(feel|mood|distract|scroll)\b/i.test(text)) return 'mood';
  if (/\b(habit|routine|experiment|7.?day|before coding)\b/i.test(text)) return 'routine_experiment';
  if (/\b(workout|hydrat|sleep|nutrition)\b/i.test(text)) return 'health';
  return 'habit';
}

function titleFrom(text: string, kind: IdeaKind): string {
  const clipped = text.replace(/\s+/g, ' ').trim();
  if (kind === 'content_idea' && /\blinkedin|post|video|thread\b/i.test(clipped)) {
    const about = clipped.match(/about\s+(.+?)(?:\.|$)/i)?.[1];
    if (about) return `Content: ${about.slice(0, 64)}`;
  }
  if (kind === 'trade_research') return 'Trade research card';
  if (kind === 'architecture' && /\bmemory\b/i.test(clipped)) {
    return 'Improve agent memory architecture';
  }
  const first = clipped.split(/[.!?]/)[0] ?? clipped;
  return first.length > 72 ? `${first.slice(0, 69)}…` : first;
}

function summarize(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= 140) return t;
  return `${t.slice(0, 137)}…`;
}

function bulletsFrom(text: string, kind: IdeaKind): string[] {
  const base = [
    text.length > 100 ? `${text.slice(0, 90)}…` : text,
  ];
  if (kind === 'architecture') {
    return [
      'Capture short-term context separately from durable knowledge.',
      'Measure memory cost per user and workflow.',
      'Validate retrieval quality with benchmarks.',
    ];
  }
  if (kind === 'content_idea') {
    return [
      'Lead with a sharp founder hook.',
      'Keep one clear takeaway per format.',
      'End with a concrete call to action.',
    ];
  }
  if (kind === 'trade_research') {
    return [
      'Write entry thesis before any order.',
      'Define stop loss, target, and size.',
      'Confirm market condition checklist.',
    ];
  }
  if (kind === 'routine_experiment') {
    return [
      'Run a 7-day controlled experiment.',
      'Track energy and deep-work quality daily.',
      'Review results at week end.',
    ];
  }
  return base.slice(0, 3);
}

function actionsFrom(kind: IdeaKind, category: IdeaCategory): string[] {
  if (kind === 'content_idea') {
    return ['Draft hook', 'Choose format', 'Schedule publish window'];
  }
  if (kind === 'trade_research') {
    return ['Fill thesis card', 'Set risk rules', 'Wait for confirmation — do not impulse trade'];
  }
  if (kind === 'architecture' || kind === 'product_requirement') {
    return ['Create architecture note', 'Add to backend sprint', 'Estimate cost/impact'];
  }
  if (kind === 'routine_experiment') {
    return ['Start 7-day experiment', 'Set morning reminder', 'Add end-of-day reflection'];
  }
  if (category === 'personal') {
    return ['Link to Personal pillar', 'Optional daily reminder'];
  }
  return ['Clarify next step', 'Convert to reminder if actionable'];
}

function tagsFrom(text: string, category: IdeaCategory, kind: IdeaKind): string[] {
  const tags = new Set<string>();
  if (category === 'personal') tags.add('Health');
  if (category === 'social') tags.add('Content');
  if (category === 'professional') tags.add('Execution');
  if (/\bpostgres|postgresql\b/i.test(text)) tags.add('PostgreSQL');
  if (/\bredis\b/i.test(text)) tags.add('Redis');
  if (/\bagents?\b/i.test(text)) tags.add('AI-Agents');
  if (/\blangchain\b/i.test(text)) tags.add('LangChain');
  if (/\blinkedin\b/i.test(text)) tags.add('LinkedIn');
  if (/\bmanifest\b/i.test(text)) tags.add('Manifestation');
  if (/\bworkout|exercise\b/i.test(text)) tags.add('Workout');
  if (/\btrading|stock|nifty\b/i.test(text)) tags.add('Trading');
  if (/\barchitecture\b/i.test(text)) tags.add('Architecture');
  if (kind === 'content_idea') tags.add('Content');
  if (/\bhigh.?priority|urgent\b/i.test(text)) tags.add('HighPriority');
  return Array.from(tags).slice(0, 6);
}

function socialExtras(text: string) {
  if (!/\b(post|linkedin|video|thread|content)\b/i.test(text)) return {};
  return {
    contentHook: /macbook|local/i.test(text)
      ? 'My MacBook runs my coding copilot locally — no expensive cloud bill.'
      : 'AI startups do not need a 20-person engineering team before finding product-market fit.',
    contentFormats: ['X thread', 'LinkedIn opinion post', '60-second vertical video', 'Founder carousel'],
    platforms: ['X', 'LinkedIn', 'YouTube'].filter((p) =>
      p === 'YouTube' ? /video|youtube/i.test(text) : true
    ),
  };
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function companionFor(kind: IdeaKind, title: string): string {
  if (kind === 'trade_research') {
    return 'I parked this as research only — fill the risk card before any tape action.';
  }
  if (kind === 'content_idea') {
    return `That sounds publishable. Want a draft hook for “${title.slice(0, 40)}”?`;
  }
  if (kind === 'routine_experiment') {
    return 'Would you like to test this routine for 7 days?';
  }
  return 'Saved and organized. Want me to turn it into an action plan?';
}

/** Split a free-form transcript into organized IdeaNote drafts (persisted by caller). */
export function organizeTranscript(
  raw: string,
  opts?: { durationSec?: number; audioUri?: string }
): IdeaNote[] {
  const chunks = splitIntents(raw);
  const now = new Date().toISOString();
  return chunks.map((chunk) => {
    const category = detectCategory(chunk);
    const kind = detectKind(chunk, category);
    const title = titleFrom(chunk, kind);
    const trade = kind === 'trade_research';
    const reminder =
      /\bremind|tomorrow|due\b/i.test(chunk) || kind === 'routine_experiment'
        ? tomorrowIso()
        : null;
    return {
      id: uid(),
      category,
      kind,
      title,
      summary: summarize(chunk),
      transcript: chunk,
      bullets: bulletsFrom(chunk, kind),
      actions: actionsFrom(kind, category),
      tags: tagsFrom(chunk, category, kind),
      status: 'clarified',
      priority: trade || /\bhigh|urgent|customer\b/i.test(chunk) ? 'high' : 'medium',
      createdAt: now,
      updatedAt: now,
      durationSec: opts?.durationSec ?? Math.max(8, Math.round(chunk.split(/\s+/).length / 2.5)),
      audioUri: opts?.audioUri,
      ...socialExtras(chunk),
      projectName:
        kind === 'product_requirement' && /\bagent\b/i.test(chunk)
          ? 'Client Documentation Agent'
          : undefined,
      tradeSafeguard: trade,
      suggestedReminderAt: reminder,
      linkedReminderIds: [],
      linkedManifestPillar:
        category === 'personal'
          ? 'personal'
          : category === 'social'
            ? 'social'
            : 'professional',
      companionLine: companionFor(kind, title),
    };
  });
}

export function weekInsight(ideas: IdeaNote[]): string {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = ideas.filter((i) => new Date(i.createdAt).getTime() >= weekAgo);
  const actionable = recent.filter((i) =>
    ['clarified', 'planned', 'exploring'].includes(i.status)
  );
  if (recent.length === 0) {
    return 'Capture your first voice idea — I will sort Personal, Social, and Professional for you.';
  }
  return `You captured ${recent.length} idea${recent.length === 1 ? '' : 's'} this week. ${actionable.length} ${
    actionable.length === 1 ? 'is' : 'are'
  } ready to become actions.`;
}
