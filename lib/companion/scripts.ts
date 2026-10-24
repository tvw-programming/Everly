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

  if (done === 0) {
    return 'Evening check-in. Quiet day on the board. Rest well—I will keep tomorrow ready.';
  }
  return `You moved ${done} goal${done === 1 ? '' : 's'} today${
    highlights.length ? `, and still holding ${highlights[0]}` : ''
  }. Put the screen down, hydrate, and rest. I will watch tomorrow’s schedule.`;
}

export function buildReactionLine(task: ReminderTask, mood: CompanionMood = 'calm'): string {
  if (mood === 'hype' || task.priority === 'p1') {
    return `Yes! ${task.title} is done. That ${CATEGORY_LABELS[task.category]} win matters—you earned it.`;
  }
  if (mood === 'soothing') {
    return `Steady progress. ${task.title} is checked. Breathe—next step when you are ready.`;
  }
  return `Nice. ${task.title} checked off.`;
}

export function buildHypeScript(task: ReminderTask): string {
  if (task.subCategory === 'trading' || task.contextTrigger?.includes('market')) {
    return `Ten minutes out. Stick to your risk rules. This setup does not need rush—clear mind, then execute ${task.title}.`;
  }
  if (task.category === 'professional') {
    return `Remember why we are building this. Your skills are solid. Noise cannot distract you from ${task.title}. Clear your mind.`;
  }
  return `Focus window. One breath, then ${task.title}. You already know the next right move.`;
}

export function buildFollowUpScript(task: ReminderTask): string {
  const title = task.title;
  if (/client|contract|pricing|negotiat/i.test(title)) {
    return `Hey—how did that conversation go? Did they accept the terms, or do we need to recalibrate?`;
  }
  if (/dentist|doctor|appointment|interview/i.test(title)) {
    return `Checking in—how did ${title} go? Want me to capture any follow-ups?`;
  }
  if (/deploy|refactor|sprint|ship/i.test(title)) {
    return `How did ${title} land? Anything still smoking that we should park for tomorrow?`;
  }
  return `Quick pulse—how did ${title} go? I am here if you want to unload or turn leftovers into tasks.`;
}

export function buildStressAck(transcript: string): string {
  if (/trade|nifty|market|options/i.test(transcript)) {
    return 'Take a breath. Stick to your risk management rules. Do not rush this setup.';
  }
  return 'I hear the pace. Slow the next sentence—we will sort this without force.';
}

export function buildLateNightBoundary(): string {
  return "Hey, you have been at this a long time. Close the laptop. Social can wait until morning. I will hold the board.";
}

export function buildVentValidation(transcript: string): string {
  const short = transcript.trim().slice(0, 80);
  return `That is a lot of pressure to hold alone${short ? '' : ''}. Look how far the system has come. Want me to turn those worries into three actionable tasks for tomorrow so you can rest?`;
}

export function buildCoHabitLine(kind: 'hydration' | 'movement'): string {
  if (kind === 'hydration') {
    return "I am having my glass of water right now—go grab yours and tap the ring so we stay on track.";
  }
  return 'Time for our movement break. Step away from the monitors—tap when you are moving with me.';
}

export function truncateScript(text: string, maxSeconds = 12): string {
  const words = text.split(/\s+/);
  const maxWords = Math.max(12, Math.floor(maxSeconds * 2.5));
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ').replace(/[,.!?]?$/, '')}.`;
}

export function detectRapidSpeech(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const commas = (text.match(/,/g) || []).length;
  const avgWordLen =
    words.reduce((n, w) => n + w.length, 0) / Math.max(1, words.length);
  return words.length >= 8 && (avgWordLen <= 4.2 || commas >= 3);
}

export function isHighContextTask(task: ReminderTask): boolean {
  return (
    task.priority === 'p1' ||
    /client|contract|dentist|doctor|interview|deploy|negotiat|pricing|pitch/i.test(
      task.title
    )
  );
}
