# Everly Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-screen push "dock" with a real tab group, introduce a gradient 3D-glass material system, and make theme mode and accent colour user-selectable from a new Settings screen, with every screen reading theme tokens.

**Architecture:** Theme becomes *preferences* (`mode` + `accent`) persisted in AsyncStorage and resolved by a pure `buildTheme()` into tokens (colours, gradient stops, glass tint, status-bar style). Two material primitives, `GradientCanvas` and `GlassSurface`, render those tokens with a platform fallback chain (Liquid Glass on iOS 26+ → `expo-blur` on iOS → gradient-highlight surface on Android/web → solid when Reduce Transparency is on). Home / Ideas / Manifest move into an Expo Router `(tabs)` group whose custom `tabBar` is one shared `GlassDock`; Add Reminder and Settings stay root-stack routes.

**Tech Stack:** Expo SDK 58, Expo Router ~58.0.26 (`Tabs` with `tabBar`), React Native 0.88, `expo-linear-gradient`, `expo-blur`, `expo-glass-effect`, `expo-symbols`, `expo-haptics`, `react-native-safe-area-context`, Jest via `jest-expo` (pure theme logic only).

**Spec:** [reports/Everly mobile design trends 2026.md](../../../reports/Everly%20mobile%20design%20trends%202026.md) plus the user's request: "gradient 3D glass; theme will be customizable from settings; theme colour and mode selectable from settings".

## Global Constraints

- Must run in **Expo Go SDK 58** — only Expo-Go-bundled native modules (`expo-linear-gradient`, `expo-blur`, `expo-glass-effect`, `expo-symbols`, `expo-haptics` are; nothing needing a dev build).
- Install packages with `npx expo install <pkg>` only; never `sudo`.
- Theme modes: `system`, `light`, `dark`, `glass`. Default for a fresh install: `{ mode: 'system', accent: 'teal' }`.
- Accent presets (id → base hex): `teal #0EA5A8` (default), `sky #0284C7`, `indigo #6366F1`, `rose #E11D48`, `amber #F59E0B`, `emerald #10B981`.
- Theme storage key `@everly/theme/v2` (JSON `{ mode, accent }`); read `@everly/theme/v1` (bare `'light'|'dark'|'glass'`) once as migration.
- Text on accent (`onAccent`) and body text on canvas must reach WCAG contrast **≥ 4.5:1** for every preset × scheme.
- Dock: exactly three labelled tabs **Home · Ideas · Manifest**; no "+" in the dock. Typed reminder entry moves to the mic's long-press menu.
- Touch targets ≥ 44×44 pt; every icon-only control has `accessibilityLabel`; tabs use `accessibilityRole="tab"` with `selected` state.
- Glass only on chrome (header, dock, sheets, FAB, chips); reminder/idea/affirmation text sits on near-opaque surfaces.
- Respect Reduce Transparency (solid surfaces) and Reduce Motion (no looping pulses).
- Manifest pillar grid stays immersive-dark in every mode (photo content); its chrome follows the theme.
- URLs must not change: `/`, `/ideas`, `/manifestation`, `/add-reminder`, plus new `/settings`.
- Keep existing storage keys for reminders, ideas, deck, companion untouched.

## Review Focus

- **Stored v1 theme** (`'glass'` string from the old picker) → user lands in Glass with teal accent, not reset to Light. Test in Task 2.
- **Corrupt or unknown stored prefs** (`'{bad json'`, `{mode:'neon'}`) → defaults, no crash. Test in Task 2.
- **System mode with no OS scheme** (`useColorScheme()` returns `null`, e.g. web) → resolves to light. Test in Task 2.
- **Amber accent** → white-on-amber would be ~2.1:1; `onAccent` must flip to dark ink. Test in Task 1 covers every preset × scheme.
- **Reduce Transparency enabled on iOS 26** → solid surface, never GlassView/BlurView. Test of `pickGlassTier` in Task 3.

## File Structure

| File | Responsibility |
| --- | --- |
| `lib/theme/color.ts` (new) | Hex parse/format, `mix`, `relativeLuminance`, `contrastRatio`, `pickOnColor` |
| `lib/theme/accents.ts` (new) | `ACCENTS` presets, `AccentId` |
| `lib/theme/types.ts` (modify) | `ThemeMode`, `ThemeScheme`, `ThemePrefs`, extended `ThemeTokens` |
| `lib/theme/buildTheme.ts` (new, replaces `themes.ts`) | `buildTheme(scheme, accent)`, `resolveScheme(mode, os)` |
| `lib/theme/storage.ts` (modify) | `parsePrefs`, `loadPrefs`, `savePrefs` with v1 migration |
| `lib/theme/ThemeContext.tsx` (modify) | Provider exposing prefs, setters, resolved tokens |
| `lib/theme/useThemedStyles.ts` (new) | `useThemedStyles(factory)` memoised per tokens |
| `lib/a11y.ts` (new) | `useReduceMotion()`, `useReduceTransparency()` live hooks |
| `components/glass/GradientCanvas.tsx` (replaces `ThemedCanvas.tsx`) | Full-bleed gradient + glass orbs |
| `components/glass/GlassSurface.tsx` (new) | Tiered glass material; `pickGlassTier` pure helper in `components/glass/tier.ts` |
| `components/glass/GlassDock.tsx` (replaces `BottomDock.tsx`) | Custom `tabBar`; exports `DOCK_HEIGHT`, `useDockInset()` |
| `components/CaptureMenu.tsx` (new) | Long-press menu for the mic FAB |
| `components/ScreenHeader.tsx` (new) | Gradient/glass header with title, subtitle, settings button |
| `app/(tabs)/_layout.tsx` (new) | `Tabs` with `tabBar={GlassDock}` |
| `app/(tabs)/index.tsx`, `ideas.tsx`, `manifestation.tsx` (moved) | Screens without their own dock |
| `app/settings.tsx` (new) | Appearance: mode + accent + live preview |
| `app/_layout.tsx` (modify) | Root stack: `(tabs)`, `add-reminder` modal, `settings`; status bar from tokens |
| Removed: `components/ThemePicker.tsx`, `components/ThemedCanvas.tsx`, `components/BottomDock.tsx`, `lib/theme/themes.ts` |

---

### Task 1: Test harness + colour math + accent presets

**Files:**
- Create: `lib/theme/color.ts`, `lib/theme/accents.ts`, `lib/theme/__tests__/color.test.ts`
- Modify: `package.json` (devDeps `jest-expo`, `jest`, `@types/jest`; script `"test": "jest"`; `"jest": { "preset": "jest-expo" }`)

**Interfaces:**
- Produces: `parseHex(hex: string): [number, number, number]`, `toHex(rgb: [number, number, number]): string`, `mix(a: string, b: string, t: number): string` (t=0 → a, t=1 → b), `contrastRatio(a: string, b: string): number`, `pickOnColor(bg: string, light?: string, dark?: string): string` (defaults `'#FFFFFF'` / `'#0B1220'`, returns whichever contrasts more). `type AccentId = 'teal'|'sky'|'indigo'|'rose'|'amber'|'emerald'`, `ACCENTS: Record<AccentId, { label: string; base: string }>`, `ACCENT_IDS: AccentId[]`, `DEFAULT_ACCENT: AccentId = 'teal'`.

- [ ] **Step 1:** `npx expo install jest-expo jest @types/jest -- --save-dev`; add `test` script and jest preset.
- [ ] **Step 2: Write failing tests** `color.test.ts`:
  - `contrastRatio('#FFFFFF', '#000000')` ≈ 21 (toBeCloseTo 1 dp); `contrastRatio('#777777','#777777')` = 1.
  - `mix('#000000', '#FFFFFF', 0.5)` = `'#808080'`; `mix(a, b, 0)` = `a` uppercased.
  - `parseHex('#0ea5a8')` = `[14,165,168]`; `parseHex('#FFF')` = `[255,255,255]`.
  - `pickOnColor(ACCENTS.amber.base)` = `'#0B1220'`; `pickOnColor(ACCENTS.indigo.base)` = `'#FFFFFF'`.
- [ ] **Step 3:** `npm test` → FAIL (modules missing).
- [ ] **Step 4:** Implement `color.ts` (WCAG relative luminance) and `accents.ts` with the Global Constraints hexes.
- [ ] **Step 5:** `npm test` → PASS. Commit `feat(theme): colour math and accent presets`.

### Task 2: Theme model, resolution and persisted preferences

**Files:**
- Modify: `lib/theme/types.ts`, `lib/theme/storage.ts`, `lib/theme/ThemeContext.tsx`
- Create: `lib/theme/buildTheme.ts`, `lib/theme/useThemedStyles.ts`, `lib/theme/__tests__/buildTheme.test.ts`, `lib/theme/__tests__/storage.test.ts`
- Delete: `lib/theme/themes.ts` (update its importers)

**Interfaces:**
- Consumes: Task 1 exports.
- Produces:
  - `type ThemeMode = 'system'|'light'|'dark'|'glass'`; `type ThemeScheme = 'light'|'dark'|'glass'`; `type ThemePrefs = { mode: ThemeMode; accent: AccentId }`; `DEFAULT_PREFS: ThemePrefs`.
  - `ThemeTokens` keeps every existing field (`id` becomes `ThemeScheme`, `mode: 'light'|'dark'`) and adds: `accentId: AccentId`, `canvasColors: [string, string, ...string[]]`, `headerColors: [string, string]`, `orbColors: string[]` (empty unless glass), `glassTint: 'light'|'dark'`, `statusBar: 'light'|'dark'`, `inkOnHeader: string`. Drops `canvasGradient` and `blur`.
  - `resolveScheme(mode: ThemeMode, os: 'light'|'dark'|null|undefined): ThemeScheme`.
  - `buildTheme(scheme: ThemeScheme, accent: AccentId): ThemeTokens` — light/dark/glass neutrals as in today's `themes.ts`; accent = base in light, `mix(base,'#FFFFFF',0.25)` in dark/glass; `accentDark = mix(accent,'#000000',0.25)`; `onAccent = pickOnColor(accent)`; glass `canvasColors` = `[mix(base,'#04080F',0.82), '#0A1628', mix(base,'#04080F',0.7)]`, `orbColors` = accent + two category hues at ~0.45 alpha. Glass content surfaces stay readable: `cardBg = 'rgba(15,23,38,0.82)'`, `surface = 'rgba(15,23,38,0.88)'`; translucency lives only in `GlassSurface`.
  - `parsePrefs(v2Raw: string|null, v1Raw: string|null): ThemePrefs`; `loadPrefs(): Promise<ThemePrefs>`; `savePrefs(p: ThemePrefs): Promise<void>`.
  - Context: `useTheme(): { prefs: ThemePrefs; theme: ThemeTokens; scheme: ThemeScheme; setMode(m: ThemeMode): void; setAccent(a: AccentId): void; ready: boolean }` (`system` follows `useColorScheme()` live).
  - `useThemedStyles<T>(factory: (t: ThemeTokens) => T): T`.

- [ ] **Step 1: Write failing tests:**
  - `buildTheme.test.ts`: for every `ACCENT_IDS × ['light','dark','glass']`: `contrastRatio(t.onAccent, t.accent) >= 4.5` and `contrastRatio(t.ink, t.canvas) >= 4.5`; `buildTheme('glass','teal').orbColors.length > 0`; `buildTheme('light','teal').statusBar === 'light'` (accent header); `resolveScheme('system', null) === 'light'`; `resolveScheme('system','dark') === 'dark'`; `resolveScheme('glass','light') === 'glass'`.
  - `storage.test.ts`: `parsePrefs(null, null)` = DEFAULT_PREFS; `parsePrefs(null, 'glass')` = `{mode:'glass', accent:'teal'}`; `parsePrefs('{bad json', null)` = DEFAULT_PREFS; `parsePrefs('{"mode":"neon","accent":"rose"}', null)` = `{mode:'system', accent:'rose'}`; v2 wins over v1.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement types, `buildTheme.ts`, storage (mock-free: `parsePrefs` is pure; `loadPrefs` reads both keys), context, `useThemedStyles` (`useMemo(() => factory(theme), [theme])`).
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` → only errors in files Task 3+ will rewrite (`ThemePicker`, `ThemedCanvas`, `BottomDock`); fix any others.
- [ ] **Step 5:** Commit `feat(theme): mode + accent preferences with v1 migration`.

### Task 3: Gradient canvas, glass surface and a11y hooks

**Files:**
- Create: `lib/a11y.ts`, `components/glass/tier.ts`, `components/glass/GradientCanvas.tsx`, `components/glass/GlassSurface.tsx`, `components/glass/__tests__/tier.test.ts`
- Delete: `components/ThemedCanvas.tsx`
- Modify: `components/PhoneShell.tsx` (render children inside `GradientCanvas`)

**Interfaces:**
- Produces:
  - `useReduceMotion(): boolean`, `useReduceTransparency(): boolean` — initial `AccessibilityInfo.is…Enabled()` + `addEventListener('reduceMotionChanged'|'reduceTransparencyChanged')`.
  - `type GlassTier = 'liquid'|'blur'|'gradient'|'solid'`; `pickGlassTier(o: { os: string; liquidAvailable: boolean; reduceTransparency: boolean; scheme: ThemeScheme }): GlassTier` — reduceTransparency → `solid`; ios+liquid → `liquid`; ios → `blur`; else → `gradient`; scheme `light` never uses `liquid`/`blur` stronger than needed (still allowed).
  - `<GradientCanvas>` — `LinearGradient` with `theme.canvasColors` (single solid colour when length 1 style), plus `orbColors` as large soft circles; static (no animation).
  - `<GlassSurface style radius? intensity? children>` — tier render: `liquid` → `GlassView` (`glassEffectStyle="regular"`, `colorScheme` from `theme.glassTint`, `tintColor` accent at low alpha); `blur` → `BlurView` (`tint` from `glassTint`, intensity default 40); `gradient` → `LinearGradient` top-left→bottom-right from `rgba(255,255,255,0.22)` to `rgba(255,255,255,0.06)` (dark) or `0.85→0.55` (light) with 1px `theme.glassBorder` hairline and a 1px top highlight line (the "3D" edge); `solid` → `theme.surfaceElevated`. All tiers clip to `radius` and keep the border.
- [ ] **Step 1:** `npx expo install expo-linear-gradient expo-blur`.
- [ ] **Step 2: Failing test** `tier.test.ts`: `{os:'ios', liquidAvailable:true, reduceTransparency:true}` → `solid`; `{ios, liquid:true, rt:false}` → `liquid`; `{ios, liquid:false}` → `blur`; `{os:'android'}` → `gradient`; `{os:'web'}` → `gradient`.
- [ ] **Step 3:** `npm test` → FAIL; implement; → PASS.
- [ ] **Step 4:** `npx tsc --noEmit` clean for these files. Commit `feat(glass): gradient canvas and tiered glass surface`.

### Task 4: Tabs group with one shared GlassDock

**Files:**
- Create: `app/(tabs)/_layout.tsx`, `components/glass/GlassDock.tsx`
- Move (git mv): `app/index.tsx` → `app/(tabs)/index.tsx`, `app/ideas.tsx` → `app/(tabs)/ideas.tsx`, `app/manifestation.tsx` → `app/(tabs)/manifestation.tsx`
- Modify: `app/_layout.tsx` (Stack screens `(tabs)` headerless, `add-reminder` modal, `settings`); the three screens (delete their `bottomNav` JSX + styles); `components/VoiceCapture.tsx`, `components/ideas/IdeaMicFab.tsx` (bottom offset), `app/(tabs)/ideas.tsx` list `paddingBottom`
- Delete: `components/BottomDock.tsx`

**Interfaces:**
- Consumes: `GlassSurface`, `useTheme`, `useReduceMotion`.
- Produces: `DOCK_HEIGHT = 64`; `useDockInset(): number` (= `DOCK_HEIGHT + insets.bottom + 12`, the space floating UI must clear); `GlassDock(props: BottomTabBarProps)` from `expo-router` types.
- Dock spec: floating pill, horizontal margin 16, `bottom: insets.bottom + 8`, radius 28, `GlassSurface`; three items with `SymbolView` icons (`{ ios: 'house.fill'|'lightbulb.fill'|'sparkles', android: 'home'|'lightbulb'|'auto_awesome', web: same as android }`, `fallback` = current glyph text), always-visible label, active item gets accent pill background + `onAccent` colour; press = `emitter.emit({type:'tabPress', target, canPreventDefault:true})` then `navigateToTab(route.key)` if not focused & not prevented (mirror the default bar); `Haptics.selectionAsync()` on change; `accessibilityRole="tab"`, `accessibilityState={{selected}}`, label `"Home, tab, 1 of 3"`.
- `(tabs)/_layout.tsx`: `<Tabs tabBar={(p) => <GlassDock {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>` with `index` title Home, `ideas` Ideas, `manifestation` Manifest.

- [ ] **Step 1:** Move files, write layout + dock, strip per-screen docks and their `Link` imports, replace `bottom: 88 + insets.bottom` with `useDockInset() + 8`.
- [ ] **Step 2:** `npx tsc --noEmit` → clean. `CI=1 npx expo export --platform android --output-dir $TMPDIR/x` → succeeds.
- [ ] **Step 3: Manual (emulator):** each tab switches without stacking (Android back from Ideas exits to Home, then app); dock clears gesture bar; mic FABs sit above dock; `/ideas` deep link `adb shell am start -d "exp://10.0.2.2:8081/--/ideas"` opens Ideas tab.
- [ ] **Step 4:** Commit `feat(nav): tabs group with shared glass dock`.

### Task 5: Mic as the single create action + capture menu

**Files:**
- Create: `components/CaptureMenu.tsx`
- Modify: `components/VoiceCapture.tsx` (long-press opens menu; theme tokens), `app/(tabs)/ideas.tsx` (open `IdeaCaptureSheet` when route param `capture === '1'`, then clear param)

**Interfaces:**
- Produces: `CaptureMenu(props: { visible: boolean; onClose(): void; anchorBottom: number })` with two `GlassSurface` rows: **"Type a reminder"** → `router.push('/add-reminder')`; **"Capture idea"** → `router.navigate({ pathname: '/ideas', params: { capture: '1' } })`. Mic tap behaviour unchanged (voice). Mic `accessibilityHint="Long press for more ways to add"`.
- [ ] **Step 1:** Implement; `Haptics.impactAsync(Light)` on long-press open.
- [ ] **Step 2:** tsc clean; manual: long-press → menu; both rows route correctly; menu dismisses on backdrop tap and Android back.
- [ ] **Step 3:** Commit `feat(capture): mic long-press menu replaces dock plus`.

### Task 6: Settings screen (mode + accent)

**Files:**
- Create: `app/settings.tsx`, `components/ScreenHeader.tsx`
- Delete: `components/ThemePicker.tsx`

**Interfaces:**
- Consumes: `useTheme().prefs/setMode/setAccent`, `GlassSurface`, `GradientCanvas`, `ACCENTS`.
- Produces: `ScreenHeader(props: { title: string; subtitle?: string; variant?: 'gradient'|'glass'; right?: React.ReactNode })` — `variant='gradient'` draws `LinearGradient(theme.headerColors)` with rounded bottom corners and top safe-area padding; `'glass'` uses `GlassSurface`. Always renders a settings button (`SymbolView` `gearshape`/`settings`, label "Settings") routing to `/settings` unless `right` overrides.
- Settings layout (root-stack screen, native header hidden, own `ScreenHeader` with back button):
  - **Appearance → Mode:** 4-segment control `System · Light · Dark · Glass` (`accessibilityRole="radiogroup"`, each `radio` with `checked`).
  - **Accent colour:** 6 swatches (44pt circles, check mark on selected, label under each, `radio` role).
  - **Preview:** a mini header gradient + one glass card + one accent button rendered with the live tokens.
  - Changes apply immediately and persist (Task 2 setters).
- [ ] **Step 1:** Implement; register `settings` in root stack (`headerShown: false`, `animation: 'slide_from_right'`).
- [ ] **Step 2:** tsc clean; manual: change each mode/accent → whole app (dock, headers, Home, Ideas) updates live; kill + relaunch Expo Go → choice persists; System follows emulator dark-mode toggle (`adb shell cmd uimode night yes`).
- [ ] **Step 3:** Commit `feat(settings): selectable theme mode and accent`.

### Task 7: Home on tokens (gradient header, glass presence, solid quadrants)

**Files:** Modify `app/(tabs)/index.tsx`, `components/CategoryQuadrant.tsx`, `components/ReminderCard.tsx`, `components/SyncScoreBadge.tsx`, `components/EmptyState.tsx`, `components/AmbientAvatar.tsx`, `components/WarmInboundBubble.tsx`, `components/HypeInterstitial.tsx`, `components/DecompressionRoom.tsx`, `components/VoiceCapture.tsx`

**Interfaces:** Consumes `useThemedStyles`, `ScreenHeader`, `GlassSurface`, `useReduceMotion`.
- Pattern for every file: `const createStyles = (t: ThemeTokens) => StyleSheet.create({...})` at module bottom, `const styles = useThemedStyles(createStyles)` in the component; `palette.X` → matching token (`ink, muted, soft, border, accent, accentDark, onAccent, danger, cardBg, cardBorder, surface, surfaceElevated`). Category colours stay `categoryAccent`.
- Home header → `ScreenHeader variant="gradient"` (title = date, no subtitle — user removed the companion line). Quadrants use `theme.cardBg` (near-opaque in glass, see Task 2) with the category accent top border kept. Sync chips + mic FAB + bubble use `GlassSurface`. `AmbientAvatar` pulse stops when `useReduceMotion()`.
- [ ] **Step 1:** Convert files; grep check `grep -nE "palette\.|'#[0-9A-Fa-f]{6}'" <files>` → only category colours / intentional constants remain.
- [ ] **Step 2:** tsc clean; screenshot Home in Light, Dark, Glass × teal and amber — text readable, header icons light.
- [ ] **Step 3:** Commit `feat(home): theme tokens and glass chrome`.

### Task 8: Ideas, Add Reminder and sheets on tokens

**Files:** Modify `app/(tabs)/ideas.tsx`, `components/ideas/*.tsx`, `components/AddReminderForm.tsx`, `app/add-reminder.tsx`, `components/CategoryFilter.tsx`

- Same conversion pattern as Task 7. Ideas header → `ScreenHeader variant="glass"`; Ideas follows the theme (no longer hard-coded dark); filter chips are `GlassSurface` pills; idea cards on `cardBg`. Add Reminder native header uses `theme.surface`/`theme.ink`; its Android `StatusBar` style comes from `theme.mode`.
- [ ] **Step 1:** Convert; grep check as Task 7.
- [ ] **Step 2:** tsc clean; screenshots of Ideas + Add Reminder in all three schemes.
- [ ] **Step 3:** Commit `feat(ideas): theme tokens and glass filters`.

### Task 9: Manifest chrome on tokens

**Files:** Modify `app/(tabs)/manifestation.tsx`, `components/manifestation/PillarCard.tsx`, `RealityLock.tsx`, `VoiceEchoSheet.tsx`

- Pillar grid and ambient background stay dark/immersive in every mode (Global Constraints). Header → `ScreenHeader variant="glass"` with identity code; Aura badge, voice-mix chips, Voice Echo / Vision Synth buttons → `GlassSurface` with accent; pillar card text gets a 35% dark scrim (`rgba(0,0,0,0.35)`) over photos; Vision sheet + Voice Echo sheet use `theme.surface`.
- [ ] **Step 1:** Convert; tsc clean.
- [ ] **Step 2:** Screenshot Manifest in Light and Glass; identity code and pillar text readable.
- [ ] **Step 3:** Commit `feat(manifest): glass chrome on immersive deck`.

### Task 10: Status bar, docs and full verification

**Files:** Modify `app/_layout.tsx` (`<StatusBar style={theme.statusBar} />` replaces the fixed `"light"`), `app/settings.tsx` (status bar from `theme.mode`), `docs/THEMING.md`, `docs/ARCHITECTURE.md`, `README.md` (layout section: `app/(tabs)/`, `components/glass/`)

- [ ] **Step 1:** Update status bar + docs (THEMING.md: prefs model, tokens, GlassSurface tiers, how to add an accent).
- [ ] **Step 2: Verify:** `npm test` → all pass; `npx tsc --noEmit` → clean; `CI=1 npx expo export --platform android` → succeeds; emulator pass of the Review Focus list + Task 4/6 manual checks; no `E ReactNativeJS` lines in `adb logcat`.
- [ ] **Step 3:** Commit `docs(theme): document preferences and glass materials`.
