import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Splash } from '@/components/splash';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigator() {
  const { user, loading } = useAuth();

  // Wait until the saved login (if any) has been restored; show the welcome screen meanwhile
  if (loading) return <Splash />;

  // Role-based routing: each group is only reachable by the matching role.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={user?.role === 'USER'}>
        <Stack.Screen name="(user)" />
      </Stack.Protected>

      <Stack.Protected guard={user?.role === 'POLICE_OFFICER'}>
        <Stack.Screen name="(officer)" />
      </Stack.Protected>

      <Stack.Protected guard={user?.role === 'ADMIN'}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
