import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { ensureSession } from '@/client/supabase';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import "../global.css";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

const RootLayout: React.FC = () => {
  useEffect(() => { void ensureSession().catch((error) => console.warn("Anonymous session initialization failed", error)); }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="#F8FAFC" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="account" options={{ presentation: "modal" }} />
      </Stack>
      <PortalHost />
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);
