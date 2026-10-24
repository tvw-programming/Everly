import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

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
    return <View style={[styles.fill, { backgroundColor: theme.canvas }]}>{children}</View>;
  }

  const phoneWidth = Math.min(390, width - 48);
  const phoneHeight = Math.min(780, height - 48);
  const frameBorder =
    theme.id === 'glass' ? 'rgba(255,255,255,0.35)' : theme.mode === 'dark' ? '#1F2937' : '#1C1C1E';

  return (
    <View style={[styles.stage, { backgroundColor: theme.stage }]}>
      <View
        style={[
          styles.phone,
          {
            width: phoneWidth,
            height: phoneHeight,
            backgroundColor: theme.canvas,
            borderColor: frameBorder,
            shadowColor: theme.id === 'glass' ? '#22D3EE' : '#000',
            shadowOpacity: theme.id === 'glass' ? 0.35 : 0.2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  phone: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
});
