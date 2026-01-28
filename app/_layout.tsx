import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import GlobalVideoPlayer from '../src/components/GlobalVideoPlayer';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { VideoPlayerProvider } from '../src/contexts/VideoPlayerContext';
import { registerForPushNotificationsAsync } from '../src/services/notificationService';

// Prevent splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inPublicGroup =
      segments.includes('login') ||
      segments.includes('signup') ||
      segments.length === 0 ||
      (segments.length === 1 && segments[0] === 'index');

    if (!user && !inPublicGroup) {
      router.replace('/login');
    }
  }, [user, loading, segments]);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync(user.uid);
    }
  }, [user]);

  return (
    <NavThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <>
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

          {/* Messaging, Groups & Pages */}
          <Stack.Screen name="create-group" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="create-page" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="browse-pages" options={{ headerShown: false }} />
          <Stack.Screen name="group-chat" options={{ headerShown: false }} />
          <Stack.Screen name="group-info" options={{ headerShown: false }} />
          <Stack.Screen name="page-chat" options={{ headerShown: false }} />
          <Stack.Screen name="select-members" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <GlobalVideoPlayer />
      </>
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
        <VideoPlayerProvider>
          <RootLayoutNav />
        </VideoPlayerProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
