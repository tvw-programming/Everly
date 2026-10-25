# AI Companion, Voice-First Capture, AI Productivity and Accessibility UX (2025–2026) for Everly

Research date: 2026-10-25. Dated items are labeled. Where a source is a vendor page, a beta or APK teardown, or a secondary blog, that is noted.

## Q1. AI companion UI: presentation, proactive nudges, trust and transparency

### Takeaway
The big assistants are moving away from a full-screen, mascot-like "orb" toward lighter presences that sit inside the user's context:
- ChatGPT moved voice into the chat thread with a live transcript (Nov 2025).
- Gemini Live moved from full screen to a floating pill or circle (2026).
- Siri moved from an orb to a screen-edge glow that responds to the voice.

Pet-style companions such as Finch keep users through warmth, forgiveness and a reason to come back, not through guilt. Apple's generative AI HIG (updated June 2026), Microsoft HAX's 18 guidelines and Google PAIR give the same trust recipe:
- disclose where AI is used
- keep the user in control
- dismiss, undo and retry next to the output
- confirm before significant or irreversible actions
- specific progress messages
- voluntary feedback
- time proactive help to context

### Cited Findings
**How companions are presented**
- **ChatGPT (Nov 25, 2025):** OpenAI moved Voice Mode into the regular chat window on mobile and web, so the separate blue-orb screen is no longer needed. Voice now shows a live transcript during the conversation and can show rich content (weather, maps) in the same chat — [Android Authority](https://www.androidauthority.com/chatgpt-voice-mode-in-chat-3619633)
- **ChatGPT orb fallback:** the orb ("Separate Mode") can still be turned back on in Settings → Voice. It is no longer the default — [qwe.edu.pl tutorial](https://www.qwe.edu.pl/tutorial/how-to-use-chatgpt-voice-mode/); [all-ai.de](https://www.all-ai.de/news/news24/chatgpt-voice-change.md)
- **ChatGPT on macOS:** reported that standalone voice mode would be removed from the macOS app on Jan 15, 2026. Not confirmed by OpenAI in the sources found — [Profesional Review](https://www.profesionalreview.com/2025/12/22/chatgpt-eliminara-el-modo-de-voz-de-su-aplicacion-para-macos-a-principios-de-2026/)
- **Gemini Live (Feb–Apr 2026):** the full-screen Live UI is being replaced by a floating interface:
  - captions sit in the top-right
  - the overlay shrinks to a small circle while the user keeps using the phone
  - the overlay has a waveform animation in the centre during voice input
  - the mic is an outline icon, and "+" opens a bottom sheet of attachments and tools

  Based on beta builds and APK teardowns, so the shipped design may differ — [9to5Google Apr 2026](https://9to5google.com/2026/04/07/gemini-live-redesign-android/); [9to5Google Feb 2026](https://9to5google.com/2026/02/28/gemini-live-floating-redesign/); [Android Authority](https://www.androidauthority.com/gemini-overlay-and-live-ui-changes-3655577/)
- **Siri with Apple Intelligence (iOS 18.1+, late 2024, older info):**
  - The floating orb was replaced with a rainbow glow around the screen edge — [SlashGear](https://www.slashgear.com/1865686/iphone-glowing-around-edges-reason/)
  - The glow reacts to the sound of the user's voice. Holding the side button sends light from that edge, while voice activation brings the glow up from the bottom — [9to5Mac](https://9to5mac.com/2024/11/03/new-apple-intelligence-siri-looks-different-works-the-same/)
  - 9to5Mac warned that the new look did not mean Siri's abilities had improved much. This is a cautionary point about visual polish getting ahead of capability — [9to5Mac](https://9to5mac.com/2024/11/03/new-apple-intelligence-siri-looks-different-works-the-same/)

**Finch (pet companion)**
- The home-screen widget keeps the pet visible and makes it seem to "live a life" while the user is away, which builds emotional investment — [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- Finch's "Adventuring" starts once the user finishes enough self-care tasks for the day. This is an "appointment mechanic", a timed reason to return borrowed from games — [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- Reminders are framed as caring for the pet rather than as self-care chores. Source is a messaging vendor's gallery, i.e. marketing — [Reteno gallery](https://gallery.reteno.com/flows/push-notifications-finch)
- The design is forgiving: users set their own reminders, and if they stop visiting, the bird is still happy to see them when they return — [IU School of Medicine wellness blog](https://geneticslab.medicine.iu.edu/blogs/md-student-news/wellness-corner-a-digital-pet-is-your-self-care-best-friend)
- Finch's privacy practices have been reviewed by Mozilla's *Privacy Not Included* (relevant for mood and wellness data) — [Mozilla Foundation](https://www.mozillafoundation.org/en/privacynotincluded/finch-self-care-pet/)

**Lessons from Rabbit and Humane**
- The Humane AI Pin bet on no screen: voice plus a palm laser projection. Reviewers called it ergonomically poor and slow, with unreliable hardware and a steep $24/month subscription on top of $700 — [SlashGear](https://www.slashgear.com/2026417/worst-ai-devices-ever-made-users-say); [Jason Deegan blog](https://jasondeegan.com/why-humanes-ai-pin-and-rabbit-r1-both-flopped-spectacularly/)
- The Rabbit R1's "Large Action Model" voice-to-app actions did not work well in early tests — [heise](https://heise.de/-9701308)
- Rushing hardware out was a recurring failure — [TechRadar](https://www.techradar.com/computing/artificial-intelligence/with-the-humane-ai-pin-now-dead-what-does-the-rabbit-r1-need-to-do-to-survive)
- A new AI surface must offer something the phone cannot easily provide — [ubikstu substack](https://ubikstu.substack.com/p/the-missteps-of-ai-hardware)

These sources are commentary or blogs.

**Apple HIG: Generative AI page** (new June 9, 2025; updated June 8, 2026 with guidance on refining results and feedback during generation) — [Apple HIG Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai)
- **Control:** "Keep people in control… Give them the ability to dismiss new content they don't want, and revert or retry content transformations or other actions they don't agree with. Clearly identify when and where you use AI."
- **Disclosure:** "Never trick someone into thinking they're interacting with or viewing content authored by a human if they're actually interacting with AI." This is directly relevant to a persona or avatar companion.
- **Confirmation:** "Avoid automating destructive actions… Generally, ask for confirmation before performing a significant action on someone's behalf."
- **Refine and revert:** surface "Edit, Undo, Retry, or Adjust near generated content", and "provide a clear signal that their action had an effect."
- **Progress messages:** instead of "Processing…", use specific messages such as "Summarizing key themes from your notes". If something fails, describe it in plain language and give a clear next step.
- **Non-AI fallback:** offer one, and design a good experience when AI is unavailable or the user opts out.
- **Inclusion:** ask people for personal or cultural attributes instead of inferring them, and avoid stereotypes such as assumptions about gender or relationship types.
- **Feedback:** voluntary, unobtrusive thumbs up and down, with an optional way to give detailed feedback.
- **Privacy:** say when data goes to a server, show what is shared, and state whether it is used for training. Ask permission before using personal or usage data, and offer an opt-out.
- **Hallucinations:** state clearly that AI output may contain errors, and avoid factual generation that could cause harm.

**Microsoft HAX: 18 Guidelines for Human-AI Interaction**, applied at four moments: initially, during interaction, when the AI is wrong, and over time — [HAX Toolkit](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/); [HAX Design Library](https://www.microsoft.com/en-us/haxtoolkit/library/)

The guidelines are:
1. Make clear what the system can do
2. Make clear how well it can do it
3. Time services based on context
4. Show contextually relevant information
5. Match relevant social norms
6. Mitigate social biases
7. Support efficient invocation
8. Support efficient dismissal
9. Support efficient correction
10. Scope services when in doubt
11. Make clear why the system did what it did
12. Remember recent interactions
13. Learn from user behavior
14. Update and adapt cautiously
15. Encourage granular feedback
16. Convey the consequences of user actions
17. Provide global controls
18. Notify users about changes

**Google PAIR People + AI Guidebook** — [PAIR Mental Models chapter](https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20Mental%20Models.pdf); [PAIR Explainability + Trust](https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20Explainability%20+%20Trust.pdf); [PAIR Feedback + Control](https://pair.withgoogle.com/chapter/People%20+%20AI%20Guidebook%20-%20Feedback%20+%20Control.pdf); [PAIR codelab](https://codelabs.developers.google.com/codelabs/pair-guidebook)
- Six chapters: User Needs, Data Collection, Mental Models, Explainability + Trust, Feedback + Control, Errors + Graceful Failure.
- Onboard in stages, showing what the product can and can't do and how it may change.
- Trust should be calibrated, not total: users should know when to rely on predictions.
- Separate implicit feedback (usage) from explicit feedback (ratings).
- Let users opt out of giving feedback, and say what data is collected and how it helps them.

These points come from secondary summaries. The chapter PDFs were not opened.

**Long-running agents (Jakob Nielsen, UX Tigers, Oct 2025; personal blog, not NN/g):** agents that run in the background break turn-taking. Suggested fixes are upfront clarification, checkpoints, and showing partial results progressively — [UX Tigers](https://www.uxtigers.com/articles/tags/response-time)

### Inferences
- **Presence:** Everly's companion should be a light, ambient presence (a small avatar or orb with mood states) rather than a full-screen takeover. 2025–26 flagship assistants converge on in-context and floating UIs, and Siri's glow ties the animation to the voice so it signals listening and speaking, not just decoration.
- **Mood states:** link moods to real app state (streaks, tasks done) like Finch, and never use guilt-tripping or sad-pet punishment for missed days. Finch's forgiving return is a cited design choice.
- **Nudges** (HAX 3, 8 and 17; PAIR control):
  - time them to context
  - make each one dismissible in one tap
  - offer a global frequency or quiet-hours control
  - let the user say "less like this"
  - avoid timers that auto-dismiss (Apple accessibility HIG)
- **Transparency:** label AI-generated content (for example a sparkle or "Organized by Everly" tag). Put Undo and Edit beside every AI action, and confirm before anything destructive or hard to undo, such as deleting or sending to others. The companion's persona must not imply a human author.
- **Lesson from Humane and Rabbit:** don't make voice the only path. Every voice action needs a visible on-screen equivalent.

### Gaps
- Pi (Inflection) and Replika companion UI patterns were not researched this session. Pi's consumer status after 2024 is unclear.
- No quantitative usability research was found on how often proactive notifications become annoying in companion apps. Finch retention numbers circulating online could not be verified (one Sensor Tower claim appeared on an unreliable site).
- OpenAI's official release notes for the Nov 2025 voice change were not retrieved; press coverage only.
- NN/g's own 2025–26 articles on AI agents or proactive AI were not found by search (only a video title: [NN/g video](https://www.nngroup.com/videos/aggressive-marketing-ux-ai-agents/)).

## Q2. Voice-first capture UX: invocation, live feedback, multi-intent parsing and correction

### Takeaway
Todoist Ramble (beta, launched Jan 2026) is the closest reference product for Everly's "one sentence becomes many tasks" mic. Its pattern is:
- free-form speech
- tasks appearing live as preview cards
- correction by voice ("Actually I meant…", "Remove that")
- a review step before commit, where project and label can be changed
- an explicit end ("that's all" or a checkmark)
- audio and visual confirmation

Doist's main lesson is that easy correction beats perfect first-time accuracy, and that the model should capture literally without over-interpreting. AudioPen and Voicenotes show a second pattern: rambling goes in, and a cleaned-up, reformattable artifact comes out.

### Cited Findings
**Todoist Ramble**
- **Launch:** January 2026, beta — [TechCrunch](https://techcrunch.com/2026/01/21/todoists-app-now-lets-you-add-tasks-to-your-to-do-list-by-speaking-to-its-ai/)
- **How it works** — [Todoist Help](https://www.todoist.com/help/articles/dictate-and-add-tasks-with-ramble-P1Raq7vVF)
  - **Live preview:** it transcribes and shows tasks in a preview as you talk. Users are advised to "say each task clearly, and pause between items."
  - **Voice correction:** "Actually, I meant…" edits a task, and "Remove that" or "Scratch that" deletes one.
  - **Review:** before confirming, users can change a task's project or label in the preview.
  - **Ending:** say "that's all", or tap the checkmark (mobile) or **Add tasks** (web).
- **Entry points:** waveform icon in Quick Add, home-screen and lock-screen widgets, iOS Control or Action button, Android Quick Settings tile, Siri, global desktop shortcuts, and Wear OS (beta, which captures only name, date and priority) — [Todoist Help](https://www.todoist.com/help/articles/dictate-and-add-tasks-with-ramble-P1Raq7vVF)
- **Coverage, limits and privacy:**
  - 40+ languages
  - 10 sessions/month on free plans; a session counts only if at least one task is found
  - needs internet
  - audio is not used to train AI models

  — [Todoist Help](https://www.todoist.com/help/articles/dictate-and-add-tasks-with-ramble-P1Raq7vVF)
- **Fields captured:** deadlines, priorities, duration and assignees. It is positioned as a quick-capture tool, "not a conversational assistant" — [Todoist Help (launch article)](https://www.todoist.com/help/articles/from-voice-to-tasks-ramble-july-1)
- **Doist build notes** (Product Talk podcast, Apr 16, 2026; summary only, the transcript is paywalled) — [Product Talk](https://www.producttalk.org/building-todoist-ramble-how-doist-turned-voice-braindumps-into-real-time-task-capture/)
  - Raw audio goes straight to a Gemini live audio model, with no separate transcription step. The model makes add, edit and delete tool calls while the user is still speaking, so tasks appear on screen in real time.
  - Sound effects give audio confirmation, which matters when driving.
  - "Easy correction beats perfect first-time accuracy."
  - The model is tuned (including temperature) to capture tasks literally rather than over-interpret or act on them.
  - Project and label matching injects the user's full project and label list into the prompt, with no RAG pipeline.
  - Today's date is injected into the prompt, and relative durations are normalized.
  - User research found people "brain dumping" with pen and paper or ChatGPT voice before entering tasks, and that behaviour shaped Ramble.
  - An LLM-judge eval uses recordings in 20+ languages from 100+ employees across 35 countries to catch regressions.
- Doist also published a Google Cloud write-up — [Google Cloud blog](https://cloud.google.com/blog/topics/startups/the-blueprint-doist-stream-of-consciousness-ai-task-list-creation)

**AudioPen and Voicenotes**
- **AudioPen:** removes filler and condenses rambling into coherent prose. Its "summary" is really a rewrite in a chosen tone — [Byteful Sunday review](https://bytefulsunday.substack.com/p/my-honest-review-of-audiopen-ai-a); [Audionotes comparison (competitor)](https://www.audionotes.app/blog/audionotes-vs-audiopen-best-voice-first-note-taking-app)
- **AudioPen weaknesses** reported by a competitor: no iOS background recording; no folders, tags or full-text search — [Audionotes (competitor)](https://www.audionotes.app/blog/audionotes-vs-audiopen-best-voice-first-note-taking-app)
- **Voicenotes:** instant transcription plus summary, and "ask your AI to recall anything" over past notes. It can reformat a note into a to-do list, email or post. Available on iOS and Android, whereas Cleft is Mac and iOS only — [App Store listing](https://apps.apple.com/us/app/voicenotes-ai-notes-meetings/id6483293628?l=vi); [Yahoo/TechCrunch](https://au.news.yahoo.com/buymeacoffees-founder-built-ai-powered-075113777.html)

**Live feedback visuals**
- Gemini uses a central waveform animation during voice input — [Android Authority](https://www.androidauthority.com/gemini-overlay-and-live-ui-changes-3655577/)
- Siri's glow reacts to voice amplitude — [9to5Mac](https://9to5mac.com/2024/11/03/new-apple-intelligence-siri-looks-different-works-the-same/)
- ChatGPT shows a live transcript inline — [Android Authority](https://www.androidauthority.com/chatgpt-voice-mode-in-chat-3619633)
- Siri distinguishes press-and-hold on the side button (push-to-talk style) from voice activation — [9to5Mac](https://9to5mac.com/2024/11/03/new-apple-intelligence-siri-looks-different-works-the-same/)

**Apple HIG on related points** — [Apple HIG Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai)
- Consider offering alternative versions of results, and make corrections visibly "take effect".
- Factor in latency, with a loading experience or background generation.

### Inferences
- **Recommended mic flow for Everly** (based on Ramble):
  1. Tap to start; a toggle is easier to use for longer than holding. Optionally support press-and-hold for quick bursts.
  2. A listening visual linked to amplitude (orb or waveform) plus a live transcript.
  3. Parsed task cards appearing progressively, each with a category chip (Personal / Social / Professional), a date chip and a confidence cue.
  4. Edit any chip by tap or by voice ("actually that's work").
  5. Swipe or ✕ to discard a card.
  6. One "Add all (n)" commit button.
  7. An Undo snackbar after commit.
- **Correction:** because "easy correction beats perfect accuracy", put the effort into one-tap correction of the category chip, not into higher classifier accuracy alone.
- **Literal capture:** never auto-execute side effects, such as messaging friends for a Social task, from a voice capture. Capture literally and confirm (Apple HIG, Doist).
- **Grouped display:** show multi-intent results grouped by category, with counts ("3 tasks: 1 Personal, 2 Professional"). Pair a success sound with haptics for confirmation (Apple accessibility HIG).
- **Ideas vault:** follow the AudioPen and Voicenotes pattern. Keep the raw transcript or audio, and show the AI-cleaned version as an editable layer on top.

### Gaps
- No primary usability study comparing push-to-talk and tap-to-toggle on mobile was found this session.
- Things 3, TickTick, Superlist, Wispr Flow, Otter, Cleft and Granola were not individually researched for their 2025–26 voice UIs (the search returned no Wispr Flow results). Their patterns are not documented here.
- The full Doist interview (failure cases, how ambiguous project names are handled, latency figures) is paywalled.
- No NN/g 2024–26 voice UX article was retrieved.

## Q3. Ideas / second-brain apps: AI organization and resurfacing

### Takeaway
2025–26 second-brain apps split into three models:
- **AI-first auto-organization and resurfacing:** Mem 2.0, relaunched Oct 2025, with meaning-based "Deep Search", a "Heads Up" feature that resurfaces related notes in context, and agentic chat over the vault.
- **Object- or type-based structure:** Capacities.
- **Outliner with supertags:** Tana.

The common resurfacing patterns are semantic search, related-notes-in-context and chatting with your notes, rather than manual folders.

### Cited Findings
- **Mem 2.0 (relaunched Oct 2025):** Deep Search finds content by meaning; "Heads Up" resurfaces relevant notes during meetings or writing; agentic chat works across the knowledge base; offline support — [AlternativeTo, Oct 2025](https://alternativeto.net/news/2025/10/mem-2-0-relaunches-with-smarter-note-taking-tools-offline-support-and-a-new-agentic-chat)
- **Mem's App Store positioning:** "AI Second Brain", with an assistant that answers questions over your notes. This is promotional copy — [App Store](https://apps.apple.com/us/app/mem-self-organizing-workspace/id1578757028?uo=4)
- **Capacities:** an object-based network instead of folders, with an integrated AI assistant — [Toolmage comparison](https://www.toolmage.com/en/compare/mem-vs-capacities/)
- **Tana:** an AI-native outliner with supertags. Tana's own 2026 post positions it as a "shared brain that builds itself from your work" (vendor marketing) — [Tana blog 2026](https://tana.inc/blog/best-second-brain-apps-2026)
- **Voicenotes:** natural-language recall over past voice notes, and reformatting a note into other artifacts such as a to-do list or email — [App Store](https://apps.apple.com/us/app/voicenotes-ai-notes-meetings/id6483293628?l=vi)
- **Ramble's next steps:** Doist plans multimodal capture (images, text blobs), suggesting capture tools are converging toward any-input-to-structured-items — [Product Talk](https://www.producttalk.org/building-todoist-ramble-how-doist-turned-voice-braindumps-into-real-time-task-capture/)

### Inferences
- **Organizing the vault:**
  - Let AI propose clusters or tags, but show them as editable, labelled suggestions ("Everly grouped these"), following the Apple HIG "Keep people in control" and HAX 9/11.
  - Keep a manual override, and never silently move or delete ideas.
- **Resurfacing:**
  - Use in-context "related ideas" (the Mem Heads Up pattern) and gentle companion nudges ("You had 3 ideas about X last month").
  - Give these nudges the same dismiss and frequency controls as other nudges.
- **Idea-to-action:** a button that turns an idea into tasks fits the Voicenotes reformat pattern.

### Gaps
- No independent, in-depth 2025–26 review of how good Mem's resurfacing is was found. Most comparison pages are affiliate or vendor content.
- Reflect, Notion AI and Apple Notes (iOS 26-era AI features) were not researched this session.
- No usability research on automatic AI organization versus user-built structure was found.

## Q4. Accessibility expectations, 2025–2026

### Takeaway
The legal baseline for EU users has been enforceable since 28 June 2025 under the European Accessibility Act (EAA), via EN 301 549, which references WCAG 2.1 AA and adds requirements for native apps.

The practical design baseline is:
- WCAG 2.2 target size (24×24 CSS px minimum, AA)
- Apple's 44×44 pt default control size (28×28 minimum)
- 4.5:1 text contrast in both light and dark mode
- text scaling to at least 200%
- labels for icon-only buttons (VoiceOver and Voice Control)
- respecting Reduce Motion (important for an animated avatar or orb)
- haptics paired with audio cues
- captions or transcripts for affirmation audio
- no timers that auto-dismiss
- alternatives for users with atypical speech

### Cited Findings
**EAA**
- Enforceable by member states from 28 June 2025 (Directive 2019/882). Enforcement is national, through market-surveillance authorities — [Taylor Wessing](https://www.taylorwessing.com/en/interface/2025/accessibility/the-european-accessibility-act-and-its-implementation); [Mondaq](https://www.mondaq.com/uk/contracts-and-commercial-law/1644848/a-new-milestone-for-accessibility-the-european-accessibility-act-now-applies)
- Applies to businesses outside the EU that serve EU consumers; micro-enterprises are exempt — [DWT](https://www.dwt.com/insights/2025/07/european-accessibility-act-digital-products)
- EN 301 549 references WCAG 2.1 AA, with added requirements for native apps — [Acquia](https://www.acquia.com/blog/european-accessibility-act-and-en-301-549-your-complete-compliance-guide)
- Reported penalties: France up to €250,000 per incident; Sweden up to €200,000 plus daily sanctions; Germany up to €100,000 (vendor blogs, so verify) — [TestParty](https://testparty.ai/blog/european-accessibility-act-guide); [TestCollab](https://testcollab.com/blog/european-accessibility-act-2025)
- Sources disagree on transition dates for some product categories — [TestCollab](https://testcollab.com/blog/european-accessibility-act-2025)

**WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA** — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Pointer targets must be at least 24×24 CSS px.
- Exceptions: spacing (a 24px-diameter circle around each target that doesn't intersect another), an equivalent control, inline text, user-agent control, and essential presentation.
- W3C recommends aiming for the stricter 2.5.5 (Enhanced) for important controls.
- W3C notes that the requirement makes touchscreens easier to use and that spacing can work nearly as well as size.

**Apple HIG Accessibility** (updated Mar 7, 2025 and Jun 9, 2025) — [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- **Control size:** iOS default 44×44 pt, minimum 28×28 pt. Padding of about 12 pt around bezelled elements and about 24 pt around borderless ones.
- **Text size:** let text enlarge to at least 200% (Dynamic Type). Default body size is 17 pt, minimum 11 pt. Thin weights need larger sizes.
- **Contrast:** 4.5:1 up to 17 pt; 3:1 at 18 pt and above or bold. Check both light and dark modes, support Increase Contrast, and prefer system colors.
- **Colour:** don't use colour alone. Add shapes or icons, which matters for colour-coded Personal/Social/Professional categories.
- **Gestures:** offer alternatives such as an on-screen button for swipe-to-dismiss. Label elements for Voice Control, and integrate with Siri and Shortcuts.
- **Reduce Motion:** when it is on, cut automatic and repetitive animation (zoom, scale, peripheral motion). Prefer fades, tighten springs, and avoid animating blur and depth. Be careful with fast-moving and blinking animation.
- **Audio:** pair audio cues with haptics, add visual cues, and provide captions or transcripts for audio-only content. Don't autoplay audio without controls, and respect global opt-outs.
- **Timers:** keep auto-dismissing elements to a minimum and prefer an explicit dismiss.
- **Assistive Access:** one interaction per screen, and double confirmation for actions that are hard to recover from.
- **App Store:** Accessibility Nutrition Labels now let apps declare which accessibility features they support.

**Atypical speech**
- Apple **Vocal Shortcuts** let users teach custom sounds or phrases to trigger actions, processed on device. Intended for people with moderate to severe atypical speech — [Apple Support](https://support.apple.com/en-hk/guide/iphone/iph7f242ea2c)
- Apple **Listen for Atypical Speech** uses on-device ML for conditions such as cerebral palsy, ALS and stroke, and is U.S. English only — [Speech Technology](https://www.speechtechmag.com/Articles/News/Speech-Technology-News/Apple-Adds-Voice-Based-Accessibility-Features-164091.aspx); [Apple Mac Help](https://support.apple.com/en-kz/guide/mac-help/mchl6972f04a)
- Google **Project Relate** (Android) personalizes speech recognition after the user records 500 phrases. Its training data drew on more than 1M samples from people with ALS, CP, Down syndrome, Parkinson's and similar conditions — [DeepLearning.AI The Batch](https://www.deeplearning.ai/the-batch/project-relate); [AbilityNet](https://abilitynet.org.uk/news-blogs/how-project-relate-can-help-those-atypical-speech-patterns)

### Inferences
- **Mic button:** at least 44×44 pt / 48dp (it will likely be much larger as a hero control), with an accessibility label ("Capture tasks by voice") and a state ("listening" or "not listening") announced to screen readers. Always offer a typed-input alternative alongside it, for speech differences, noisy places and privacy.
- **Avatar animation:** mood animation and an amplitude-reactive orb must collapse to a static or cross-fade state under Reduce Motion. Blur or glass effects need a Reduce Transparency fallback (the Apple HIG section on this was not fetched; see Gaps). Moods should also be shown with text or an icon, not colour or expression alone.
- **Category chips:** add an icon and text label, not colour only, and check 4.5:1 contrast in both Light and Dark themes. The 3D Glass theme is high risk for contrast.
- **Affirmation deck:** include captions or transcripts, no autoplay without controls, haptics paired with sounds, and an on-screen button for every card swipe gesture.
- **Nudges and toasts:** don't auto-dismiss Undo snackbars too quickly. Apple advises an explicit dismiss.
- **Legal target:** for EU distribution, target WCAG 2.1 AA (the legal minimum via EN 301 549) and design to WCAG 2.2 AA as best practice.

### Gaps
- Material Design's 48×48dp touch-target guidance and Android font-scaling guidance (Android 14+ nonlinear scaling up to 200%) are widely cited, but the primary Material and Android pages were not fetched this session. Verify before citing.
- The exact 44×44 CSS px figure for WCAG 2.5.5 (AAA) was not confirmed from the fetched page.
- Apple HIG guidance on Reduce Transparency and the VoiceOver page (labels for icon-only buttons) were not fetched directly. The Accessibility page links to a separate VoiceOver page.
- No 2025–26 study on voice UIs for users with stuttering or dysarthria in consumer productivity apps was found.
- Whether a revised EN 301 549 aligned to WCAG 2.2 has been published by Oct 2026 was not verified.
