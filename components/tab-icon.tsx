import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


import type { IconName } from '@/components/ui-kit';
import { colors } from '@/constants/colors';

/** Builds a tab-bar icon that is filled when its tab is selected and outlined otherwise. */
export function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} color={typeof color === 'string' ? color : colors.faint} size={size} />;
  };
}

/** Shared look of the bottom tab bar: white, emerald when selected. */
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.faint,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
  tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border },
};
