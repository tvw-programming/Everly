import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  active: 'home' | 'manifest';
};

export function BottomDock({ active }: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.bottomNav,
        {
          borderTopColor: theme.border,
          backgroundColor: theme.navBg,
        },
        theme.id === 'glass' && styles.glassNav,
      ]}
    >
      <Link href="/" asChild>
        <Pressable style={styles.navSide}>
          <Text style={[styles.navIcon, { color: active === 'home' ? theme.accent : theme.muted }]}>
            ⌂
          </Text>
          <Text
            style={[styles.navLabel, { color: active === 'home' ? theme.accent : theme.muted }]}
          >
            Home
          </Text>
        </Pressable>
      </Link>

      <Link href="/add-reminder" asChild>
        <Pressable
          style={[styles.fab, { backgroundColor: theme.accent, shadowColor: theme.accentDark }]}
          accessibilityLabel="Add reminder manually"
        >
          <Text style={[styles.fabPlus, { color: theme.onAccent }]}>+</Text>
        </Pressable>
      </Link>

      <Link href="/manifestation" asChild>
        <Pressable style={styles.navSide}>
          <Text
            style={[styles.navIcon, { color: active === 'manifest' ? theme.accent : theme.muted }]}
          >
            ✦
          </Text>
          <Text
            style={[
              styles.navLabel,
              { color: active === 'manifest' ? theme.accent : theme.muted },
            ]}
          >
            Manifest
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  glassNav: {
    // @ts-expect-error web backdrop
    backdropFilter: 'blur(20px)',
  },
  navSide: { width: 72, alignItems: 'center', gap: 2, paddingBottom: 4 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 11, fontWeight: '600' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  fabPlus: { fontSize: 30, marginTop: -2 },
});
