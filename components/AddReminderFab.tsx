import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { CaptureMenu } from '@/components/CaptureMenu';
import { useDockInset } from '@/components/glass/GlassDock';
import { impact } from '@/lib/haptics';
import { useTheme } from '@/lib/theme/ThemeContext';

/** The Home board's primary action: open the Add Reminder form. */
export function AddReminderFab() {
  const { theme } = useTheme();
  const dockInset = useDockInset();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.fab, { bottom: dockInset + 8, backgroundColor: theme.accent }]}
        onPress={() => router.push('/alarm-edit')}
        onLongPress={() => {
          impact('light');
          setMenuOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add reminder"
        accessibilityHint="Long press for more ways to add"
      >
        <SymbolView
          name={Platform.OS === 'ios' ? ('plus' as never) : ('add' as never)}
          tintColor={theme.onAccent}
          size={26}
          fallback={<Text style={[styles.icon, { color: theme.onAccent }]}>+</Text>}
        />
      </Pressable>

      <CaptureMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorBottom={dockInset + 72}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  icon: { fontSize: 28, fontWeight: '300', marginTop: -2 },
});
