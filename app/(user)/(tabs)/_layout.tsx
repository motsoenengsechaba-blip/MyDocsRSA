import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/tab-icon';
import { colors } from '@/constants/colors';
import { useStatusUpdates } from '@/lib/status-updates';

export const unstable_settings = { anchor: 'wallet' };

export default function UserTabs() {
  const { updates } = useStatusUpdates();
  return (
    <Tabs backBehavior="initialRoute" screenOptions={tabScreenOptions}>
      <Tabs.Screen name="wallet" options={{ title: 'Documents', tabBarIcon: tabIcon('folder', 'folder-outline') }} />
      <Tabs.Screen name="requests" options={{ title: 'Requests', tabBarIcon: tabIcon('time', 'time-outline'),
        tabBarBadge: updates.length || undefined, tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#FFFFFF' } }} />
      <Tabs.Screen name="account" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
