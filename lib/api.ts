import { parseTranscriptLocally, type ParseResult } from './parser';

const DEFAULT_API = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:18765';

export async function parseVoiceTranscript(
  rawTranscript: string,
  audioDurationSeconds = 0
): Promise<ParseResult> {
  try {
    const res = await fetch(`${DEFAULT_API}/v1/voice/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_transcript: rawTranscript,
        audio_duration_seconds: audioDurationSeconds,
        device_timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as {
      parsed_items: Array<{
        title: string;
        category: ParseResult['parsedItems'][0]['category'];
        sub_category: ParseResult['parsedItems'][0]['subCategory'];
        priority: ParseResult['parsedItems'][0]['priority'];
        due_at: string | null;
        context_trigger?: string | null;
      }>;
      unresolved_notes?: string | null;
    };
    return {
      parsedItems: data.parsed_items.map((item) => ({
        title: item.title,
        category: item.category,
        subCategory: item.sub_category,
        priority: item.priority,
        dueAt: item.due_at,
        contextTrigger: item.context_trigger ?? undefined,
      })),
      unresolvedNotes: data.unresolved_notes ?? undefined,
    };
  } catch {
    // Offline / backend down — local heuristic router
    return parseTranscriptLocally(rawTranscript);
  }
}
