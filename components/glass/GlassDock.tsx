import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectionTick } from '@/lib/haptics';
import { useTheme } from '@/lib/theme/ThemeContext';

import { GlassSurface } from './GlassSurface';

export const DOCK_HEIGHT = 64;

/** Space floating UI must leave clear above the dock. */
export function useDockInset(): number {
  const insets = useSafeAreaInsets();
  return DOCK_HEIGHT + insets.bottom + 12;
}

type IconSpec = { ios: string; android: string; glyph: string };

const ICONS: Record<string, IconSpec> = {
  index: { ios: 'house.fill', android: 'home', glyph: '⌂' },
  practice: { ios: 'checkmark.circle.fill', android: 'task_alt', glyph: '◎' },
  ideas: { ios: 'lightbulb.fill', android: 'lightbulb', glyph: '💡' },
  manifestation: { ios: 'sparkles', android: 'auto_awesome', glyph: '✦' },
};

const LABELS: Record<string, string> = {
  index: 'Home',
  practice: 'Practice',
  ideas: 'Ideas',
  manifestation: 'Manifest',
};

export function GlassDock({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
      <GlassSurface style={styles.bar} radius={28} elevated>
        <View style={styles.row} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const icon = ICONS[route.name] ?? ICONS.index;
            const label = descriptors[route.key]?.options.title ?? LABELS[route.name] ?? route.name;
            const color = focused ? theme.onAccent : theme.muted;

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = emitter.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    selectionTick();
                    navigateToTab(route.key);
                  }
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={`${label}, tab, ${index + 1} of ${state.routes.length}`}
                style={[
                  styles.item,
                  focused && { backgroundColor: theme.accent },
                ]}
              >
                <SymbolView
                  name={Platform.OS === 'ios' ? (icon.ios as never) : (icon.android as never)}
                  tintColor={color}
                  size={22}
                  fallback={<Text style={[styles.glyph, { color }]}>{icon.glyph}</Text>}
                />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  bar: { height: DOCK_HEIGHT, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  item: {
    minWidth: 52,
    minHeight: 48,
    paddingHorizontal: 6,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  glyph: { fontSize: 18 },
  label: { fontSize: 11, fontWeight: '700' },
});
