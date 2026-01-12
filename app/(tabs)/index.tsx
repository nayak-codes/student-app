// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FeedList from '../../src/components/feed/FeedList';
import { useAuth } from '../../src/contexts/AuthContext';
import { testFirebaseConnection } from '../../src/utils/testFirebase';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  // Test Firebase connection on mount
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Standard App Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>Vidhyardhi</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/screens/universal-search')}
          >
            <Ionicons name="search-outline" size={26} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={26} color="#0F172A" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Navigate to chat screen when implemented
              console.log('Chat button pressed');
            }}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feed Content */}
      <FeedList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24, // Larger for brand
    fontWeight: '800', // Extra bold
    color: '#3F51B5', // Primary brand color
    fontFamily: 'System', // Use default system font or custom if available
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});
