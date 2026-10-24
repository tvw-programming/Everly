# Companion Relational Engine — Plan (Phases 0–4)

Warm, proactive reinforcement layered on the zero-scroll reminder board.

## Shipped

- **P0–1:** Ambient avatar states, ritual morning/evening inbound notes, skippable TTS
- **P2 Mood:** Transcript + completion signals → `CompanionMood`; ritual/reaction scripts adapt
- **P2 Hype:** Pre-event interstitial for high-context tasks within window + haptics
- **P3 Follow-up:** Curious check-ins after completions (`scheduleFollowUpFast` / memory queue)
- **P3 Decompress:** Late-night / long-press avatar → vent → validate → optional task extract
- **P4 Sync:** Hydration + movement co-habit taps → Sync Score badge + unlock tiers

## Key modules

`lib/companion/{engine,scripts,types}.ts` · `components/{AmbientAvatar,WarmInboundBubble,HypeInterstitial,DecompressionRoom,SyncScoreBadge}.tsx`
