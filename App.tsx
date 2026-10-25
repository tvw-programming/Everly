import 'react-native-gesture-handler';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AddReminderScreen from '@/app/add-reminder';
import IdeasScreen from '@/app/ideas';
import RemindersDashboard from '@/app';
import ManifestationScreen from '@/app/manifestation';
import { useColorScheme } from '@/components/useColorScheme';
import { palette } from '@/constants/Colors';
import { configureAudioMode } from '@/lib/audio';
import type { RootStackParamList } from '@/lib/navigation';
import { attachNotificationListeners } from '@/lib/notifications';
import { ThemeProvider as EverlyThemeProvider } from '@/lib/theme/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Home: '',
      Ideas: 'ideas',
      AddReminder: 'add-reminder',
      Manifestation: {
        path: 'manifestation',
        parse: {
          pillar: (value) =>
            (['personal', 'social', 'economical', 'professional'] as const).find(
              (pillar) => pillar === value
            ),
        },
      },
    },
  },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded, error] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (error || loaded) {
      setFontsReady(true);
      void SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFontsReady(true);
      void SplashScreen.hideAsync();
    }, 2500);
    return () => clearTimeout(timeout);
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

  return (
    <EverlyThemeProvider>
      <RootNavigator />
    </EverlyThemeProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer linking={linking} theme={theme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            cardStyle: styles.content,
            headerStyle: styles.header,
            headerTintColor: palette.ink,
            headerTitleStyle: styles.headerTitle,
          }}
        >
          <Stack.Screen
            name="Home"
            component={RemindersDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddReminder"
            component={AddReminderScreen}
            options={{
              presentation: Platform.OS === 'web' ? 'card' : 'modal',
              title: 'Create New Reminder',
            }}
          />
          <Stack.Screen
            name="Ideas"
            component={IdeasScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Manifestation"
            component={ManifestationScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    backgroundColor: palette.white,
  },
  header: {
    backgroundColor: palette.white,
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: '700',
    color: palette.accent,
  },
});
