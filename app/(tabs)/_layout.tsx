import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 4,
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Events Tab */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />

      {/* Chitki Tab */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Chitki',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />

      {/* Library Tab - Guaranteed to work */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="library-books" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}