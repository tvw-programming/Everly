import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';

type Props = {
  active: 'home' | 'manifest';
};

export function BottomDock({ active }: Props) {
  return (
    <View style={styles.bottomNav}>
      <Link href="/" asChild>
        <Pressable style={styles.navSide}>
          <Text style={[styles.navIcon, active === 'home' && styles.navActive]}>⌂</Text>
          <Text style={[styles.navLabel, active === 'home' && styles.navActive]}>Home</Text>
        </Pressable>
      </Link>

      <Link href="/add-reminder" asChild>
        <Pressable style={styles.fab} accessibilityLabel="Add reminder manually">
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>
      </Link>

      <Link href="/manifest" asChild>
        <Pressable style={styles.navSide}>
          <Text style={[styles.navIcon, active === 'manifest' && styles.navActive]}>◈</Text>
          <Text style={[styles.navLabel, active === 'manifest' && styles.navActive]}>Manifest</Text>
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
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  navSide: { width: 72, alignItems: 'center', gap: 2, paddingBottom: 4 },
  navIcon: { fontSize: 18, color: palette.muted },
  navLabel: { fontSize: 11, fontWeight: '600', color: palette.muted },
  navActive: { color: palette.accent },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  fabPlus: { color: palette.white, fontSize: 30, marginTop: -2 },
});
