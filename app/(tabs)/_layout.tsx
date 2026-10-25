import { Tabs } from 'expo-router';

import { GlassDock } from '@/components/glass/GlassDock';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassDock {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="alarms" options={{ title: 'Alarms' }} />
      <Tabs.Screen name="ideas" options={{ title: 'Ideas' }} />
      <Tabs.Screen name="manifestation" options={{ title: 'Manifest' }} />
    </Tabs>
  );
}
