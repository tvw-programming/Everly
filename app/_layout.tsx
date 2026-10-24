import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { palette } from '@/constants/Colors';
import { configureAudioMode } from '@/lib/audio';
import { attachNotificationListeners } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (error) {
      setFontsReady(true);
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setFontsReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFontsReady(true);
      SplashScreen.hideAsync();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void configureAudioMode();
    }
    return attachNotificationListeners();
  }, []);

  if (!fontsReady && !loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          contentStyle: styles.content,
          headerStyle: styles.header,
          headerTintColor: palette.ink,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add-reminder"
          options={{
            presentation: Platform.OS === 'web' ? 'card' : 'modal',
            title: 'Create New Reminder',
          }}
        />
        <Stack.Screen
          name="manifest"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    backgroundColor: palette.white,
  },
  header: {
    backgroundColor: palette.white,
  },
  headerTitle: {
    fontWeight: '700',
    color: palette.accent,
  },
});
