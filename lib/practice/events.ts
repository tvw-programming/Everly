/**
 * Lightweight practice event bus — logging a rejection, finishing a timer,
 * writing a wins line, or completing applications can raise a trigger.
 */
type Handler = (payload?: Record<string, unknown>) => void;

const listeners = new Map<string, Set<Handler>>();

export type PracticeEvent =
  | 'rejection_logged'
  | 'timer_ended'
  | 'wins_written'
  | 'apps_sent_5'
  | 'cue_started'
  | 'session_complete'
  | 'behind_pace';

export function onPracticeEvent(event: PracticeEvent, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function emitPracticeEvent(
  event: PracticeEvent,
  payload?: Record<string, unknown>
): void {
  const set = listeners.get(event);
  if (!set) return;
  for (const h of set) {
    try {
      h(payload);
    } catch {
      // never break callers
    }
  }
}
