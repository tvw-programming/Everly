import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { SyncScore } from '@/lib/companion/types';

type Props = {
  score: SyncScore;
  onHydration: () => void;
  onMovement: () => void;
};

export function SyncScoreBadge({ score, onHydration, onMovement }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Sync {score.hydrationSyncs + score.movementSyncs} · Tier {score.unlockTier}
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.chip} onPress={onHydration}>
          <Text style={styles.chipText}>💧 Together</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={onMovement}>
          <Text style={styles.chipText}>🚶 Move</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, paddingBottom: 2 },
  label: { fontSize: 10, fontWeight: '700', color: t.muted },
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: t.soft,
    borderWidth: 1,
    borderColor: t.border,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: t.ink },
});
