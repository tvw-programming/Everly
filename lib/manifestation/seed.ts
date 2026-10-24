import type { ManifestPillar } from './types';

export const DEFAULT_IDENTITY_CODE =
  'I construct generational software & compound wealth';

export const PILLARS: ManifestPillar[] = [
  {
    id: 'personal',
    label: 'Personal',
    accent: '#22D3EE',
    identity:
      'My energy is infinite, my physical discipline is unbreakable, and my mind remains calm in any storm.',
    microStrip: 'Hydrated · Peak Body · Laser Clarity · Unshakeable Stillness',
    voiceScript:
      'I treat my body as a high-performance engine. I do not negotiate with fatigue; I refuel with intention.',
    companionHook:
      'You looked determined today. Take a deep sip of water right now—keep your physical energy untouchable.',
    frequencyHz: 528,
    toneAsset: require('../../assets/manifestation/tones/hz528.wav'),
    stillAsset: require('../../assets/manifestation/stills/personal.png'),
  },
  {
    id: 'social',
    label: 'Social',
    accent: '#F59E0B',
    identity:
      'I command respect by default. I attract world-class founders, elite peers, and deep, unwavering loyalty.',
    microStrip: 'High Status · Magnetism · Radical Honesty · Warm Authority',
    voiceScript:
      'Every room I enter is better because I am there. I listen deeply, speak with purpose, and give value first.',
    companionHook:
      'Your presence carries weight. Send that queued outreach with absolute confidence.',
    frequencyHz: 639,
    toneAsset: require('../../assets/manifestation/tones/hz639.wav'),
    stillAsset: require('../../assets/manifestation/stills/social.png'),
  },
  {
    id: 'economical',
    label: 'Economical',
    accent: '#EAB308',
    identity:
      'Capital flows to me in continuous, expanding streams. I preserve capital ruthlessly and compound relentlessly.',
    microStrip: 'Liquid Reserves · Cash Flow Positive · Asymmetric Upside · Freedom',
    voiceScript:
      'I do not chase money; I build asymmetric value that money chases. I am immune to panic and wealthy by design.',
    companionHook:
      'Market opens soon. Emotions off the tape. Stick to stop-loss and let targets hit.',
    frequencyHz: 888,
    toneAsset: require('../../assets/manifestation/tones/hz888.wav'),
    stillAsset: require('../../assets/manifestation/stills/economical.png'),
  },
  {
    id: 'professional',
    label: 'Professional',
    accent: '#10B981',
    identity:
      'I architect resilient, high-scale software with surgical precision. My systems convert into enterprise valuation.',
    microStrip: 'Clean Architectures · Sub-second Latency · Exit Valuation · Sovereignty',
    voiceScript:
      'I am an elite technical founder. Every system I design is robust, scalable, and built to dominate its vertical.',
    companionHook:
      'That refactor is the bridge to your acquisition goal. Ninety focused minutes—no looking away.',
    frequencyHz: 40,
    toneAsset: require('../../assets/manifestation/tones/hz40.wav'),
    stillAsset: require('../../assets/manifestation/stills/professional.png'),
  },
];
