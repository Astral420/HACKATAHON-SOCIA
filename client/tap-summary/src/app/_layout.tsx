import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function Layout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#141414' },
        headerTitleStyle: { fontWeight: '700', color: '#fff' },
        headerTintColor: '#3b82f6',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0a0a0a' }
      }}>
        <Stack.Screen name="index" options={{ title: 'Meetings' }} />
        <Stack.Screen name="detail" options={{ title: 'Meeting Output' }} />
        <Stack.Screen name="create" options={{ title: 'New Meeting' }} />
        <Stack.Screen name="share" options={{ title: 'Share with Client', headerBackVisible: false }} />
      </Stack>
    </>
  );
}
