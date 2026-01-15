import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/contexts/ThemeContext';

// Prevent splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme } = useTheme();
  return (
    <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />

        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />

        <Stack.Screen name="post-event" options={{ headerShown: false }} />
        <Stack.Screen name="document-detail" options={{ headerShown: false }} />
        <Stack.Screen name="document-vault" options={{ headerShown: false }} />
        <Stack.Screen name="full-profile" options={{ headerShown: false }} />
        <Stack.Screen name="public-profile" options={{ headerShown: false }} />

        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="content/[type]" options={{ headerShown: false }} />

        <Stack.Screen name="playlists/index" options={{ headerShown: false }} />
        <Stack.Screen name="playlists/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="playlists/liked" options={{ headerShown: false }} />
        <Stack.Screen name="playlists/saved" options={{ headerShown: false }} />
        <Stack.Screen name="playlists/watch-later" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
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
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </AuthProvider>
  );
}
