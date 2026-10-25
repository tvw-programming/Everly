import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

import { pickOnColor } from '@/lib/theme/color';
import { useTheme } from '@/lib/theme/ThemeContext';
import { RADIUS, SPACE } from '@/lib/theme/tokens';
import { isHexColor } from '@/lib/theme/types';

type Props = {
  label: string;
  colors: readonly string[];
  value: string;
  onChange: (hex: string) => void;
};

/** A row of colour presets plus a free-form hex field for anything else. */
export function SwatchRow({ label, colors, value, onChange }: Props) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState(value);
  const custom = !colors.some((c) => c.toLowerCase() === value.toLowerCase());

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="labelLarge" style={{ color: theme.muted }}>
          {label}
        </Text>
        <View style={[styles.chip, { backgroundColor: theme.soft, borderColor: theme.border }]}>
          <Text style={{ color: theme.ink, fontSize: 12 }}>{value.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {colors.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} ${color}`}
              style={[
                styles.swatch,
                { backgroundColor: color, borderColor: selected ? theme.ink : 'transparent' },
              ]}
            >
              {selected ? (
                <Text style={{ color: pickOnColor(color), fontSize: 18 }}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <TextInput
        mode="outlined"
        dense
        label="Custom hex"
        value={custom ? draft : ''}
        placeholder="#4527A0"
        autoCapitalize="characters"
        autoCorrect={false}
        onChangeText={(text) => {
          setDraft(text);
          if (isHexColor(text)) onChange(text);
        }}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE[1], marginTop: SPACE[2] },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { borderRadius: RADIUS.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { marginTop: 2 },
});
