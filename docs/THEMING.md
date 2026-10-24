# Theming

Everly supports three selectable appearance modes:

| Id | Label | Intent |
| --- | --- | --- |
| `light` | Light | White canvas, teal accent — original executive board |
| `dark` | Dark | Ink surfaces, teal highlight, subtle vertical wash |
| `glass` | 3D Glass | Multi-orb / multi-stop gradient canvas + frosted panels |

## Modules

| Path | Role |
| --- | --- |
| `lib/theme/types.ts` | `ThemeId`, `ThemeTokens` |
| `lib/theme/themes.ts` | Token tables + CSS `canvasGradient` for web |
| `lib/theme/storage.ts` | Persist `@everly/theme/v1` |
| `lib/theme/ThemeContext.tsx` | `ThemeProvider`, `useTheme()` |
| `components/ThemePicker.tsx` | Segmented Light / Dark / 3D Glass control |
| `components/ThemedCanvas.tsx` | Gradient/orb background wrapper |
| `components/PhoneShell.tsx` | Stage + device frame colors from theme |
| `components/BottomDock.tsx` | Nav / FAB colors from theme |

Legacy static colors remain in `constants/Colors.ts` (`palette`, `categoryAccent`) for screens not yet migrated.

## Wire-up checklist (complete integration)

1. Wrap the root Stack with `ThemeProvider` in `app/_layout.tsx` (outermost React tree under fonts).
2. On Home / Manifest roots, wrap content in `ThemedCanvas` and replace hard-coded `palette.*` StyleSheet colors with `useTheme().theme.*`.
3. Mount `<ThemePicker />` in the Home header area (and optionally Manifest tools row).
4. Drive React Navigation `ThemeProvider` (`DarkTheme` / `DefaultTheme`) from `theme.mode` instead of system `useColorScheme` alone.
5. For glass cards, apply:

```ts
{
  backgroundColor: theme.cardBg,
  borderColor: theme.cardBorder,
  // web:
  backdropFilter: theme.blur ? 'blur(18px)' : undefined,
}
```

## Token usage guide

| Token | Use for |
| --- | --- |
| `canvas` / `canvasGradient` | Screen background |
| `stage` | Outside PhoneShell on wide web |
| `surface` / `surfaceElevated` | Sheets, elevated chips |
| `cardBg` / `cardBorder` | Quadrants, glass tiles |
| `ink` / `muted` | Primary / secondary text |
| `accent` / `onAccent` | FAB, active nav, CTAs |
| `headerBg` / `headerText` | Home teal header (or glass translucent header) |
| `navBg` | Bottom dock |

Category accents (`personal` / `social` / `professional`) stay semantic and are **not** theme-swapped — they identify buckets.

## Persistence

```ts
const { themeId, setThemeId, theme } = useTheme();
setThemeId('glass'); // writes AsyncStorage immediately
```

Default when unset: `light`.

## Glass mode rendering notes

- **Web:** Prefer `theme.canvasGradient` (radial + linear stack) via `backgroundImage` on `ThemedCanvas`.
- **Native:** Absolute “orb” Views approximate the 3D wash; no real backdrop-filter on all RN targets.
- Keep text on `theme.ink` with sufficient contrast over translucent cards.

## Extending

Add a new mode:

1. Extend `ThemeId` union + `THEME_IDS`
2. Add entry in `themes.ts`
3. Add label in `ThemePicker`
4. No storage migration needed (string id)
