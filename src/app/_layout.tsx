import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GateProvider } from '../components/UnblockGate';
import { StoreProvider, useStore } from '../lib/store';
import { c } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { hydrated } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const ready = hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="schedule" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="features" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="focus" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="browse/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <GateProvider>
          <Root />
        </GateProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
