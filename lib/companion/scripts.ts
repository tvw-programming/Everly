import type { ReminderTask } from '../types';
import { CATEGORY_LABELS } from '../types';
import type { CompanionMood, CompanionRitual } from './types';

function topTitles(tasks: ReminderTask[], n = 2): string[] {
  return tasks
    .filter((t) => !t.completed && t.enabled)
    .slice(0, n)
    .map((t) => t.title);
}

export function buildRitualScript(
  ritual: CompanionRitual,
  tasks: ReminderTask[],
  mood: CompanionMood = 'grounded'
): string {
  const personal = topTitles(tasks.filter((t) => t.category === 'personal'));
  const social = topTitles(tasks.filter((t) => t.category === 'social'));
  const pro = topTitles(tasks.filter((t) => t.category === 'professional'));
  const highlights = [...pro, ...personal, ...social].slice(0, 2);
  const done = tasks.filter((t) => t.completed).length;
  const active = tasks.filter((t) => !t.completed && t.enabled).length;

  if (ritual === 'morning') {
    if (highlights.length === 0) {
      return mood === 'soothing'
        ? 'Good morning. The board is clear. Start with water, then we will choose one intentional win together.'
        : 'Good morning! Your board is clear. Grab water first—then we will pick one high-leverage move.';
    }
    const list = highlights.join(', and ');
    return mood === 'soothing'
      ? `Good morning. I am with you. Today includes ${list}. Breathe, hydrate, then take the first step.`
      : `Good morning! You have ${list} lined up. Let’s get your water in first. You’ve got this today.`;
  }

  // evening
  if (done === 0 && active === 0) {
    return 'Evening check-in. Quiet day on the board. Rest well—I will keep tomorrow ready.';
  }
  return `You moved ${done} goal${done === 1 ? '' : 's'} today${
    highlights.length ? `, and still holding ${highlights[0]}` : ''
  }. Put the screen down, hydrate, and rest. I will watch tomorrow’s schedule.`;
}

export function buildReactionLine(task: ReminderTask): string {
  const bucket = CATEGORY_LABELS[task.category];
  if (task.priority === 'p1') {
    return `Yes—${task.title} is done. That ${bucket} win matters.`;
  }
  return `Nice. ${task.title} checked off.`;
}

export function truncateScript(text: string, maxSeconds = 12): string {
  // Rough ~2.5 words/sec speaking rate → ~30 words for 12s
  const words = text.split(/\s+/);
  const maxWords = Math.max(12, Math.floor(maxSeconds * 2.5));
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ').replace(/[,.!?]?$/, '')}.`;
}
