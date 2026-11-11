import { Tabs } from 'expo-router';

import { tabIcon, tabScreenOptions } from '@/components/tab-icon';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="overview" options={{ title: 'Overview', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }} />
      <Tabs.Screen name="all-requests" options={{ title: 'Requests', tabBarIcon: tabIcon('document-text', 'document-text-outline') }} />
      <Tabs.Screen name="people" options={{ title: 'People', tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen name="all-credentials" options={{ title: 'Cards', tabBarIcon: tabIcon('card', 'card-outline') }} />
      <Tabs.Screen name="admin-account" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
