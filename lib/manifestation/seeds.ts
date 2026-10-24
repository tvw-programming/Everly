import type { ManifestDeckState, ManifestPillarId } from './types';

const STILLS: Record<ManifestPillarId, string> = {
  personal:
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&auto=format&fit=crop',
  social:
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80&auto=format&fit=crop',
  economical:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop',
  professional:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop',
};

export function createSeedDeck(): ManifestDeckState {
  return {
    identityCode: 'I construct generational software & compound wealth',
    auraScore: 72,
    voiceMix: 0.3,
    pillars: {
      personal: {
        id: 'personal',
        label: 'Personal',
        accent: '#22D3EE',
        identityScript:
          'My energy is infinite, my physical discipline is unbreakable, and my mind remains calm in any storm.',
        microStrip: 'Hydrated · Peak Vigor · Laser Clarity · Unshakeable Stillness',
        voiceScript:
          'I treat my body as a high-performance engine. I do not negotiate with fatigue; I refuel with intention.',
        stillUri: STILLS.personal,
        frequencyHz: 528,
        companionHook:
          'You looked determined during your run today. Take a deep sip of water right now—keep your physical energy untouchable.',
        goalLabel: 'High Vigor',
        visionPrompt:
          'Athletic physique after cold plunge at sunrise, misty trail, cinematic cyan light, photoreal',
      },
      social: {
        id: 'social',
        label: 'Social',
        accent: '#F59E0B',
        identityScript:
          'I command respect by default. I attract world-class founders, elite peers, and deep, unwavering loyalty.',
        microStrip: 'High Status · Magnetism · Radical Honesty · Warm Authority',
        voiceScript:
          'Every room I enter is better because I am there. I listen deeply, speak with purpose, and give value before asking for anything.',
        stillUri: STILLS.social,
        frequencyHz: 639,
        companionHook:
          'Your presence carries real weight. Send that queued networking message with absolute confidence—they would be lucky to build with you.',
        goalLabel: 'Respected Presence',
        visionPrompt:
          'Rooftop executive dinner, warm amber light, confident smile across the table, cinematic',
      },
      economical: {
        id: 'economical',
        label: 'Economical',
        accent: '#EAB308',
        identityScript:
          'Capital flows to me in continuous, expanding streams. I hold mastery over risk, preserve capital ruthlessly, and compound relentlessly.',
        microStrip: 'Liquid USD 2M+ · Cash Flow Positive · Asymmetric Upside · Freedom',
        voiceScript:
          'I do not chase money; I build asymmetric value that money chases. I am immune to panic, disciplined in execution, and wealthy by design.',
        stillUri: STILLS.economical,
        frequencyHz: 888,
        companionHook:
          'Market opens in 15 minutes. Take emotions off the tape. Your wealth plan is already written—stick to stop-loss and let targets hit.',
        goalLabel: 'Liquid USD 2M',
        visionPrompt:
          'Dark-mode brokerage dashboard in deep green profit, private aviation lounge, cinematic gold accents',
      },
      professional: {
        id: 'professional',
        label: 'Professional',
        accent: '#10B981',
        identityScript:
          'I architect resilient, high-scale software that operates with surgical precision. My systems convert into enterprise valuation.',
        microStrip: 'Clean Architectures · Sub-second Latency · Exit Ready · Sovereignty',
        voiceScript:
          'I am an elite technical founder. Every system I design is robust, scalable, and built to dominate its vertical. Distractions cannot penetrate my focus.',
        stillUri: STILLS.professional,
        frequencyHz: 40,
        companionHook:
          'That backend refactor is the bridge to your US acquisition goal. Ninety undistracted minutes—now.',
        goalLabel: 'Architecture → Exit',
        visionPrompt:
          'Dual curved monitors with pristine architecture diagrams, signed buyout term sheet, emerald cinematic light',
      },
    },
  };
}
