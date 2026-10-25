import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { GradientCanvas } from '@/components/glass/GradientCanvas';
import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
};

/** Centers a smartphone-width frame on large web viewports. */
export function PhoneShell({ children }: Props) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const framed = Platform.OS === 'web' && width > 480;

  if (!framed) {
    return <GradientCanvas>{children}</GradientCanvas>;
  }

  return (
    <View style={[styles.stage, { backgroundColor: theme.stage }]}>
      <View
        style={[
          styles.phone,
          {
            width: Math.min(390, width - 48),
            height: Math.min(780, height - 48),
            borderColor: theme.mode === 'dark' ? '#1F2937' : '#1C1C1E',
            shadowColor: theme.shadow,
          },
        ]}
      >
        <GradientCanvas>{children}</GradientCanvas>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  phone: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 8,
    shadowRadius: 24,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 12 },
  },
});
