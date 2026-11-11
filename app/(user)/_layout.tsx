import { Stack } from 'expo-router';
import { View } from 'react-native';
import { UpdateToast } from '@/components/update-toast';
import { useAuth } from '@/context/AuthContext';
import { StatusUpdatesProvider } from '@/lib/status-updates';

export const unstable_settings = { anchor: '(tabs)' };

export default function UserLayout() {
  const { user } = useAuth();
  return (
    <StatusUpdatesProvider key={user?.userId}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-request" />
          <Stack.Screen name="document/[id]" />
        </Stack>
        <UpdateToast />
      </View>
    </StatusUpdatesProvider>
  );
}
