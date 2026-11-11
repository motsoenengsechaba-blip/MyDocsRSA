import { Stack } from 'expo-router';

export default function OfficerLayout() {
  // Screens draw their own blue header (with a back arrow), so the native header is off
  return <Stack screenOptions={{ headerShown: false }} />;
}
