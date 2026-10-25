import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRootNavigation } from '@/lib/navigation';
import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  active: 'home' | 'ideas' | 'manifest';
};

export function BottomDock({ active }: Props) {
  const { theme } = useTheme();
  const navigation = useRootNavigation();

  const color = (key: Props['active']) => (active === key ? theme.accent : theme.muted);

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
      <Pressable style={styles.navSide} onPress={() => navigation.navigate('Home')}>
        <Text style={[styles.navIcon, { color: color('home') }]}>⌂</Text>
        <Text style={[styles.navLabel, { color: color('home') }]}>Home</Text>
      </Pressable>

      <Pressable style={styles.navSide} onPress={() => navigation.navigate('Ideas')}>
        <Text style={[styles.navIcon, { color: color('ideas') }]}>💡</Text>
        <Text style={[styles.navLabel, { color: color('ideas') }]}>Ideas</Text>
      </Pressable>

      <Pressable
        style={styles.navSide}
        onPress={() => navigation.navigate('Manifestation')}
      >
        <Text style={[styles.navIcon, { color: color('manifest') }]}>✦</Text>
        <Text style={[styles.navLabel, { color: color('manifest') }]}>Manifest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  glassNav: {
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' } as object,
      default: {},
    }),
  },
  navSide: { width: 80, alignItems: 'center', gap: 2, paddingBottom: 4 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 11, fontWeight: '600' },
});
