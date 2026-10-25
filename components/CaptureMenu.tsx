import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useTheme } from '@/lib/theme/ThemeContext';

import { GlassSurface } from './glass/GlassSurface';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Distance from the bottom of the screen, so the sheet clears the dock and mic. */
  anchorBottom: number;
};

const ITEMS = [
  { key: 'reminder', icon: '✎', label: 'Type a reminder', href: '/add-reminder' },
  { key: 'idea', icon: '💡', label: 'Capture idea', href: '/ideas?capture=1' },
] as const;

/** Secondary create paths, reached by long-pressing the mic. */
export function CaptureMenu({ visible, onClose, anchorBottom }: Props) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu">
        <View style={[styles.sheet, { bottom: anchorBottom }]} pointerEvents="box-none">
          {ITEMS.map((item) => (
            <GlassSurface key={item.key} style={styles.row} radius={18} elevated>
              <Pressable
                style={styles.press}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  onClose();
                  router.push(item.href as never);
                }}
              >
                <Text style={[styles.icon, { color: theme.accent }]}>{item.icon}</Text>
                <Text style={{ color: theme.ink, fontWeight: '700' }}>{item.label}</Text>
              </Pressable>
            </GlassSurface>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', right: 16, left: 60, gap: 10 },
  row: { overflow: 'hidden' },
  press: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 56 },
  icon: { fontSize: 18 },
});
