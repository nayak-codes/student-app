// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeedList from '../../src/components/feed/FeedList';
import { useAuth } from '../../src/contexts/AuthContext';
import { getTotalUnreadCount } from '../../src/services/chatService';
import { testFirebaseConnection } from '../../src/utils/testFirebase';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { NotificationsModal } from '../../src/components/NotificationsModal';
import { useFriendRequests } from '../../src/hooks/useFriendRequests';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Friend Requests Logic
  const {
    pendingRequests,
    count: requestCount,
    loadRequests,
    handleAccept,
    handleReject
  } = useFriendRequests();

  // Refresh requests when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  // Test Firebase connection on mount
  useEffect(() => {
    testFirebaseConnection();
  }, []);

  // Load unread count
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        const count = await getTotalUnreadCount(user.uid);
        setUnreadCount(count);
      };
      loadUnreadCount();

      // Refresh unread count every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={26} color="#0F172A" />
            {requestCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/conversations')}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#0F172A" />
            {unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Feed Content */}
      <FeedList />

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        pendingRequests={pendingRequests}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </SafeAreaView>
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
    paddingHorizontal: 16, // Standard spacing
    paddingVertical: 8, // Tighter vertical padding
    backgroundColor: '#fff', // Flat background
    // No border bottom for seamless look
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
  chatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
});
