# Data Models

Canonical TypeScript models live under `lib/`. Python mirrors for the voice API live under `backend/app/models.py`.

---

## ReminderTask

```ts
type ReminderTask = {
  id: string;
  title: string;
  notes?: string;
  category: 'personal' | 'social' | 'professional';
  subCategory: SubCategory;
  priority: 'p1' | 'p2' | 'p3';
  schedule: { time: string; daysOfWeek: number[]; date?: string };
  dueAt: string | null;          // ISO
  contextTrigger?: string;
  sound: { mode: 'mp3' | 'tts'; assetUri: string; assetName: string };
  enabled: boolean;
  completed: boolean;
  createdAt: string;             // ISO
  notificationId?: string;
};
```

**Storage:** `@reminders/v2` (JSON array). Legacy `@reminders/v1` migrated in `lib/storage.ts`.

**CRUD helpers:** `loadReminders`, `upsertReminder`, `upsertMany`, …

**Scheduling helpers:** `isScheduledToday`, `sortByPriority`, `createId`, `formatHeaderDate` (`lib/schedule.ts`).

---

## ParsedTaskDraft (voice / decompress)

Produced by API or local parser before persistence:

```ts
type ParsedTaskDraft = {
  title: string;
  category: TaskCategory;
  subCategory: SubCategory;
  priority: TaskPriority;
  dueAt: string | null;
  time?: string;
  notes?: string;
  contextTrigger?: string;
};
```

Home maps drafts → full `ReminderTask` in `draftsToTasks()` (`app/index.tsx`).

---

## Companion

```ts
type CompanionMood = 'calm' | 'hype' | 'soothing' | 'grounded';
type CompanionVisualState = 'idle' | 'listening' | 'reacting' | 'speaking';

type CompanionMemoryEvent = {
  id: string;
  kind: 'follow_up' | 'ritual' | 'vent' | 'celebration' | 'boundary';
  relatedTaskId?: string;
  prompt: string;
  scheduledFor: string;
  deliveredAt?: string;
  skipped?: boolean;
};

type BioStateSnapshot = {
  at: string;
  stressScore: number; // 0–1
  signals: Array<'rapid_speech' | 'late_night' | 'completion_streak' | 'idle_gap'>;
};

type SyncScore = {
  sharedStreakDays: number;
  hydrationSyncs: number;
  movementSyncs: number;
  unlockTier: number; // 0–5
};
```

Mood inference (simplified):

| Signal | Effect |
| --- | --- |
| `late_night` or stress ≥ 0.65 | `soothing` |
| `completion_streak` (≥3 completions / hour) | `hype` |
| default | `calm` / `grounded` |

---

## Manifestation deck

```ts
type ManifestPillarId = 'personal' | 'social' | 'economical' | 'professional';

type ManifestPillar = {
  id: ManifestPillarId;
  label: string;
  accent: string;
  identityScript: string;
  microStrip: string;
  voiceScript: string;
  stillUri: string;
  videoUri?: string;
  voiceUri?: string;
  frequencyHz: number;
  companionHook: string;
  goalLabel?: string;
  visionPrompt?: string;
};

type ManifestDeckState = {
  identityCode: string;
  auraScore: number;     // 0–100
  pillars: Record<ManifestPillarId, ManifestPillar>;
  voiceMix: number;      // 0–1, default 0.3
};
```

**Seed:** `createSeedDeck()` in `lib/manifestation/seeds.ts`.  
**Load merge:** stored patches overlay seed so copy updates ship without wiping user `voiceUri` / prompts.

---

## IdeaNote

```ts
type IdeaNote = {
  id: string;
  category: 'personal' | 'social' | 'professional';
  kind: IdeaKind;           // content_idea | architecture | trade_research | …
  title: string;
  summary: string;
  transcript: string;
  bullets: string[];
  actions: string[];
  tags: string[];
  status: IdeaStatus;       // captured → … → archived
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  durationSec: number;
  audioUri?: string;
  contentHook?: string;
  contentFormats?: string[];
  platforms?: string[];
  tradeSafeguard?: boolean;
  suggestedReminderAt?: string | null;
  linkedReminderIds?: string[];
  linkedManifestPillar?: ManifestPillarId;
  companionLine?: string;
};
```

**Storage:** `@ideas/vault/v1`  
**Organize:** `lib/ideas/organize.ts` · **CRUD:** `lib/ideas/storage.ts`

---

## Theme

```ts
type ThemeId = 'light' | 'dark' | 'glass';

type ThemeTokens = {
  id: ThemeId;
  label: string;
  mode: 'light' | 'dark';
  canvas: string;
  stage: string;
  surface: string;
  surfaceElevated: string;
  ink: string;
  muted: string;
  soft: string;
  border: string;
  accent: string;
  accentDark: string;
  onAccent: string;
  danger: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  navBg: string;
  cardBg: string;
  cardBorder: string;
  glassBorder: string;
  shadow: string;
  canvasGradient?: string;
  blur?: boolean;
};
```

Persisted id only (`@everly/theme/v1`); tokens are code-defined.

---

## Storage key registry

| Key | Owner | Shape |
| --- | --- | --- |
| `@reminders/v2` | `lib/storage.ts` | `ReminderTask[]` |
| `@reminders/v1` | legacy | migrated |
| `@companion/memories/v1` | companion engine | `CompanionMemoryEvent[]` |
| `@companion/bio/v1` | companion engine | `BioStateSnapshot` |
| `@companion/sync/v1` | companion engine | `SyncScore` |
| `@companion/rituals/v1` | companion engine | `{ morning?: YYYY-MM-DD, evening?: … }` |
| `@companion/hype-delivered/v1` | companion engine | `string[]` of `taskId:day` |
| `@companion/completions-hour/v1` | companion engine | `{ [YYYY-MM-DDTHH]: number }` |
| `@manifestation/deck/v1` | manifestation storage | `ManifestDeckState` |
| `@ideas/vault/v1` | ideas storage | `IdeaNote[]` |
| `@everly/theme/v1` | theme storage | `ThemeId` string |

---

## ID generation

- Reminders: `createId()` in `lib/schedule.ts`
- Companion memories: `uid(prefix)` in `lib/companion/engine.ts`
