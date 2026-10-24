# Ideas Tab — Voice-First Second Brain

## Intent

Fast capture for every thought (personal / social / professional). Speak once → organized notes, tags, actions, reminders.

## Shipped in this slice

- `/ideas` dashboard with All · Personal · Social · Professional filters
- Weekly insight line
- Idea cards (category, title, summary, duration, tags, status, play)
- Mic FAB states: idle → listening → processing → saved
- Capture sheet (text/voice transcript) → multi-intent `organizeTranscript`
- Smart category/kind/tags/hooks/trade safeguards
- Detail sheet: summary, bullets, actions, companion, lifecycle, convert to reminder, pin to manifestation, archive/delete
- Seed ideas for architecture / LinkedIn / morning routine
- Dock: Home · Ideas · Manifest

## Queued next

- Native mic streaming + audio URI persistence / waveform / speed
- Routine Experiment Builder UI (7-day)
- Voice-to-content draft formats + tone modes
- Weekly Idea Review ritual
- Natural-language search
- Biometric locks + encrypted local audio + Private Mode
- Companion tone presets for Ideas

## Modules

`lib/ideas/{types,storage,organize,seeds}.ts`  
`components/ideas/*` · `app/ideas.tsx`
