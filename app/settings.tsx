import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, SegmentedButtons, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/GlassSurface';
import { CategoryLegend } from '@/components/settings/CategoryLegend';
import { ReliabilitySection } from '@/components/settings/ReliabilitySection';
import { SwatchRow } from '@/components/settings/SwatchRow';
import { PRIMARY_SWATCHES, SECONDARY_SWATCHES } from '@/lib/theme/accents';
import { useTheme } from '@/lib/theme/ThemeContext';
import { RADIUS, SPACE } from '@/lib/theme/tokens';
import { THEME_STYLES, STYLE_LABELS } from '@/lib/theme/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { prefs, theme, setMode, setStyle, setPrimary, setSecondary, resetTheme } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.canvas }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.titleRow}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.ink}
          accessibilityLabel="Back"
          onPress={() => router.back()}
        />
        <Text variant="headlineSmall" style={[styles.title, { color: theme.ink }]}>
          Settings
        </Text>
      </View>

      <Text variant="labelLarge" style={[styles.section, { color: theme.muted }]}>
        Mode
      </Text>
      <SegmentedButtons
        value={prefs.mode}
        onValueChange={(v) => setMode(v as typeof prefs.mode)}
        style={styles.segmented}
        buttons={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />

      <Text variant="labelLarge" style={[styles.section, { color: theme.muted }]}>
        Style
      </Text>
      <SegmentedButtons
        value={prefs.style}
        onValueChange={(v) => setStyle(v as typeof prefs.style)}
        style={styles.segmented}
        buttons={THEME_STYLES.map((id) => ({ value: id, label: STYLE_LABELS[id] }))}
      />

      <SwatchRow
        label="Primary color"
        colors={PRIMARY_SWATCHES}
        value={prefs.primary}
        onChange={setPrimary}
      />

      <SwatchRow
        label="Secondary color"
        colors={SECONDARY_SWATCHES}
        value={prefs.secondary}
        onChange={setSecondary}
      />

      <Text variant="labelLarge" style={[styles.section, { color: theme.muted }]}>
        Category colors
      </Text>
      <CategoryLegend />

      <Text variant="labelLarge" style={[styles.section, { color: theme.muted }]}>
        Preview
      </Text>
      <GlassSurface style={styles.preview} radius={RADIUS.md} elevated>
        <Text variant="titleMedium" style={{ color: theme.ink }}>
          {STYLE_LABELS[prefs.style]} · {prefs.mode}
        </Text>
        <Text style={{ color: theme.muted }}>Cards, chips and the dock use this material.</Text>
        <View style={styles.previewRow}>
          <Button mode="contained" onPress={() => undefined}>
            Primary
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.accentSecondary}
            textColor={theme.onAccentSecondary}
            onPress={() => undefined}
          >
            Secondary
          </Button>
        </View>
      </GlassSurface>

      <Button mode="outlined" style={styles.reset} onPress={resetTheme}>
        Reset to defaults
      </Button>

      <Text variant="labelLarge" style={[styles.section, { color: theme.muted }]}>
        Reminder reliability
      </Text>
      <ReliabilitySection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SPACE[2], gap: SPACE[1] },
  segmented: { borderRadius: RADIUS.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -12, marginBottom: 4 },
  title: { fontWeight: '800' },
  section: { marginTop: 14, textTransform: 'none' },
  preview: { padding: SPACE[2], gap: SPACE[1] },
  previewRow: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  reset: { marginTop: SPACE[3], borderRadius: RADIUS.pill },
});
