import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { SyncScore } from '@/lib/companion/types';

type Props = {
  score: SyncScore;
  onHydration: () => void;
  onMovement: () => void;
};

export function SyncScoreBadge({ score, onHydration, onMovement }: Props) {
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

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, paddingBottom: 2 },
  label: { fontSize: 10, fontWeight: '700', color: palette.muted },
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: palette.soft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: palette.ink },
});
