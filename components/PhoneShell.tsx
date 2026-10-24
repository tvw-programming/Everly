import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { palette } from '@/constants/Colors';

type Props = {
  children: React.ReactNode;
};

/** Centers a smartphone-width frame on large web viewports. */
export function PhoneShell({ children }: Props) {
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 480;

  if (!framed) {
    return <View style={styles.fill}>{children}</View>;
  }

  const phoneWidth = Math.min(390, width - 48);
  const phoneHeight = Math.min(780, height - 48);

  return (
    <View style={styles.stage}>
      <View style={[styles.phone, { width: phoneWidth, height: phoneHeight }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    backgroundColor: palette.white,
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8ED',
    padding: 24,
  },
  phone: {
    backgroundColor: palette.white,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
});
