import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { ManifestPillarId } from '@/lib/manifestation/types';

export type RootStackParamList = {
  Home: undefined;
  Ideas: undefined;
  AddReminder: undefined;
  Manifestation: { pillar?: ManifestPillarId } | undefined;
};

export type RootNavigation = StackNavigationProp<RootStackParamList>;

export function useRootNavigation() {
  return useNavigation<RootNavigation>();
}
