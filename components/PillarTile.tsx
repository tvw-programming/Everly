import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/Colors';
import type { ManifestPillar } from '@/lib/manifestation/types';

type Props = {
  pillar: ManifestPillar;
  active?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

export function PillarTile({ pillar, active, onPress, onLongPress }: Props) {
  const source = pillar.customStillUri
    ? { uri: pillar.customStillUri }
    : pillar.stillAsset;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.tile,
        { borderColor: pillar.accent },
        active && { shadowColor: pillar.accent, shadowOpacity: 0.55 },
      ]}
    >
      <ImageBackground source={source} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.glass}>
          <Text style={[styles.label, { color: pillar.accent }]}>{pillar.label}</Text>
          <Text style={styles.identity} numberOfLines={3}>
            {pillar.identity}
          </Text>
          <Text style={styles.micro} numberOfLines={1}>
            {pillar.microStrip}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  bg: { flex: 1 },
  bgImage: { opacity: 0.55 },
  glass: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(12,16,18,0.55)',
    justifyContent: 'space-between',
  },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  identity: { fontSize: 11, lineHeight: 15, color: palette.white, fontWeight: '600' },
  micro: { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
});
