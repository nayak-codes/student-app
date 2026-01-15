import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../src/contexts/AuthContext';

// Prevent splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false, // Default to no header as most screens have custom headers
            animation: 'slide_from_right'
          }}
        >
          {/* Main Tab Navigation */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Auth Screens */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />

          {/* Feature Screens */}
          <Stack.Screen name="post-event" options={{ headerShown: false }} />
          <Stack.Screen name="document-detail" options={{ headerShown: false }} />
          <Stack.Screen name="document-vault" options={{ headerShown: false }} />
          <Stack.Screen name="full-profile" options={{ headerShown: false }} />
          <Stack.Screen name="public-profile" options={{ headerShown: false }} />

          {/* Fallback for other routes */}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
