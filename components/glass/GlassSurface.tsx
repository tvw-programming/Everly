import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceTransparency } from '@/lib/a11y';
import { useTheme } from '@/lib/theme/ThemeContext';
import { RADIUS } from '@/lib/theme/tokens';

import { pickGlassTier } from './tier';

/** Both checks must pass: some iOS 26 builds expose the API but crash on use. */
function liquidGlassUsable(): boolean {
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius; the surface clips its material to it */
  radius?: number;
  /** Blur strength for the blur tier */
  intensity?: number;
  /** Elevated surfaces read slightly brighter than inline ones */
  elevated?: boolean;
};

/**
 * One translucent panel, drawn with the best material this device supports:
 * Liquid Glass → system blur → painted gradient → opaque fill.
 */
export function GlassSurface({ children, style, radius, intensity, elevated }: Props) {
  const { theme } = useTheme();
  const reduceTransparency = useReduceTransparency();
  const corner = radius ?? RADIUS.md;
  const blur = intensity ?? theme.blur;
  const tier = pickGlassTier({
    os: Platform.OS,
    liquidAvailable: liquidGlassUsable(),
    reduceTransparency,
    style: theme.style,
  });

  const shell: StyleProp<ViewStyle> = [
    styles.shell,
    {
      borderRadius: corner,
      borderColor: tier === 'solid' ? theme.border : theme.glass.border,
      ...(tier === 'solid' ? ELEV_1 : theme.style === 'glass3d' ? ELEV_GLASS_3D : ELEV_GLASS),
      shadowColor: theme.shadow,
    },
    style,
  ];

  // 3D tier: a sheen gradient across the top ~40% of the surface.
  const sheen =
    theme.style === 'glass3d' && tier !== 'solid' ? (
      <LinearGradient
        pointerEvents="none"
        colors={[theme.glass.sheen, 'transparent']}
        style={[styles.sheen, { borderTopLeftRadius: corner, borderTopRightRadius: corner }]}
      />
    ) : null;

  if (tier === 'liquid') {
    return (
      <GlassView
        style={shell}
        glassEffectStyle="regular"
        tintColor={theme.cardBg}
        isInteractive={false}
      >
        {sheen}
        {children}
      </GlassView>
    );
  }

  if (tier === 'blur') {
    return (
      <View style={shell}>
        <BlurView
          intensity={blur}
          tint={theme.glassTint === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
          style={[StyleSheet.absoluteFill, { borderRadius: corner }]}
        />
        {sheen}
        {children}
      </View>
    );
  }

  const fill =
    tier === 'solid'
      ? elevated
        ? theme.surfaces.overlay
        : theme.surfaces.raised
      : elevated
        ? theme.surfaceElevated
        : theme.cardBg;

  return (
    <View style={[shell, { backgroundColor: fill }]}>
      {sheen}
      {children}
    </View>
  );
}

/** elev-1 / elev-glass / elev-glass-3d — never mixed with each other. */
const ELEV_1 = { shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 };
const ELEV_GLASS = { shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 };
const ELEV_GLASS_3D = { shadowOpacity: 0.32, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 };

const styles = StyleSheet.create({
  shell: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
});
