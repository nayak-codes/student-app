// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FeedList from '../../src/components/feed/FeedList';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getTotalUnreadCount } from '../../src/services/chatService';
import { testFirebaseConnection } from '../../src/utils/testFirebase';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useFriendRequests } from '../../src/hooks/useFriendRequests';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { colors, isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Collapsible Header Logic
  const scrollY = useRef(new Animated.Value(0)).current;
  const diffClamp = Animated.diffClamp(scrollY, 0, 110); // Header height approx 110 (Status Bar + Header)
  const translateY = diffClamp.interpolate({
    inputRange: [0, 110],
    outputRange: [0, -110],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Collapsible Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: isDark ? '#333' : colors.border,
            transform: [{ translateY }],
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            elevation: 4,
          }
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 16, paddingBottom: 6 }}>
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>Vidhyardi</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/screens/universal-search')}
              >
                <Ionicons name="search-outline" size={26} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={26} color={colors.text} />
                {requestCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/conversations')}
              >
                <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={[styles.chatBadge, { borderColor: isDark ? colors.background : '#FFF' }]}>
                    <Text style={styles.chatBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Main Feed Content */}
      <FeedList
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={{ paddingTop: 110 }}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff', // Dynamic
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 6,
    borderBottomWidth: 1,
    // borderBottomColor: '#F1F5F9', // Dynamic
    // backgroundColor: '#fff', // Dynamic
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 24, // Larger for brand
    fontWeight: '800', // Extra bold
    color: '#4F46E5', // Using similar to primary color for consistency, or we can make it dynamic
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
    // borderColor: '#FFF', // Dynamic
  },
  chatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
});