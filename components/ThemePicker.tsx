import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeContext';
import { themes } from '@/lib/theme/themes';
import type { ThemeId } from '@/lib/theme/types';
import { THEME_IDS } from '@/lib/theme/types';

const LABELS: Record<ThemeId, string> = {
  light: 'Light',
  dark: 'Dark',
  glass: '3D Glass',
};

type Props = {
  compact?: boolean;
};

export function ThemePicker({ compact }: Props) {
  const { themeId, theme, setThemeId } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.soft,
          borderColor: theme.border,
        },
        theme.id === 'glass' && styles.glassWrap,
      ]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme"
    >
      {!compact ? <Text style={[styles.label, { color: theme.muted }]}>Theme</Text> : null}
      <View style={styles.row}>
        {THEME_IDS.map((id) => {
          const active = themeId === id;
          const preview = themes[id];
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setThemeId(id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.accent : theme.surfaceElevated,
                  borderColor: active ? theme.accent : theme.border,
                },
                theme.id === 'glass' && !active && styles.glassChip,
              ]}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: preview.canvas,
                    borderColor: preview.accent,
                  },
                  id === 'glass' && styles.swatchGlass,
                ]}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: active ? theme.onAccent : theme.ink },
                ]}
              >
                {LABELS[id]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  glassWrap: {
    // @ts-expect-error web backdrop
    backdropFilter: 'blur(18px)',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  glassChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  swatchGlass: {
    // @ts-expect-error web gradient swatch
    backgroundImage:
      'linear-gradient(135deg, #22D3EE 0%, #F59E0B 50%, #10B981 100%)',
  },
  chipText: { fontSize: 11, fontWeight: '800' },
});
