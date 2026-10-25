export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export type GreetingLanguage = 'marathi' | 'sanskrit' | 'english';

export const GREETING_LANGUAGES: GreetingLanguage[] = ['marathi', 'sanskrit', 'english'];

export type Greeting = {
  dayPart: DayPart;
  language: GreetingLanguage;
  /** Shown in the bubble, in its own script */
  text: string;
  /** Latin spelling handed to text-to-speech, which has no Devanagari voice by default */
  speech: string;
};

/**
 * Greetings per language and part of day. `text` is what the companion shows;
 * `speech` is a romanisation, because device TTS reads Devanagari poorly
 * without a Marathi voice installed.
 */
const GREETINGS: Record<GreetingLanguage, Record<DayPart, { text: string; speech: string }>> = {
  marathi: {
    morning: { text: 'शुभ सकाळ', speech: 'Shubh sakaal' },
    afternoon: { text: 'शुभ दुपार', speech: 'Shubh dupaar' },
    evening: { text: 'शुभ संध्याकाळ', speech: 'Shubh sandhyakaal' },
    night: { text: 'शुभ रात्री', speech: 'Shubh ratri' },
  },
  sanskrit: {
    morning: { text: 'सुप्रभातम्', speech: 'Suprabhatam' },
    afternoon: { text: 'शुभ मध्याह्नम्', speech: 'Shubha madhyahnam' },
    evening: { text: 'शुभ सायंकालम्', speech: 'Shubha sayankalam' },
    night: { text: 'शुभ रात्रिः', speech: 'Shubha ratrih' },
  },
  english: {
    morning: { text: 'Good morning', speech: 'Good morning' },
    afternoon: { text: 'Good afternoon', speech: 'Good afternoon' },
    evening: { text: 'Good evening', speech: 'Good evening' },
    night: { text: 'Good night', speech: 'Good night' },
  },
};

export function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function dayPartFor(now: Date = new Date()): DayPart {
  return dayPartForHour(now.getHours());
}

/** One greeting for this part of the day, in a language chosen at random. */
export function pickGreeting(dayPart: DayPart, rng: () => number = Math.random): Greeting {
  const index = Math.min(
    GREETING_LANGUAGES.length - 1,
    Math.max(0, Math.floor(rng() * GREETING_LANGUAGES.length))
  );
  const language = GREETING_LANGUAGES[index];
  return { dayPart, language, ...GREETINGS[language][dayPart] };
}
