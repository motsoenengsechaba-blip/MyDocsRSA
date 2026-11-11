import { Tabs } from 'expo-router';

import { tabIcon, tabScreenOptions } from '@/components/tab-icon';

export default function OfficerTabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="queue" options={{ title: 'Queue', tabBarIcon: tabIcon('list', 'list-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
