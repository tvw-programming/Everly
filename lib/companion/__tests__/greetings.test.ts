import { dayPartForHour, GREETING_LANGUAGES, pickGreeting } from '../greetings';
import { buildRitualScript } from '../scripts';

describe('dayPartForHour', () => {
  it.each([
    [6, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [15, 'afternoon'],
    [17, 'evening'],
    [20, 'evening'],
    [22, 'night'],
    [3, 'night'],
  ])('maps %i:00 to %s', (hour, expected) => {
    expect(dayPartForHour(hour)).toBe(expected);
  });
});

describe('pickGreeting', () => {
  it('greets the afternoon in the afternoon, never the morning', () => {
    for (const rng of [0, 0.34, 0.67, 0.99]) {
      const greeting = pickGreeting('afternoon', () => rng);
      expect(greeting.text.toLowerCase()).not.toContain('morning');
      expect(greeting.dayPart).toBe('afternoon');
    }
  });

  it('offers Marathi, Sanskrit and English across repeated picks', () => {
    const seen = new Set(
      Array.from({ length: 30 }, (_, i) => pickGreeting('morning', () => i / 30).language)
    );
    expect(seen.size).toBeGreaterThan(1);
    for (const language of seen) {
      expect(GREETING_LANGUAGES).toContain(language);
    }
  });

  it('carries a Latin pronunciation alongside the Devanagari text', () => {
    const marathi = pickGreeting('morning', () => 0).text;
    const spoken = pickGreeting('morning', () => 0).speech;
    expect(spoken).toMatch(/^[\x20-\x7E]+$/);
    expect(marathi.length).toBeGreaterThan(0);
  });

  it('covers every day part in every language', () => {
    for (const part of ['morning', 'afternoon', 'evening', 'night'] as const) {
      for (let i = 0; i < GREETING_LANGUAGES.length; i++) {
        const g = pickGreeting(part, () => i / GREETING_LANGUAGES.length);
        expect(g.text.trim().length).toBeGreaterThan(0);
        expect(g.speech.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildRitualScript greeting', () => {
  const afternoon = new Date('2026-10-25T15:15:00');

  it('greets the afternoon at 3pm instead of defaulting to morning', () => {
    const script = buildRitualScript('morning', [], 'grounded', {
      now: afternoon,
      rng: () => 0.9, // english, so the assertion reads plainly
    });
    expect(script.text).toContain('Good afternoon');
    expect(script.text).not.toContain('Good morning');
  });

  it('speaks a Latin romanisation of a Devanagari greeting', () => {
    const script = buildRitualScript('morning', [], 'grounded', {
      now: afternoon,
      rng: () => 0, // marathi
    });
    expect(script.text).toContain('शुभ दुपार');
    expect(script.speech).toContain('Shubh dupaar');
    expect(script.speech).not.toContain('शुभ');
  });
});
