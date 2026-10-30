import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PaperProvider } from 'react-native-paper';

import { attachAlarmBootstrap } from '@/lib/alarms/bootstrap';
import { attachPracticeBootstrap } from '@/lib/practice/bootstrap';
import { configureAudioMode } from '@/lib/audio';
import { attachNotificationListeners } from '@/lib/notifications';
import { ThemeProvider as EverlyThemeProvider, useTheme } from '@/lib/theme/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (error || loaded) {
      setFontsReady(true);
      void SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFontsReady(true);
      void SplashScreen.hideAsync();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void configureAudioMode();
    }
    const detachNotifs = attachNotificationListeners();
    const detachAlarms = attachAlarmBootstrap();
    const detachPractice = attachPracticeBootstrap();
    return () => {
      detachNotifs?.();
      detachAlarms();
      detachPractice();
    };
  }, []);

  if (!fontsReady && !loaded) {
    return null;
  }

  return (
    <EverlyThemeProvider>
      <RootLayoutNav />
    </EverlyThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider
      theme={theme.paper}
      settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
    >
      <ThemeProvider
        value={{
          ...navTheme,
          colors: { ...navTheme.colors, background: theme.canvas, primary: theme.accent },
        }}
      >
        <StatusBar style={theme.statusBar} />
        <Stack screenOptions={{ contentStyle: { backgroundColor: theme.canvas } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-reminder"
            options={{
              presentation: Platform.OS === 'web' ? 'card' : 'modal',
              title: 'Create New Reminder',
              headerStyle: { backgroundColor: theme.surface },
              headerTintColor: theme.ink,
              headerTitleStyle: { fontWeight: '700', color: theme.accent },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="alarm-edit"
            options={{
              presentation: Platform.OS === 'web' ? 'card' : 'modal',
              title: 'Alarm',
              headerShown: false,
            }}
          />
          <Stack.Screen name="alarm-reliability" options={{ headerShown: false }} />
          <Stack.Screen name="alarm-active" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="practice-session" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="practice-woop" options={{ headerShown: false }} />
          <Stack.Screen name="practice-review" options={{ headerShown: false }} />
          <Stack.Screen name="practice-anxious" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="practice-voice" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
